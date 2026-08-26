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

// Borra todas las fotos de evolución física (fila en la tabla + archivo en
// Storage) para volver a empezar desde el Día 1 — solo esta sección, no
// toca rachas, dieta ni rutinas.
export const useResetProgressPhotos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data: rows, error: fetchError } = await supabase
        .from("progress_photos")
        .select("storage_path")
        .eq("user_id", user.id);
      if (fetchError) throw new Error(fetchError.message);

      const paths = (rows ?? []).map((r) => r.storage_path as string);
      if (paths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove(paths);
        if (removeError) throw new Error(removeError.message);
      }

      const { error: deleteError } = await supabase
        .from("progress_photos")
        .delete()
        .eq("user_id", user.id);
      if (deleteError) throw new Error(deleteError.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};
