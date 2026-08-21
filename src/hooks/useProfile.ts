"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  hasSeenWelcome: boolean;
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
