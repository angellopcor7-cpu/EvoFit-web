"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Dumbbell,
  Activity,
  HeartPulse,
  Sparkles,
  Flame,
  Wind,
  Swords,
  Layers,
  Plus,
  Play,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useWorkoutRoutines } from "@/hooks/useWorkoutRoutines";
import { useUserRoutines } from "@/hooks/useUserRoutines";
import type { WorkoutCategory, WorkoutRoutine } from "@/lib/workouts";
import type { UserRoutine } from "@/lib/userRoutines";
import styles from "./page.module.css";

const comingSoon = () => toast.info("Muy pronto vas a poder registrar tu entrenamiento.");

const LEVEL_LABEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  todos: "Todos los niveles",
};

type UiCategory =
  | "musculacion"
  | "calistenia"
  | "cardio"
  | "zumba"
  | "crossfit"
  | "yoga_pilates"
  | "boxeo_kickboxing"
  | "equipo_especial";

const UI_CATEGORIES: UiCategory[] = [
  "musculacion",
  "calistenia",
  "cardio",
  "zumba",
  "crossfit",
  "yoga_pilates",
  "boxeo_kickboxing",
  "equipo_especial",
];

const UI_CATEGORY_META: Record<
  UiCategory,
  {
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    mode: "catalog" | "sessions";
    workoutCategory: WorkoutCategory;
  }
> = {
  musculacion: { label: "Musculación", icon: Dumbbell, mode: "catalog", workoutCategory: "musculacion" },
  calistenia: { label: "Calistenia", icon: Activity, mode: "catalog", workoutCategory: "calistenia" },
  cardio: { label: "Cardio", icon: HeartPulse, mode: "catalog", workoutCategory: "cardio_hiit" },
  zumba: { label: "Zumba", icon: Sparkles, mode: "sessions", workoutCategory: "zumba" },
  crossfit: { label: "CrossFit", icon: Flame, mode: "sessions", workoutCategory: "crossfit" },
  yoga_pilates: { label: "Yoga / Pilates", icon: Wind, mode: "sessions", workoutCategory: "yoga_pilates" },
  boxeo_kickboxing: { label: "Boxeo / Kickbox", icon: Swords, mode: "sessions", workoutCategory: "boxeo_kickboxing" },
  equipo_especial: { label: "Equipo especial", icon: Layers, mode: "sessions", workoutCategory: "equipo_especial" },
};

function parseUiCategory(value: string | null): UiCategory {
  if (value && (UI_CATEGORIES as string[]).includes(value)) {
    return value as UiCategory;
  }
  return "musculacion";
}

type DisplayExercise = {
  id: string;
  exerciseName: string;
  sets: number;
  repsLabel: string | null;
  durationLabel: string | null;
  restLabel: string;
};

type SelectedRoutine = {
  title: string;
  subtitle: string;
  exercises: DisplayExercise[];
};

function RoutineCard({
  title,
  meta,
  onSelect,
}: {
  title: string;
  meta: string;
  onSelect: () => void;
}) {
  return (
    <button type="button" className={styles.card} onClick={onSelect}>
      <div className={styles.cardIcon}>
        <Dumbbell size={20} />
      </div>
      <div className={styles.cardInfo}>
        <p className={styles.cardName}>{title}</p>
        <p className={styles.cardMeta}>{meta}</p>
      </div>
      <div className={styles.startButton} aria-label={`Ver ${title}`}>
        <Play size={16} />
      </div>
    </button>
  );
}

export default function EntrenamientosPage() {
  const searchParams = useSearchParams();
  const { data, isFetching } = useWorkoutRoutines();
  const { data: userData, isFetching: isFetchingUser } = useUserRoutines();
  const [selected, setSelected] = useState<SelectedRoutine | null>(null);
  const [activeCategory, setActiveCategory] = useState<UiCategory>(
    parseUiCategory(searchParams.get("category")),
  );

  const allRoutines = data?.routines ?? [];
  const myRoutines = userData?.routines ?? [];
  const meta = UI_CATEGORY_META[activeCategory];

  const categoryRoutines = useMemo(
    () => allRoutines.filter((routine) => routine.category === meta.workoutCategory),
    [allRoutines, meta.workoutCategory],
  );

  const selectPackRoutine = (routine: WorkoutRoutine) => {
    setSelected({
      title: routine.title,
      subtitle:
        routine.splitType === "sesion"
          ? `${routine.exercises.length} bloques · ${UI_CATEGORY_META[activeCategory].label}`
          : `${routine.exercises.length} ejercicios · Nivel ${LEVEL_LABEL[routine.level] ?? routine.level}`,
      exercises: routine.exercises,
    });
  };

  const selectUserRoutine = (routine: UserRoutine) => {
    setSelected({
      title: routine.title,
      subtitle: `${routine.exercises.length} ejercicios · Tu rutina`,
      exercises: routine.exercises.map((e) => ({
        id: e.id,
        exerciseName: e.exerciseName,
        sets: e.sets,
        repsLabel: e.repsLabel,
        durationLabel: e.durationLabel,
        restLabel: e.restLabel,
      })),
    });
  };

  const loading =
    (isFetching && allRoutines.length === 0) ||
    (isFetchingUser && myRoutines.length === 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tus rutinas</h1>
          <p className={styles.subtitle}>{meta.label}</p>
        </div>
        {meta.mode === "catalog" && (
          <Button
            asChild
            type="button"
            variant="outline"
            size="sm"
            className={styles.newButton}
          >
            <Link href={`/entrenamientos/crear?category=${activeCategory}`}>
              <Plus size={16} /> Nueva
            </Link>
          </Button>
        )}
      </div>

      <div className={styles.categoryChips}>
        {UI_CATEGORIES.map((category) => {
          const catMeta = UI_CATEGORY_META[category];
          const Icon = catMeta.icon;
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              className={`${styles.categoryChip} ${isActive ? styles.categoryChipActive : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              <Icon size={14} />
              <span>{catMeta.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : meta.mode === "catalog" ? (
        <Tabs defaultValue="rutinas" className={styles.tabs} key={activeCategory}>
          <TabsList>
            <TabsTrigger value="rutinas">
              Por día ({categoryRoutines.length})
            </TabsTrigger>
            <TabsTrigger value="mias">
              Mis rutinas ({myRoutines.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rutinas">
            {categoryRoutines.length === 0 ? (
              <div className={styles.emptyState}>
                <Sparkles size={22} />
                <p>Todavía no hay sesiones predefinidas para {meta.label}.</p>
              </div>
            ) : (
              <div className={styles.list}>
                {categoryRoutines.map((routine) => (
                  <div key={routine.id} className={styles.routineWrap}>
                    <p className={styles.groupLabel}>
                      {LEVEL_LABEL[routine.level] ?? routine.level} ·{" "}
                      {routine.splitType.toUpperCase()}
                    </p>
                    <RoutineCard
                      title={routine.title}
                      meta={`${routine.exercises.length} ejercicios`}
                      onSelect={() => selectPackRoutine(routine)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mias">
            {myRoutines.length === 0 ? (
              <div className={styles.emptyState}>
                <Sparkles size={22} />
                <p>Aún no has creado ninguna rutina.</p>
                <Button asChild size="sm">
                  <Link href={`/entrenamientos/crear?category=${activeCategory}`}>
                    <Plus size={16} /> Crear rutina
                  </Link>
                </Button>
              </div>
            ) : (
              <div className={styles.list}>
                {myRoutines.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    title={routine.title}
                    meta={`${routine.exercises.length} ejercicios`}
                    onSelect={() => selectUserRoutine(routine)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : categoryRoutines.length === 0 ? (
        <div className={styles.emptyState}>
          <Sparkles size={22} />
          <p>Todavía no hay sesiones para {meta.label}.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {categoryRoutines.map((routine) => (
            <RoutineCard
              key={routine.id}
              title={routine.title}
              meta={`${routine.exercises.length} bloques`}
              onSelect={() => selectPackRoutine(routine)}
            />
          ))}
        </div>
      )}

      {meta.mode === "catalog" && (
        <p className={styles.note}>
          Seguimos digitalizando tu pack — las fichas de Nivel Intermedio
          (Fullbody/AB/ABC) están pendientes por verificar antes de sumarlas.
        </p>
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className={styles.dialogContent}>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>{selected.subtitle}</DialogDescription>
              </DialogHeader>
              <div className={styles.exerciseList}>
                {selected.exercises.map((exercise) => (
                  <div key={exercise.id} className={styles.exerciseRow}>
                    <p className={styles.exerciseName}>
                      {exercise.exerciseName}
                    </p>
                    <div className={styles.exerciseMeta}>
                      <span>
                        {exercise.repsLabel
                          ? `${exercise.sets} x ${exercise.repsLabel}`
                          : exercise.durationLabel}
                      </span>
                      <span className={styles.exerciseRest}>
                        <Timer size={12} /> {exercise.restLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                onClick={comingSoon}
                className={styles.beginButton}
              >
                Empezar entrenamiento
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
