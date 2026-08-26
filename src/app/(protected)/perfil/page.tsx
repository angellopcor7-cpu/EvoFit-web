"use client";

import { useEffect, useRef, useState } from "react";
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
  Bell,
  BellOff,
  Pencil,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  BodyDataForm,
  emptyBodyDataFormValue,
  type BodyDataFormValue,
} from "@/components/BodyDataForm";
import {
  useAuthSession,
  useUpdateProfile,
  useUploadAvatar,
  useUpdateNotificationPreferences,
  useSaveBodyProfile,
  useMarkTutorialSeen,
  BODY_TYPE_LABEL,
  SEX_LABEL,
  type Profile,
} from "@/hooks/useProfile";
import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSendTestNotification } from "@/hooks/useNotifications";
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

function toBodyDataFormValue(profile: Profile | null | undefined): BodyDataFormValue {
  if (!profile) return emptyBodyDataFormValue();
  return {
    weightKg: profile.weightKg !== null ? String(profile.weightKg) : "",
    heightCm: profile.heightCm !== null ? String(profile.heightCm) : "",
    age: profile.age !== null ? String(profile.age) : "",
    sex: profile.sex,
    weeklyWorkoutGoal: profile.weeklyWorkoutGoal,
    bodyType: profile.bodyType,
    allergies: profile.allergies ?? "",
  };
}

export default function PerfilPage() {
  const router = useRouter();
  const { data } = useAuthSession();
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const resetProgress = useResetProgress();
  const saveBodyProfile = useSaveBodyProfile();
  const updateNotificationPrefs = useUpdateNotificationPreferences();
  const push = usePushNotifications();
  const sendTestNotification = useSendTestNotification();
  const { data: stats } = useWorkoutStats();
  const { data: photosData } = useProgressPhotos();
  const uploadPhoto = useUploadProgressPhoto();
  const markTutorialSeen = useMarkTutorialSeen("perfil");
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
  const [bodyDataEditing, setBodyDataEditing] = useState(false);
  const [bodyData, setBodyData] = useState<BodyDataFormValue>(emptyBodyDataFormValue());
  const [tourOpen, setTourOpen] = useState(false);
  const [tourDismissedThisVisit, setTourDismissedThisVisit] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const statsCardRef = useRef<HTMLDivElement>(null);
  const evolutionSectionRef = useRef<HTMLDivElement>(null);

  const openEdit = () => {
    setEditName(profile?.displayName ?? "");
    setBodyData(toBodyDataFormValue(profile));
    setBodyDataEditing(false);
    setEditOpen(true);
  };

  const parseNumber = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSaveBodyData = () => {
    saveBodyProfile.mutate(
      {
        weightKg: parseNumber(bodyData.weightKg),
        heightCm: parseNumber(bodyData.heightCm),
        age: parseNumber(bodyData.age),
        sex: bodyData.sex,
        bodyType: bodyData.bodyType,
        allergies: bodyData.allergies.trim() || null,
        weeklyWorkoutGoal: bodyData.weeklyWorkoutGoal,
      },
      {
        onSuccess: () => {
          toast.success("Datos guardados");
          setBodyDataEditing(false);
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "No se pudo guardar"),
      },
    );
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

  const handleTogglePush = async () => {
    if (push.subscribed) {
      await push.disable();
      toast.success("Notificaciones push desactivadas");
    } else {
      await push.enable();
      if (push.error) {
        toast.error(push.error);
      } else {
        toast.success("Notificaciones push activadas");
      }
    }
  };

  const handleToggleWorkoutReminder = (checked: boolean) => {
    updateNotificationPrefs.mutate(
      { notifyWorkoutReminder: checked },
      { onError: () => toast.error("No se pudo guardar la preferencia") },
    );
  };

  const handleToggleDietReminder = (checked: boolean) => {
    updateNotificationPrefs.mutate(
      { notifyDietReminder: checked },
      { onError: () => toast.error("No se pudo guardar la preferencia") },
    );
  };

  const handleSendTestNotification = () => {
    sendTestNotification.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(
          result.pushSent > 0
            ? "Notificación de prueba enviada — revisa la campana y el push"
            : "Notificación de prueba enviada — revisa la campana (el push no llegó, ¿lo activaste?)",
        );
      },
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : "No se pudo mandar la prueba",
        ),
    });
  };

  const slots = buildMilestoneSlots(photosData?.photos ?? []);

  useEffect(() => {
    if (!profile) return;
    if (profile.hasSeenPerfilTutorial) return;
    if (tourDismissedThisVisit) return;
    const timeout = setTimeout(() => setTourOpen(true), 300);
    return () => clearTimeout(timeout);
  }, [profile, tourDismissedThisVisit]);

  const closeTour = () => {
    setTourOpen(false);
    setTourDismissedThisVisit(true);
  };

  const handleTourFinish = () => closeTour();
  const handleTourNeverShowAgain = () => {
    closeTour();
    markTutorialSeen.mutate();
  };

  const tourSteps: TourStep[] = [
    {
      ref: editButtonRef,
      title: "Edita tu perfil",
      description:
        "Aquí cambias tu nombre, foto, datos corporales y preferencias de notificaciones.",
    },
    {
      ref: statsCardRef,
      title: "Tus estadísticas",
      description:
        "Racha actual, mejor racha y el total de entrenamientos que has completado.",
    },
    {
      ref: evolutionSectionRef,
      title: "Evolución física",
      description:
        "Sube una foto el día 1 y luego una cada mes para ver cómo cambia tu cuerpo con el tiempo.",
    },
  ];

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
          ref={editButtonRef}
        >
          <Settings size={14} /> Editar perfil
        </Button>
      </div>

      <div className={styles.statsCard} ref={statsCardRef}>
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

      <div className={styles.evolutionSection} ref={evolutionSectionRef}>
        <div className={styles.evolutionHeader}>
          <div className={styles.evolutionTitleRow}>
            <h2 className={styles.evolutionTitle}>Evolución física</h2>
            <span className={styles.evolutionCount}>
              {slots.filter((s) => s.status === "taken").length}/{slots.length}
            </span>
          </div>
          <p className={styles.evolutionSubtitle}>
            Una foto el día 1, y luego una cada mes hasta completar el año.
          </p>
          <div className={styles.privacyNote}>
            <Lock size={12} />
            <span>Privado — solo tú puedes ver estas fotos.</span>
          </div>
        </div>
        <div className={styles.evolutionScroll}>
          {slots.map((slot) => {
            const isUploading =
              uploadPhoto.isPending && pendingMilestone === slot.index;
            const daysLeft =
              slot.status === "locked" && slot.unlocksAt
                ? Math.max(
                    0,
                    Math.ceil(
                      (slot.unlocksAt.getTime() - Date.now()) / 86_400_000,
                    ),
                  )
                : null;
            return (
              <button
                key={slot.index}
                type="button"
                className={`${styles.milestoneCard} ${
                  slot.status === "locked" ? styles.milestoneCardLocked : ""
                } ${slot.status === "available" ? styles.milestoneCardAvailable : ""}`}
                onClick={() => handleSlotClick(slot)}
                disabled={isUploading}
              >
                <div
                  className={`${styles.milestoneThumb} ${
                    slot.status === "taken" ? styles.milestoneThumbTaken : ""
                  }`}
                >
                  {slot.status === "taken" && slot.photo?.url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slot.photo.url}
                        alt={slot.label}
                        className={styles.milestoneImg}
                      />
                      <span className={styles.milestoneCheck}>
                        <Check size={10} />
                      </span>
                    </>
                  ) : isUploading ? (
                    <Loader2 size={18} className={styles.milestoneSpinner} />
                  ) : slot.status === "locked" ? (
                    <Lock size={16} />
                  ) : (
                    <Camera size={18} />
                  )}
                </div>
                <span className={styles.milestoneLabel}>{slot.label}</span>
                {daysLeft !== null && (
                  <span className={styles.milestoneCountdown}>
                    {daysLeft === 0 ? "Mañana" : `${daysLeft}d`}
                  </span>
                )}
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

            <div className={styles.notificationsSection}>
              <h3 className={styles.notificationsTitle}>Datos corporales</h3>

              {bodyDataEditing ? (
                <>
                  <BodyDataForm
                    value={bodyData}
                    onChange={(patch) => setBodyData((prev) => ({ ...prev, ...patch }))}
                  />
                  <Button
                    type="button"
                    className={styles.saveProfileButton}
                    onClick={handleSaveBodyData}
                    disabled={saveBodyProfile.isPending}
                  >
                    {saveBodyProfile.isPending ? "Guardando..." : "Guardar datos"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBodyDataEditing(false)}
                    disabled={saveBodyProfile.isPending}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <div className={styles.bodyDataList}>
                    <div className={styles.bodyDataRow}>
                      <span className={styles.notificationRowLabel}>Edad</span>
                      <span className={styles.notificationRowHint}>
                        {profile?.age ?? "Sin datos"}
                      </span>
                    </div>
                    <div className={styles.bodyDataRow}>
                      <span className={styles.notificationRowLabel}>Peso</span>
                      <span className={styles.notificationRowHint}>
                        {profile?.weightKg ? `${profile.weightKg} kg` : "Sin datos"}
                      </span>
                    </div>
                    <div className={styles.bodyDataRow}>
                      <span className={styles.notificationRowLabel}>Estatura</span>
                      <span className={styles.notificationRowHint}>
                        {profile?.heightCm ? `${profile.heightCm} cm` : "Sin datos"}
                      </span>
                    </div>
                    <div className={styles.bodyDataRow}>
                      <span className={styles.notificationRowLabel}>Sexo</span>
                      <span className={styles.notificationRowHint}>
                        {profile?.sex ? SEX_LABEL[profile.sex] : "Sin datos"}
                      </span>
                    </div>
                    <div className={styles.bodyDataRow}>
                      <span className={styles.notificationRowLabel}>Tipo de cuerpo</span>
                      <span className={styles.notificationRowHint}>
                        {profile?.bodyType ? BODY_TYPE_LABEL[profile.bodyType] : "Sin datos"}
                      </span>
                    </div>
                    <div className={styles.bodyDataRow}>
                      <span className={styles.notificationRowLabel}>Días/semana</span>
                      <span className={styles.notificationRowHint}>
                        {profile?.weeklyWorkoutGoal ?? "Sin datos"}
                      </span>
                    </div>
                    <div className={styles.bodyDataRow}>
                      <span className={styles.notificationRowLabel}>Alergias</span>
                      <span className={styles.notificationRowHint}>
                        {profile?.allergies || "Sin datos"}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBodyDataEditing(true)}
                  >
                    <Pencil size={14} /> Cambiar datos
                  </Button>
                </>
              )}
            </div>

            <div className={styles.notificationsSection}>
              <h3 className={styles.notificationsTitle}>Notificaciones</h3>

              <div className={styles.notificationRow}>
                <div className={styles.notificationRowText}>
                  <span className={styles.notificationRowLabel}>
                    Notificaciones push
                  </span>
                  <span className={styles.notificationRowHint}>
                    {push.supported
                      ? "Avisos aunque no tengas EvoFit abierto"
                      : "Tu navegador no las soporta"}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePush}
                  disabled={!push.supported || push.loading}
                >
                  {push.subscribed ? <BellOff size={14} /> : <Bell size={14} />}
                  {push.subscribed ? "Desactivar" : "Activar"}
                </Button>
              </div>

              <div className={styles.notificationRow}>
                <div className={styles.notificationRowText}>
                  <span className={styles.notificationRowLabel}>
                    Recordatorio de entreno
                  </span>
                  <span className={styles.notificationRowHint}>
                    Si no entrenaste en el día
                  </span>
                </div>
                <Switch
                  checked={profile?.notifyWorkoutReminder ?? true}
                  onCheckedChange={handleToggleWorkoutReminder}
                  disabled={updateNotificationPrefs.isPending}
                />
              </div>

              <div className={styles.notificationRow}>
                <div className={styles.notificationRowText}>
                  <span className={styles.notificationRowLabel}>
                    Recordatorio de dieta
                  </span>
                  <span className={styles.notificationRowHint}>
                    Aviso diario de tu plan de comidas
                  </span>
                </div>
                <Switch
                  checked={profile?.notifyDietReminder ?? true}
                  onCheckedChange={handleToggleDietReminder}
                  disabled={updateNotificationPrefs.isPending}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendTestNotification}
                disabled={sendTestNotification.isPending}
              >
                {sendTestNotification.isPending
                  ? "Enviando..."
                  : "Probar notificación"}
              </Button>
            </div>

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

      {tourOpen && (
        <SpotlightTour
          steps={tourSteps}
          onFinish={handleTourFinish}
          onNeverShowAgain={handleTourNeverShowAgain}
        />
      )}
    </div>
  );
}
