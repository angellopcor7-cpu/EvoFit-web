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
