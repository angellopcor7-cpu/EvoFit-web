"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ProgressPhoto } from "@/lib/progressPhotos";

const QUERY_KEY = ["progress-photos", "list"];
const BUCKET = "progress-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hora

type ProgressPhotoRow = {
  milestone_index: number;
  storage_path: string;
  taken_at: string;
};

export const useProgressPhotos = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<{ photos: ProgressPhoto[] }> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("progress_photos")
        .select("milestone_index, storage_path, taken_at")
        .order("milestone_index", { ascending: true });
      if (error) throw new Error(error.message);

      const rows = (data ?? []) as ProgressPhotoRow[];
      const photos: ProgressPhoto[] = await Promise.all(
        rows.map(async (row) => {
          const { data: signed } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
          return {
            milestoneIndex: row.milestone_index,
            storagePath: row.storage_path,
            takenAt: row.taken_at,
            url: signed?.signedUrl ?? null,
          };
        }),
      );
      return { photos };
    },
  });
};

export const useUploadProgressPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { milestoneIndex: number; file: File }): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const extension = input.file.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/${input.milestoneIndex}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, input.file, { upsert: true, contentType: input.file.type });
      if (uploadError) throw new Error(uploadError.message);

      const { error: dbError } = await supabase.from("progress_photos").upsert(
        {
          user_id: user.id,
          milestone_index: input.milestoneIndex,
          storage_path: path,
          taken_at: new Date().toISOString().slice(0, 10),
        },
        { onConflict: "user_id,milestone_index" },
      );
      if (dbError) throw new Error(dbError.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};
