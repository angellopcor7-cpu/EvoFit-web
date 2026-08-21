"use client";

import { useRef, useState } from "react";
import {
  LogOut,
  Flame,
  TrendingUp,
  Dumbbell,
  Settings,
  Camera,
  Images,
  Lock,
  Loader2,
  AlertTriangle,
  RotateCcw,
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
import { useAuthSession, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { useLogout } from "@/hooks/useAuthActions";
import { useResetProgress } from "@/hooks/useResetProgress";
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
  const uploadAvatar = useUploadAvatar();
  const resetProgress = useResetProgress();
  const { data: stats } = useWorkoutStats();
  const { data: photosData } = useProgressPhotos();
  const uploadPhoto = useUploadProgressPhoto();
  const profile = data?.profile;
  const initial = profile?.displayName?.trim().charAt(0).toUpperCase() ?? "A";

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const avatarCameraInputRef = useRef<HTMLInputElement>(null);
  const avatarGalleryInputRef = useRef<HTMLInputElement>(null);
  const [pendingMilestone, setPendingMilestone] = useState<number | null>(null);
  const [viewingSlot, setViewingSlot] = useState<MilestoneSlot | null>(null);
  const [pickerSlot, setPickerSlot] = useState<MilestoneSlot | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

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

  const handleAvatarTakePhoto = () => {
    setAvatarPickerOpen(false);
    avatarCameraInputRef.current?.click();
  };

  const handleAvatarChooseFromGallery = () => {
    setAvatarPickerOpen(false);
    avatarGalleryInputRef.current?.click();
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    uploadAvatar.mutate(
      { file },
      {
        onSuccess: () => toast.success("Foto de perfil actualizada"),
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : "No se pudo guardar la foto",
          ),
      },
    );
  };

  const handleResetProgress = () => {
    resetProgress.mutate(undefined, {
      onSuccess: () => {
        toast.success("Tu progreso se reinició");
        setResetConfirmOpen(false);
        setEditOpen(false);
      },
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : "No se pudo reiniciar tu progreso",
        ),
    });
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
    setPickerSlot(slot);
  };

  const handleTakePhoto = () => {
    if (!pickerSlot) return;
    setPendingMilestone(pickerSlot.index);
    setPickerSlot(null);
    cameraInputRef.current?.click();
  };

  const handleChooseFromGallery = () => {
    if (!pickerSlot) return;
    setPendingMilestone(pickerSlot.index);
    setPickerSlot(null);
    galleryInputRef.current?.click();
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
        <button
          type="button"
          className={styles.avatar}
          onClick={openEdit}
          aria-label="Configurar perfil"
        >
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt="Foto de perfil"
              className={styles.avatarImg}
            />
          ) : (
            initial
          )}
          <span className={styles.avatarBadge}>
            <Camera size={12} />
          </span>
        </button>
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
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.hiddenFileInput}
          onChange={handleFileChange}
        />
        <input
          ref={galleryInputRef}
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

      <Dialog open={pickerSlot !== null} onOpenChange={(open) => !open && setPickerSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pickerSlot?.label}</DialogTitle>
            <DialogDescription>Elige cómo quieres agregar la foto.</DialogDescription>
          </DialogHeader>
          <div className={styles.pickerOptions}>
            <button
              type="button"
              className={styles.pickerOption}
              onClick={handleTakePhoto}
            >
              <Camera size={20} />
              Tomar foto
            </button>
            <button
              type="button"
              className={styles.pickerOption}
              onClick={handleChooseFromGallery}
            >
              <Images size={20} />
              Elegir de galería
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={avatarPickerOpen} onOpenChange={setAvatarPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foto de perfil</DialogTitle>
            <DialogDescription>Elige cómo quieres agregar la foto.</DialogDescription>
          </DialogHeader>
          <div className={styles.pickerOptions}>
            <button
              type="button"
              className={styles.pickerOption}
              onClick={handleAvatarTakePhoto}
            >
              <Camera size={20} />
              Tomar foto
            </button>
            <button
              type="button"
              className={styles.pickerOption}
              onClick={handleAvatarChooseFromGallery}
            >
              <Images size={20} />
              Elegir de galería
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <input
        ref={avatarCameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className={styles.hiddenFileInput}
        onChange={handleAvatarFileChange}
      />
      <input
        ref={avatarGalleryInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenFileInput}
        onChange={handleAvatarFileChange}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Cambia el nombre que otros ven de ti.</DialogDescription>
          </DialogHeader>
          <div className={styles.editForm}>
            <div className={styles.avatarEditRow}>
              <div className={styles.avatarPreview}>
                {uploadAvatar.isPending ? (
                  <Loader2 size={20} className={styles.milestoneSpinner} />
                ) : profile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt="Foto de perfil"
                    className={styles.avatarImg}
                  />
                ) : (
                  initial
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAvatarPickerOpen(true)}
                disabled={uploadAvatar.isPending}
              >
                <Camera size={14} /> Cambiar foto
              </Button>
            </div>
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

            <div className={styles.dangerZone}>
              <Button
                type="button"
                variant="outline"
                className={styles.resetProgressButton}
                onClick={() => setResetConfirmOpen(true)}
              >
                <RotateCcw size={14} /> Reiniciar progreso
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={styles.resetWarningTitle}>
              <AlertTriangle size={18} /> Reiniciar progreso
            </DialogTitle>
            <DialogDescription>
              Esto va a borrar tu dieta actual, tus estadísticas (rachas y
              entrenamientos registrados) y todas tus rutinas guardadas. No se
              puede deshacer. Tus metas y tus fotos de evolución física no se
              tocan.
            </DialogDescription>
          </DialogHeader>
          <div className={styles.editForm}>
            <Button
              type="button"
              variant="destructive"
              className={styles.saveProfileButton}
              onClick={handleResetProgress}
              disabled={resetProgress.isPending}
            >
              {resetProgress.isPending ? "Reiniciando..." : "Sí, reiniciar todo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={styles.saveProfileButton}
              onClick={() => setResetConfirmOpen(false)}
              disabled={resetProgress.isPending}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
