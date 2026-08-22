import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const today = toDateOnly(new Date());
  const todayStartIso = `${today}T00:00:00Z`;

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select(
      "id,last_active_date,notify_workout_reminder,notify_diet_reminder",
    );
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
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
        const title = "No rompas tu racha 🔥";
        const body = "Todavía no registras un entrenamiento hoy. ¡Un rato basta!";
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

  return NextResponse.json({ ok: true, workoutReminders, dietReminders });
}
