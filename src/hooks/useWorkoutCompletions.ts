"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  type WorkoutCompletion,
  type WorkoutCompletionRow,
  type NewWorkoutCompletionInput,
  type CompleteWorkoutResult,
  mapWorkoutCompletionRow,
} from "@/lib/workoutCompletions";
import type { WorkoutCategory } from "@/lib/workouts";

const STATS_QUERY_KEY = ["workoutCompletions", "stats"];
// Ventana de datos que se trae del servidor: suficiente para cubrir el mes
// calendario actual completo (incluida la semana que empieza en un mes y
// termina en otro) más el desglose por categoría de los últimos 30 días.
const FETCH_WINDOW_DAYS = 65;

export type DayActivity = {
  date: string;
  label: string;
  count: number;
  isToday: boolean;
};

export type CalendarDay = {
  date: string;
  dayOfMonth: number;
  count: number;
  isToday: boolean;
};

export type CategoryBreakdownEntry = {
  category: WorkoutCategory;
  count: number;
};

export type WorkoutStats = {
  totalCount: number;
  last7Days: DayActivity[];
  calendarMonthLabel: string;
  calendarDays: CalendarDay[];
  categoryBreakdown: CategoryBreakdownEntry[];
  recent: WorkoutCompletion[];
};

const WEEKDAY_LABEL_MONDAY_FIRST = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_LABEL = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Lunes de la semana calendario a la que pertenece `date` (0=domingo en JS,
// así que lo convertimos a "días desde el lunes").
function mondayOf(date: Date): Date {
  const d = new Date(date);
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return d;
}

const emptyStats: WorkoutStats = {
  totalCount: 0,
  last7Days: [],
  calendarMonthLabel: "",
  calendarDays: [],
  categoryBreakdown: [],
  recent: [],
};

export const useWorkoutStats = () => {
  return useQuery({
    queryKey: STATS_QUERY_KEY,
    queryFn: async (): Promise<WorkoutStats> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return emptyStats;

      const { count, error: countError } = await supabase
        .from("workout_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (countError) throw new Error(countError.message);

      const since = new Date();
      since.setDate(since.getDate() - FETCH_WINDOW_DAYS);

      const { data, error } = await supabase
        .from("workout_completions")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", since.toISOString())
        .order("completed_at", { ascending: false });
      if (error) throw new Error(error.message);

      const completions = ((data ?? []) as WorkoutCompletionRow[]).map(
        mapWorkoutCompletionRow,
      );

      // Cuenta TODOS los entrenamientos de cada fecha (no solo el primero) —
      // así un día con 2+ entrenamientos se refleja completo en la gráfica.
      const countByDate = new Map<string, number>();
      for (const completion of completions) {
        const dateStr = toDateOnly(new Date(completion.completedAt));
        countByDate.set(dateStr, (countByDate.get(dateStr) ?? 0) + 1);
      }

      const today = new Date();
      const todayStr = toDateOnly(today);

      // Semana calendario de lunes a domingo (no una ventana móvil de 7 días).
      const weekStart = mondayOf(today);
      const last7Days: DayActivity[] = Array.from({ length: 7 }).map((_, index) => {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + index);
        const dateStr = toDateOnly(day);
        return {
          date: dateStr,
          label: WEEKDAY_LABEL_MONDAY_FIRST[index],
          count: countByDate.get(dateStr) ?? 0,
          isToday: dateStr === todayStr,
        };
      });

      // Calendario del mes actual (para el vistazo tipo "racha en el mes").
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const calendarDays: CalendarDay[] = Array.from({ length: daysInMonth }).map(
        (_, index) => {
          const dayOfMonth = index + 1;
          const day = new Date(year, month, dayOfMonth);
          const dateStr = toDateOnly(day);
          return {
            date: dateStr,
            dayOfMonth,
            count: countByDate.get(dateStr) ?? 0,
            isToday: dateStr === todayStr,
          };
        },
      );

      const categoryCounts = new Map<WorkoutCategory, number>();
      for (const completion of completions) {
        categoryCounts.set(
          completion.category,
          (categoryCounts.get(completion.category) ?? 0) + 1,
        );
      }
      const categoryBreakdown: CategoryBreakdownEntry[] = Array.from(
        categoryCounts.entries(),
      )
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalCount: count ?? 0,
        last7Days,
        calendarMonthLabel: MONTH_LABEL[month],
        calendarDays,
        categoryBreakdown,
        recent: completions.slice(0, 8),
      };
    },
  });
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? "Algo salió mal");
  }
  return json as T;
}

export const useCompleteWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewWorkoutCompletionInput) =>
      postJson<CompleteWorkoutResult>("/api/workouts/complete", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
};
