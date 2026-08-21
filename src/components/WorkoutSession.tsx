"use client";

import { useEffect, useState } from "react";
import { Check, SkipForward, Timer, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Spinner } from "@/components/ui/Spinner";
import { ExercisePoseIcon } from "@/components/ExercisePoseIcon";
import { parseSecondsLabel, formatTimer } from "@/lib/workoutTimer";
import type { MuscleGroup } from "@/lib/exercises";
import type { WorkoutCategory } from "@/lib/workouts";
import styles from "./WorkoutSession.module.css";

export type SessionExercise = {
  id: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  category: WorkoutCategory;
  sets: number;
  repsLabel: string | null;
  durationLabel: string | null;
  restLabel: string;
};

type Phase = "working" | "exercise" | "resting" | "done";

function phaseForExercise(exercise: SessionExercise | undefined): {
  phase: Phase;
  remaining: number;
} {
  if (!exercise) return { phase: "done", remaining: 0 };
  const workSeconds = exercise.durationLabel
    ? parseSecondsLabel(exercise.durationLabel)
    : null;
  return workSeconds
    ? { phase: "working", remaining: workSeconds }
    : { phase: "exercise", remaining: 0 };
}

export function WorkoutSession({
  routineTitle,
  exercises,
  onComplete,
  onCancel,
  isSaving,
  saveError,
}: {
  routineTitle: string;
  exercises: SessionExercise[];
  onComplete: () => void;
  onCancel: () => void;
  isSaving: boolean;
  saveError: boolean;
}) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [phase, setPhase] = useState<Phase>(
    () => phaseForExercise(exercises[0]).phase,
  );
  const [remaining, setRemaining] = useState<number>(
    () => phaseForExercise(exercises[0]).remaining,
  );
  const [completedNotified, setCompletedNotified] = useState(false);

  const current = exercises[exerciseIndex];
  const totalExercises = exercises.length;

  const advanceSet = () => {
    if (!current) return;
    if (setNumber < current.sets) {
      setSetNumber((n) => n + 1);
      const { phase: nextPhase, remaining: nextRemaining } =
        phaseForExercise(current);
      setPhase(nextPhase);
      setRemaining(nextRemaining);
      return;
    }
    const nextIndex = exerciseIndex + 1;
    if (nextIndex < totalExercises) {
      setExerciseIndex(nextIndex);
      setSetNumber(1);
      const { phase: nextPhase, remaining: nextRemaining } = phaseForExercise(
        exercises[nextIndex],
      );
      setPhase(nextPhase);
      setRemaining(nextRemaining);
    } else {
      setPhase("done");
    }
  };

  const goToRestOrAdvance = () => {
    if (!current) return;
    const restSeconds = parseSecondsLabel(current.restLabel);
    if (restSeconds && restSeconds > 0) {
      setPhase("resting");
      setRemaining(restSeconds);
    } else {
      advanceSet();
    }
  };

  // Cronómetro: cuenta hacia atrás durante los bloques con duración
  // ("working") y durante los descansos ("resting"); en cualquier otra
  // fase no hace nada.
  useEffect(() => {
    if (phase !== "working" && phase !== "resting") return undefined;
    const timeout = setTimeout(() => {
      if (remaining <= 1) {
        if (phase === "working") goToRestOrAdvance();
        else advanceSet();
      } else {
        setRemaining((r) => r - 1);
      }
    }, 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, remaining]);

  useEffect(() => {
    if (phase !== "done" || completedNotified) return undefined;
    const timeout = setTimeout(() => {
      setCompletedNotified(true);
      onComplete();
    }, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, completedNotified]);

  if (phase === "done") {
    return (
      <div className={styles.doneWrap}>
        {isSaving ? (
          <>
            <Spinner />
            <p className={styles.doneTitle}>Registrando tu entrenamiento...</p>
          </>
        ) : saveError ? (
          <>
            <p className={styles.doneTitle}>No se pudo registrar</p>
            <p className={styles.doneSubtitle}>
              Terminaste la rutina, pero hubo un problema al guardarla.
            </p>
            <Button type="button" onClick={onComplete}>
              Reintentar
            </Button>
          </>
        ) : (
          <>
            <PartyPopper size={40} className={styles.doneIcon} />
            <p className={styles.doneTitle}>¡Rutina completada!</p>
            <p className={styles.doneSubtitle}>{routineTitle}</p>
          </>
        )}
      </div>
    );
  }

  if (!current) return null;

  const overallProgress =
    ((exerciseIndex + (setNumber - 1) / current.sets) / totalExercises) * 100;

  return (
    <div className={styles.session}>
      <Progress value={overallProgress} className={styles.overallProgress} />
      <p className={styles.exerciseCount}>
        Ejercicio {exerciseIndex + 1} de {totalExercises}
      </p>

      <div className={styles.exerciseCard}>
        <div className={styles.exercisePose}>
          <ExercisePoseIcon
            exerciseName={current.exerciseName}
            muscleGroup={current.muscleGroup}
            categoryHint={current.category}
            width={200}
          />
        </div>
        <p className={styles.exerciseName}>{current.exerciseName}</p>
        <p className={styles.setLabel}>
          Serie {setNumber} de {current.sets}
        </p>

        {phase === "resting" ? (
          <>
            <div className={styles.timerDisplay}>
              <Timer size={20} />
              {formatTimer(remaining)}
            </div>
            <p className={styles.phaseNote}>Descanso</p>
            <Button type="button" variant="outline" onClick={advanceSet}>
              <SkipForward size={16} /> Saltar descanso
            </Button>
          </>
        ) : phase === "working" ? (
          <>
            <div className={styles.timerDisplay}>
              <Timer size={20} />
              {formatTimer(remaining)}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={goToRestOrAdvance}
            >
              <SkipForward size={16} /> Saltar
            </Button>
          </>
        ) : (
          <>
            {current.repsLabel && (
              <p className={styles.targetLabel}>{current.repsLabel} reps</p>
            )}
            <Button type="button" onClick={goToRestOrAdvance}>
              <Check size={16} /> Completé la serie
            </Button>
          </>
        )}
      </div>

      <button type="button" className={styles.cancelLink} onClick={onCancel}>
        Cancelar entrenamiento
      </button>
    </div>
  );
}
