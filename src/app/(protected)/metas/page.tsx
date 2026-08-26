"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Spinner } from "@/components/ui/Spinner";
import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  useGoals,
  useCreateGoal,
  useDeleteGoal,
  useUpdateGoalProgress,
} from "@/hooks/useGoals";
import { useAuthSession, useMarkTutorialSeen } from "@/hooks/useProfile";
import {
  GOAL_TYPE_META,
  GOAL_DEADLINE_PRESETS,
  addDaysIso,
  goalProgress,
  goalDeadlineLabel,
  type Goal,
  type GoalType,
} from "@/lib/goals";
import styles from "./page.module.css";

const GOAL_TYPES: GoalType[] = ["peso", "distancia", "repeticiones", "personalizada"];

export default function MetasPage() {
  const { data, isFetching } = useGoals();
  const { data: sessionData } = useAuthSession();
  const markTutorialSeen = useMarkTutorialSeen("metas");
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();
  const updateProgress = useUpdateGoalProgress();

  const [tourOpen, setTourOpen] = useState(false);
  const [tourDismissedThisVisit, setTourDismissedThisVisit] = useState(false);
  const newButtonRef = useRef<HTMLButtonElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const firstDeleteButtonRef = useRef<HTMLButtonElement>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("peso");
  const [targetValue, setTargetValue] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [deadlineDays, setDeadlineDays] = useState<number | null>(null);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [targetDate, setTargetDate] = useState("");

  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);
  const [progressValue, setProgressValue] = useState("");

  const goals = data?.goals ?? [];

  useEffect(() => {
    if (isFetching) return;
    if (!sessionData?.profile) return;
    if (sessionData.profile.hasSeenMetasTutorial) return;
    if (tourDismissedThisVisit) return;
    const timeout = setTimeout(() => setTourOpen(true), 300);
    return () => clearTimeout(timeout);
  }, [isFetching, sessionData?.profile, tourDismissedThisVisit]);

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
      ref: newButtonRef,
      title: "Crea una meta",
      description:
        "Toca aquí para definir un objetivo claro y medible, con o sin fecha límite.",
    },
    {
      ref: firstCardRef,
      title: "Actualiza tu progreso",
      description:
        "Toca cualquier meta para actualizar cuánto llevas avanzado hacia tu objetivo.",
    },
    {
      ref: firstDeleteButtonRef,
      title: "Elimina una meta",
      description: "Este botón elimina la meta si ya no la necesitas.",
    },
  ];

  const resetCreateForm = () => {
    setTitle("");
    setGoalType("peso");
    setTargetValue("");
    setCustomUnit("");
    setDeadlineDays(null);
    setUseCustomDate(false);
    setTargetDate("");
  };

  const handleCreate = () => {
    const value = Number(targetValue);
    if (!title.trim()) {
      toast.error("Ponle un nombre a tu meta");
      return;
    }
    if (!value || value <= 0) {
      toast.error("Ingresa un valor objetivo válido");
      return;
    }
    if (useCustomDate && !targetDate) {
      toast.error("Elige una fecha límite");
      return;
    }
    const unit = goalType === "personalizada" ? customUnit.trim() : GOAL_TYPE_META[goalType].unit;
    const finalTargetDate = useCustomDate
      ? targetDate
      : deadlineDays !== null
        ? addDaysIso(deadlineDays)
        : null;
    createGoal.mutate(
      {
        title: title.trim(),
        goalType,
        unit,
        targetValue: value,
        targetDate: finalTargetDate,
      },
      {
        onSuccess: () => {
          toast.success("Meta creada");
          setCreateOpen(false);
          resetCreateForm();
        },
        onError: () => toast.error("No se pudo crear la meta"),
      },
    );
  };

  const handleDelete = (goal: Goal) => {
    const confirmed = window.confirm(`¿Eliminar "${goal.title}"?`);
    if (!confirmed) return;
    deleteGoal.mutate(goal.id, {
      onSuccess: () => toast.success("Meta eliminada"),
      onError: () => toast.error("No se pudo eliminar"),
    });
  };

  const openProgress = (goal: Goal) => {
    setProgressGoal(goal);
    setProgressValue(String(goal.currentValue));
  };

  const handleSaveProgress = () => {
    if (!progressGoal) return;
    const value = Number(progressValue);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Ingresa un valor válido");
      return;
    }
    updateProgress.mutate(
      { goalId: progressGoal.id, currentValue: value },
      {
        onSuccess: () => {
          toast.success("Progreso actualizado");
          setProgressGoal(null);
        },
        onError: () => toast.error("No se pudo actualizar"),
      },
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tus metas</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className={styles.newButton}
          ref={newButtonRef}
        >
          <Plus size={16} /> Nueva
        </Button>
      </div>

      {isFetching ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : goals.length === 0 ? (
        <div className={styles.emptyState}>
          <Target size={28} />
          <p>Aún no tienes metas. Crea la primera.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {goals.map((goal, index) => {
            const progress = goalProgress(goal);
            const deadline = goalDeadlineLabel(goal.targetDate);
            return (
              <div key={goal.id} className={styles.cardRow} ref={index === 0 ? firstCardRef : undefined}>
                <button
                  type="button"
                  className={styles.card}
                  onClick={() => openProgress(goal)}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon}>
                      <Target size={18} />
                    </div>
                    <div className={styles.cardHeaderText}>
                      <p className={styles.cardTitle}>{goal.title}</p>
                      <p className={styles.cardDeadline}>
                        {goal.currentValue}
                        {goal.unit ? ` ${goal.unit}` : ""} / {goal.targetValue}
                        {goal.unit ? ` ${goal.unit}` : ""}
                        {deadline ? ` · ${deadline}` : ""}
                      </p>
                    </div>
                    <span className={styles.cardPercent}>{progress}%</span>
                  </div>
                  <Progress value={progress} className={styles.progressBar} />
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label={`Eliminar ${goal.title}`}
                  ref={index === 0 ? firstDeleteButtonRef : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDelete(goal);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva meta</DialogTitle>
            <DialogDescription>
              Define un objetivo claro y medible
            </DialogDescription>
          </DialogHeader>
          <div className={styles.formBody}>
            <Input
              placeholder="Ej. Correr 5K sin parar"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className={styles.chipGrid}>
              {GOAL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.chip} ${goalType === type ? styles.chipActive : ""}`}
                  onClick={() => setGoalType(type)}
                >
                  {GOAL_TYPE_META[type].label}
                </button>
              ))}
            </div>
            <div className={styles.fieldRow}>
              <Input
                type="number"
                min={0}
                placeholder={GOAL_TYPE_META[goalType].placeholder}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
              {goalType === "personalizada" && (
                <Input
                  placeholder="Unidad (ej. sesiones)"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                />
              )}
            </div>
            <div className={styles.fieldColumn}>
              <span className={styles.sectionLabel}>Tiempo límite (opcional)</span>
              <div className={styles.chipGrid}>
                {GOAL_DEADLINE_PRESETS.map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    className={`${styles.chip} ${
                      !useCustomDate && deadlineDays === preset.days ? styles.chipActive : ""
                    }`}
                    onClick={() => {
                      setUseCustomDate(false);
                      setDeadlineDays(preset.days);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={`${styles.chip} ${useCustomDate ? styles.chipActive : ""}`}
                  onClick={() => setUseCustomDate(true)}
                >
                  Otra fecha
                </button>
              </div>
              {useCustomDate && (
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              )}
            </div>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={createGoal.isPending}
              className={styles.saveButton}
            >
              {createGoal.isPending ? <Spinner size="sm" /> : "Crear meta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!progressGoal}
        onOpenChange={(open) => !open && setProgressGoal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{progressGoal?.title}</DialogTitle>
            <DialogDescription>Actualiza tu progreso</DialogDescription>
          </DialogHeader>
          <div className={styles.formBody}>
            <Input
              type="number"
              min={0}
              value={progressValue}
              onChange={(e) => setProgressValue(e.target.value)}
            />
            <Button
              type="button"
              onClick={handleSaveProgress}
              disabled={updateProgress.isPending}
              className={styles.saveButton}
            >
              {updateProgress.isPending ? <Spinner size="sm" /> : "Guardar"}
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
