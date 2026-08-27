"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// Borra la dieta activa, el historial de entrenamientos/rachas y "Mis
// rutinas" del usuario. No toca Metas ni las fotos de evolución física —
// el usuario solo pidió reiniciar dieta + estadísticas + rutinas.
export const useResetProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Orden importa: workout_completions puede referenciar user_routines,
      // así que se borra primero para no chocar con la restricción de clave
      // foránea al eliminar las rutinas.
      const { error: completionsError } = await supabase
        .from("workout_completions")
        .delete()
        .eq("user_id", user.id);
      if (completionsError) throw new Error(completionsError.message);

      const { error: routinesError } = await supabase
        .from("user_routines")
        .delete()
        .eq("user_id", user.id);
      if (routinesError) throw new Error(routinesError.message);

      const { error: dietError } = await supabase
        .from("user_diet_plans")
        .delete()
        .eq("user_id", user.id);
      if (dietError) throw new Error(dietError.message);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          current_streak: 0,
          longest_streak: 0,
          last_active_date: null,
        })
        .eq("id", user.id);
      if (profileError) throw new Error(profileError.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      queryClient.invalidateQueries({ queryKey: ["workoutCompletions", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["userRoutines", "list"] });
      queryClient.invalidateQueries({ queryKey: ["dietPlans", "active"] });
    },
  });
};

// Reinicio TOTAL de la cuenta: borra absolutamente todo lo que el usuario
// ha generado dentro de la app (entrenamientos, dieta, rutinas propias,
// metas, plan semanal, fotos de evolución, notificaciones, foto de
// perfil) y regresa el perfil al estado de un usuario recién registrado
// (sin datos corporales, sin onboarding completado, con todos los
// tutoriales por verse de nuevo). No borra la cuenta de autenticación en
// sí (correo/contraseña) — solo el contenido dentro de EvoFit.
export const useResetEverything = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // 1) Tablas con datos del usuario, en el orden que respeta llaves
      // foráneas (completions/plan-meals antes que sus padres).
      const deletions: Array<{ table: string; column: string }> = [
        { table: "workout_completions", column: "user_id" },
        { table: "user_weekly_plan", column: "user_id" }, // referencia user_routines, debe ir antes
        { table: "user_diet_plans", column: "user_id" }, // cascada a user_diet_plan_meals
        { table: "user_routines", column: "user_id" }, // cascada a user_routine_exercises
        { table: "user_goals", column: "user_id" },
        { table: "user_notifications", column: "user_id" },
        { table: "push_subscriptions", column: "user_id" },
      ];
      for (const { table, column } of deletions) {
        const { error } = await supabase.from(table).delete().eq(column, user.id);
        if (error) throw new Error(`${table}: ${error.message}`);
      }

      // 2) Fotos de evolución física: borrar archivos en Storage y luego
      // las filas.
      const { data: photoRows, error: photosFetchError } = await supabase
        .from("progress_photos")
        .select("storage_path")
        .eq("user_id", user.id);
      if (photosFetchError) throw new Error(photosFetchError.message);
      const photoPaths = (photoRows ?? []).map((r) => r.storage_path as string);
      if (photoPaths.length > 0) {
        await supabase.storage.from("progress-photos").remove(photoPaths);
      }
      const { error: photosDeleteError } = await supabase
        .from("progress_photos")
        .delete()
        .eq("user_id", user.id);
      if (photosDeleteError) throw new Error(photosDeleteError.message);

      // 3) Foto de perfil: intenta borrar ambas extensiones posibles (no
      // falla si no existe ninguna).
      await supabase.storage
        .from("avatars")
        .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`]);

      // 4) Perfil de vuelta a estado inicial: sin datos corporales, sin
      // onboarding completado, todos los tutoriales por verse de nuevo,
      // sin bloqueo biométrico de fotos, notificaciones en su default.
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          current_streak: 0,
          longest_streak: 0,
          last_active_date: null,
          weight_kg: null,
          height_cm: null,
          age: null,
          sex: null,
          body_type: null,
          allergies: null,
          weekly_workout_goal: null,
          avatar_url: null,
          has_seen_welcome: false,
          has_completed_onboarding: false,
          has_seen_workouts_tutorial: false,
          has_seen_home_tutorial: false,
          has_seen_progreso_tutorial: false,
          has_seen_metas_tutorial: false,
          has_seen_perfil_tutorial: false,
          require_photo_auth: false,
          photo_auth_credential_id: null,
          notify_workout_reminder: true,
          notify_diet_reminder: true,
        })
        .eq("id", user.id);
      if (profileError) throw new Error(profileError.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};
