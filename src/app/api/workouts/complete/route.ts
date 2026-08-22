import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { WORKOUT_CATEGORIES } from "@/lib/workouts";

const schema = z.object({
  category: z.enum(WORKOUT_CATEGORIES),
  routineTitle: z.string().min(1).max(200),
  workoutRoutineId: z.string().uuid().nullable().optional(),
  userRoutineId: z.string().uuid().nullable().optional(),
});

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const input = schema.parse(json);

    const { error: insertError } = await supabase
      .from("workout_completions")
      .insert({
        user_id: user.id,
        category: input.category,
        routine_title: input.routineTitle,
        workout_routine_id: input.workoutRoutineId ?? null,
        user_routine_id: input.userRoutineId ?? null,
      });
    if (insertError) throw new Error(insertError.message);

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("current_streak,longest_streak,last_active_date,weekly_workout_goal")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);

    const now = new Date();
    const today = toDateOnly(now);
    const yesterday = toDateOnly(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    const previousStreak = profileRow?.current_streak ?? 0;
    const previousLongest = profileRow?.longest_streak ?? 0;
    const lastActiveDate = profileRow?.last_active_date ?? null;
    const weeklyWorkoutGoal = profileRow?.weekly_workout_goal ?? null;

    let currentStreak: number;
    const alreadyLoggedToday = lastActiveDate === today;

    if (alreadyLoggedToday) {
      currentStreak = previousStreak;
    } else if (weeklyWorkoutGoal !== null) {
      // Con meta semanal activa, la racha no depende de entrenar todos los
      // días seguidos — solo se reinicia si no se cumple la meta de la
      // semana (revisado por el cron de los lunes). Aquí simplemente suma.
      currentStreak = previousStreak + 1;
    } else if (lastActiveDate === yesterday) {
      currentStreak = previousStreak + 1;
    } else {
      currentStreak = 1;
    }

    const longestStreak = Math.max(previousLongest, currentStreak);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: today,
      })
      .eq("id", user.id);
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      currentStreak,
      longestStreak,
      alreadyLoggedToday,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo registrar tu entrenamiento";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
