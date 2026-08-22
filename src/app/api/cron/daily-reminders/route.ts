import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPlannedTime } from "@/lib/weeklyPlan";
import { pickMotivationalQuote } from "@/lib/motivation";

// Corre una vez al día (ver vercel.json). Revisa, por cada usuario:
// 1) si no ha entrenado hoy y tiene el recordatorio de entreno activado
// 2) si tiene un plan de dieta activo y tiene el recordatorio de dieta activado
// y para cada caso crea una notificación in-app + intenta mandar un push.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminClient = ReturnType<typeof createAdminClient>;

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("Faltan las claves VAPID (VAPID_PRIVATE_KEY / NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_SUBJECT)");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

async function sendPushToUser(
  admin: AdminClient,
  userId: string,
  payload: { title: string; body: string; url: string; tag: string },
) {
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth_key")
    .eq("user_id", userId);

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth_key },
        },
        JSON.stringify(payload),
      );
    } catch (error) {
      // Suscripción vencida/inválida (el navegador la revocó) — se limpia.
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }
}

async function alreadyNotifiedToday(
  admin: AdminClient,
  userId: string,
  type: "workout_reminder" | "diet_reminder",
  todayStartIso: string,
): Promise<boolean> {
  const { data } = await admin
    .from("user_notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .gte("created_at", todayStartIso)
    .maybeSingle();
  return !!data;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  configureWebPush();

  const now = new Date();
  const today = toDateOnly(now);
  const todayStartIso = `${today}T00:00:00Z`;
  const todayDow = now.getDay();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select(
      "id,last_active_date,notify_workout_reminder,notify_diet_reminder,weekly_workout_goal,current_streak",
    );
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  // Solo los lunes: revisa si cada usuario con meta semanal cumplió su
  // cantidad de entrenamientos la semana pasada (lunes a domingo anterior).
  // Si no la cumplió, se reinicia su racha y se le avisa. Entrenar menos
  // días de los planeados dentro de la semana (ej. descansar el día 6 de 7)
  // nunca rompe la racha por sí solo — solo terminar la semana sin llegar
  // a la meta la rompe, y eso se revisa aquí una vez por semana.
  let streaksLost = 0;
  if (todayDow === 1) {
    const lastWeekStartIso = toDateOnly(new Date(now.getTime() - 7 * 86_400_000));
    const lastWeekEndExclusiveIso = today;

    const { data: completions } = await admin
      .from("workout_completions")
      .select("user_id,completed_at")
      .gte("completed_at", `${lastWeekStartIso}T00:00:00Z`)
      .lt("completed_at", `${lastWeekEndExclusiveIso}T00:00:00Z`);

    const daysTrainedByUser = new Map<string, Set<string>>();
    for (const row of completions ?? []) {
      const day = toDateOnly(new Date(row.completed_at));
      const set = daysTrainedByUser.get(row.user_id) ?? new Set<string>();
      set.add(day);
      daysTrainedByUser.set(row.user_id, set);
    }

    for (const profile of profiles ?? []) {
      if (!profile.weekly_workout_goal || profile.current_streak <= 0) continue;
      const daysTrained = daysTrainedByUser.get(profile.id)?.size ?? 0;
      if (daysTrained >= profile.weekly_workout_goal) continue;

      const { error: resetError } = await admin
        .from("profiles")
        .update({ current_streak: 0 })
        .eq("id", profile.id);
      if (resetError) continue;

      const title = "Perdiste tu racha 💔";
      const body = `La semana pasada entrenaste ${daysTrained} de ${profile.weekly_workout_goal} días que te propusiste. ¡Empieza una nueva racha hoy!`;
      await admin.from("user_notifications").insert({
        user_id: profile.id,
        type: "streak_lost",
        title,
        body,
        link: "/entrenamientos",
      });
      await sendPushToUser(admin, profile.id, {
        title,
        body,
        url: "/entrenamientos",
        tag: "streak_lost",
      });
      streaksLost += 1;
    }
  }

  // Plan semanal de hoy para todos los usuarios de una sola vez, y los
  // títulos de las rutinas que referencia, para poder mencionar "Hoy toca:
  // <rutina>" en el recordatorio en vez de un mensaje genérico.
  const { data: planRows } = await admin
    .from("user_weekly_plan")
    .select("user_id,workout_routine_id,user_routine_id,planned_time")
    .eq("day_of_week", todayDow);

  const planByUser = new Map<
    string,
    { workoutRoutineId: string | null; userRoutineId: string | null; plannedTime: string | null }
  >();
  const workoutRoutineIds = new Set<string>();
  const userRoutineIds = new Set<string>();
  for (const row of planRows ?? []) {
    planByUser.set(row.user_id, {
      workoutRoutineId: row.workout_routine_id,
      userRoutineId: row.user_routine_id,
      plannedTime: row.planned_time,
    });
    if (row.workout_routine_id) workoutRoutineIds.add(row.workout_routine_id);
    if (row.user_routine_id) userRoutineIds.add(row.user_routine_id);
  }

  const routineTitleById = new Map<string, string>();
  if (workoutRoutineIds.size > 0) {
    const { data: routines } = await admin
      .from("workout_routines")
      .select("id,title")
      .in("id", Array.from(workoutRoutineIds));
    for (const r of routines ?? []) routineTitleById.set(r.id, r.title);
  }
  if (userRoutineIds.size > 0) {
    const { data: routines } = await admin
      .from("user_routines")
      .select("id,title")
      .in("id", Array.from(userRoutineIds));
    for (const r of routines ?? []) routineTitleById.set(r.id, r.title);
  }

  let workoutReminders = 0;
  let dietReminders = 0;

  for (const profile of profiles ?? []) {
    if (
      profile.notify_workout_reminder &&
      profile.last_active_date !== today
    ) {
      const alreadySent = await alreadyNotifiedToday(
        admin,
        profile.id,
        "workout_reminder",
        todayStartIso,
      );
      if (!alreadySent) {
        const daysSinceLastActive = profile.last_active_date
          ? Math.floor(
              (now.getTime() - new Date(`${profile.last_active_date}T00:00:00Z`).getTime()) /
                86_400_000,
            )
          : Infinity;

        let title: string;
        let body: string;
        if (daysSinceLastActive >= 2) {
          title = "Te extrañamos por aquí 💪";
          const seed = now.getDate() + (Number.isFinite(daysSinceLastActive) ? daysSinceLastActive : 0);
          body = pickMotivationalQuote(seed);
        } else {
          const plan = planByUser.get(profile.id);
          const routineTitle = plan
            ? routineTitleById.get(plan.workoutRoutineId ?? plan.userRoutineId ?? "")
            : undefined;
          const plannedTime = plan ? formatPlannedTime(plan.plannedTime) : "";
          if (routineTitle) {
            title = "No rompas tu racha 🔥";
            body = `Hoy toca: ${routineTitle}${plannedTime ? ` · ${plannedTime}` : ""}`;
          } else {
            title = "No rompas tu racha 🔥";
            body = "Todavía no registras un entrenamiento hoy. ¡Un rato basta!";
          }
        }

        await admin.from("user_notifications").insert({
          user_id: profile.id,
          type: "workout_reminder",
          title,
          body,
          link: "/entrenamientos",
        });
        await sendPushToUser(admin, profile.id, {
          title,
          body,
          url: "/entrenamientos",
          tag: "workout_reminder",
        });
        workoutReminders += 1;
      }
    }

    if (profile.notify_diet_reminder) {
      const { data: plan } = await admin
        .from("user_diet_plans")
        .select("id")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (plan) {
        const alreadySent = await alreadyNotifiedToday(
          admin,
          profile.id,
          "diet_reminder",
          todayStartIso,
        );
        if (!alreadySent) {
          const title = "Tu menú de hoy está listo 🍽️";
          const body = "No olvides seguir tu plan de comidas de hoy.";
          await admin.from("user_notifications").insert({
            user_id: profile.id,
            type: "diet_reminder",
            title,
            body,
            link: "/dieta",
          });
          await sendPushToUser(admin, profile.id, {
            title,
            body,
            url: "/dieta",
            tag: "diet_reminder",
          });
          dietReminders += 1;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, workoutReminders, dietReminders, streaksLost });
}
