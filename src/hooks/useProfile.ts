"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export const BODY_TYPES = ["ectomorfo", "mesomorfo", "endomorfo"] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const BODY_TYPE_LABEL: Record<BodyType, string> = {
  ectomorfo: "Ectomorfo",
  mesomorfo: "Mesomorfo",
  endomorfo: "Endomorfo",
};

// Explicación corta para que la persona pueda identificar su tipo de cuerpo
// sin salir del onboarding — a petición del usuario, que notó que alguien
// llenando sus datos no sabía cuál de los tres le tocaba.
export const BODY_TYPE_DESCRIPTION: Record<BodyType, string> = {
  ectomorfo:
    "Delgado de forma natural, cuesta subir de peso o músculo, extremidades largas y metabolismo rápido.",
  mesomorfo:
    "Complexión atlética, gana músculo con relativa facilidad, hombros más anchos que la cintura.",
  endomorfo:
    "Complexión más robusta o redondeada, sube de peso con facilidad, metabolismo más lento.",
};

export const SEX_OPTIONS = ["hombre", "mujer", "no_binario"] as const;
export type Sex = (typeof SEX_OPTIONS)[number];

export const SEX_LABEL: Record<Sex, string> = {
  hombre: "Hombre",
  mujer: "Mujer",
  no_binario: "No binario",
};

export type Profile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  hasSeenWelcome: boolean;
  hasSeenWorkoutsTutorial: boolean;
  hasSeenHomeTutorial: boolean;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  sex: Sex | null;
  bodyType: BodyType | null;
  allergies: string | null;
  weeklyWorkoutGoal: number | null;
  hasCompletedOnboarding: boolean;
  notifyWorkoutReminder: boolean;
  notifyDietReminder: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  has_seen_welcome: boolean;
  has_seen_workouts_tutorial: boolean;
  has_seen_home_tutorial: boolean;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  sex: string | null;
  body_type: string | null;
  allergies: string | null;
  weekly_workout_goal: number | null;
  has_completed_onboarding: boolean;
  notify_workout_reminder: boolean;
  notify_diet_reminder: boolean;
  created_at: string;
  updated_at: string;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActiveDate: row.last_active_date,
    hasSeenWelcome: row.has_seen_welcome,
    hasSeenWorkoutsTutorial: row.has_seen_workouts_tutorial,
    hasSeenHomeTutorial: row.has_seen_home_tutorial,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    age: row.age,
    sex: (row.sex as Sex | null) ?? null,
    bodyType: (row.body_type as BodyType | null) ?? null,
    allergies: row.allergies,
    weeklyWorkoutGoal: row.weekly_workout_goal,
    hasCompletedOnboarding: row.has_completed_onboarding,
    notifyWorkoutReminder: row.notify_workout_reminder,
    notifyDietReminder: row.notify_diet_reminder,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchSessionAndProfile(): Promise<{
  profile: Profile | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { profile: null };

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return { profile: data ? mapProfile(data as ProfileRow) : null };
}

// Equivalent of the old useAuthSession hook — "is there a logged-in user,
// and what's their profile" — but now backed directly by Supabase auth
// instead of a custom cookie/session endpoint.
export const useAuthSession = () => {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: fetchSessionAndProfile,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { displayName: string }): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: input.displayName })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
};

export const useMarkWelcomeSeen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({ has_seen_welcome: true })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
};

export const useMarkWorkoutsTutorialSeen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({ has_seen_workouts_tutorial: true })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
};

export const useMarkHomeTutorialSeen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({ has_seen_home_tutorial: true })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
};

export const useSaveBodyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      weightKg: number | null;
      heightCm: number | null;
      age: number | null;
      sex: Sex | null;
      bodyType: BodyType | null;
      allergies: string | null;
      weeklyWorkoutGoal: number | null;
    }): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({
          weight_kg: input.weightKg,
          height_cm: input.heightCm,
          age: input.age,
          sex: input.sex,
          body_type: input.bodyType,
          allergies: input.allergies,
          weekly_workout_goal: input.weeklyWorkoutGoal,
          has_completed_onboarding: true,
        })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
};

const AVATARS_BUCKET = "avatars";

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: File }): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const extension = input.file.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/avatar.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(path, input.file, { upsert: true, contentType: input.file.type });
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicData } = supabase.storage
        .from(AVATARS_BUCKET)
        .getPublicUrl(path);
      // Cache-bust: la ruta es siempre la misma (upsert), así que sin esto el
      // navegador podría seguir mostrando la foto vieja tras cambiarla.
      const avatarUrl = `${publicData.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      if (updateError) throw new Error(updateError.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      notifyWorkoutReminder?: boolean;
      notifyDietReminder?: boolean;
    }): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const update: Record<string, boolean> = {};
      if (input.notifyWorkoutReminder !== undefined) {
        update.notify_workout_reminder = input.notifyWorkoutReminder;
      }
      if (input.notifyDietReminder !== undefined) {
        update.notify_diet_reminder = input.notifyDietReminder;
      }

      const { error } = await supabase
        .from("profiles")
        .update(update)
        .eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
};
