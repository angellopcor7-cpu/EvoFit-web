"use client";

import { useRef, useState } from "react";
import {
  LogOut,
  Flame,
  TrendingUp,
  Dumbbell,
  Settings,
  Camera,
  Lock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { useAuthSession, useUpdateProfile } from "@/hooks/useProfile";
import { useLogout } from "@/hooks/useAuthActions";
import { useWorkoutStats } from "@/hooks/useWorkoutCompletions";
import { useProgressPhotos, useUploadProgressPhoto } from "@/hooks/useProgressPhotos";
import {
  buildMilestoneSlots,
  formatShortDate,
  type MilestoneSlot,
} from "@/lib/progressPhotos";
import styles from "./page.module.css";

export default function PerfilPage() {
  const router = useRouter();
  const { data } = useAuthSession();
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const { data: stats } = useWorkoutStats();
  const { data: photosData } = useProgressPhotos();
  const uploadPhoto = useUploadProgressPhoto();
  const profile = data?.profile;
  const initial = profile?.displayName?.trim().charAt(0).toUpperCase() ?? "A";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingMilestone, setPendingMilestone] = useState<number | null>(null);
  const [viewingSlot, setViewingSlot] = useState<MilestoneSlot | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");

  const openEdit = () => {
    setEditName(profile?.displayName ?? "");
    setEditOpen(true);
  };

  const handleSaveProfile = () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("Ponle un nombre a tu perfil");
      return;
    }
    updateProfile.mutate(
      { displayName: trimmed },
      {
        onSuccess: () => {
          toast.success("Perfil actualizado");
          setEditOpen(false);
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "No se pudo actualizar"),
      },
    );
  };

  const slots = buildMilestoneSlots(photosData?.photos ?? []);

  const handleSlotClick = (slot: MilestoneSlot) => {
    if (slot.status === "taken") {
      setViewingSlot(slot);
      return;
    }
    if (slot.status === "locked") {
      toast.info(
        slot.unlocksAt
          ? `Disponible a partir del ${formatShortDate(slot.unlocksAt)}`
          : "Todavía no disponible",
      );
      return;
    }
    setPendingMilestone(slot.index);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const milestoneIndex = pendingMilestone;
    event.target.value = "";
    if (!file || milestoneIndex === null) return;

    uploadPhoto.mutate(
      { milestoneIndex, file },
      {
        onSuccess: () => toast.success("Foto guardada"),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "No se pudo guardar la foto"),
      },
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.identity}>
        <div className={styles.avatar}>{initial}</div>
        <h1 className={styles.name}>{profile?.displayName ?? "Atleta"}</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openEdit}
          className={styles.editButton}
        >
          <Settings size={14} /> Editar perfil
        </Button>
      </div>

      <div className={styles.statsCard}>
        <div className={styles.stat}>
          <Flame size={18} className={styles.statIconStreak} />
          <span className={styles.statValue}>
            {profile?.currentStreak ?? 0}
          </span>
          <span className={styles.statLabel}>Racha</span>
        </div>
        <div className={styles.stat}>
          <TrendingUp size={18} className={styles.statIconBest} />
          <span className={styles.statValue}>
            {profile?.longestStreak ?? 0}
          </span>
          <span className={styles.statLabel}>Mejor racha</span>
        </div>
        <div className={styles.stat}>
          <Dumbbell size={18} className={styles.statIconWorkouts} />
          <span className={styles.statValue}>{stats?.totalCount ?? 0}</span>
          <span className={styles.statLabel}>Entrenos</span>
        </div>
      </div>

      <div className={styles.evolutionSection}>
        <div className={styles.evolutionHeader}>
          <h2 className={styles.evolutionTitle}>Evolución física</h2>
          <p className={styles.evolutionSubtitle}>
            Una foto el día 1, y luego una cada mes hasta completar el año.
          </p>
        </div>
        <div className={styles.evolutionScroll}>
          {slots.map((slot) => {
            const isUploading =
              uploadPhoto.isPending && pendingMilestone === slot.index;
            return (
              <button
                key={slot.index}
                type="button"
                className={`${styles.milestoneCard} ${
                  slot.status === "locked" ? styles.milestoneCardLocked : ""
                }`}
                onClick={() => handleSlotClick(slot)}
                disabled={isUploading}
              >
                <div className={styles.milestoneThumb}>
                  {slot.status === "taken" && slot.photo?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.photo.url}
                      alt={slot.label}
                      className={styles.milestoneImg}
                    />
                  ) : isUploading ? (
                    <Loader2 size={18} className={styles.milestoneSpinner} />
                  ) : slot.status === "locked" ? (
                    <Lock size={16} />
                  ) : (
                    <Camera size={18} />
                  )}
                </div>
                <span className={styles.milestoneLabel}>{slot.label}</span>
              </button>
            );
          })}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenFileInput}
          onChange={handleFileChange}
        />
      </div>

      <Button
        type="button"
        variant="destructive"
        onClick={() =>
          logout.mutate(undefined, {
            onSuccess: () => router.replace("/"),
          })
        }
        disabled={logout.isPending}
        className={styles.logoutButton}
      >
        <LogOut size={16} />
        {logout.isPending ? "Cerrando sesión..." : "Cerrar sesión"}
      </Button>

      <Dialog open={viewingSlot !== null} onOpenChange={(open) => !open && setViewingSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingSlot?.label}</DialogTitle>
            <DialogDescription>
              {viewingSlot?.photo ? `Tomada el ${viewingSlot.photo.takenAt}` : ""}
            </DialogDescription>
          </DialogHeader>
          {viewingSlot?.photo?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={viewingSlot.photo.url}
              alt={viewingSlot.label}
              className={styles.viewerImg}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Cambia el nombre que otros ven de ti.</DialogDescription>
          </DialogHeader>
          <div className={styles.editForm}>
            <Input
              placeholder="Tu nombre"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={40}
            />
            <Button
              type="button"
              className={styles.saveProfileButton}
              onClick={handleSaveProfile}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
