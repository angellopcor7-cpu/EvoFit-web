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
