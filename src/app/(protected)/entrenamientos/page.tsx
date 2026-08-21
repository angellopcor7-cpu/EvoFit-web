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
  Shuffle,
  Plus,
  Play,
  Timer,
  Trash2,
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
import { WorkoutSession } from "@/components/WorkoutSession";
import { getExerciseImageUrl } from "@/lib/exerciseImages";
import { useWorkoutRoutines } from "@/hooks/useWorkoutRoutines";
import { useUserRoutines, useDeleteUserRoutine } from "@/hooks/useUserRoutines";
import { useCompleteWorkout } from "@/hooks/useWorkoutCompletions";
import type { WorkoutCategory, WorkoutRoutine } from "@/lib/workouts";
import type { UserRoutine } from "@/lib/userRoutines";
import type { MuscleGroup } from "@/lib/exercises";
import styles from "./page.module.css";

const LEVEL_LABEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  todos: "Todos los niveles",
};

const LEVEL_ORDER = ["principiante", "intermedio", "avanzado", "todos"];

// Orden de despliegue de los botones de grupo/bloque para las categorías
// donde el day_label realmente representa un grupo que se repite entre
// niveles (musculación y calistenia). El resto de categorías (sesiones
// tipo clase) no usan este filtro porque cada day_label ahí es único.
const GROUP_ORDER: Partial<Record<UiCategory, string[]>> = {
  musculacion: ["Full Body", "Pecho", "Espalda", "Piernas", "Hombros", "Brazos", "Abdomen"],
  calistenia: ["Full Body A", "Full Body B", "Tren superior", "Tren inferior y core"],
};

type UiCategory =
  | "musculacion"
  | "calistenia"
  | "cardio"
  | "zumba"
  | "crossfit"
  | "yoga_pilates"
  | "boxeo_kickboxing"
  | "equipo_especial"
  | "hibrido";

const UI_CATEGORIES: UiCategory[] = [
  "musculacion",
  "calistenia",
  "cardio",
  "zumba",
  "crossfit",
  "yoga_pilates",
  "boxeo_kickboxing",
  "equipo_especial",
  "hibrido",
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
  hibrido: { label: "Híbridos", icon: Shuffle, mode: "sessions", workoutCategory: "hibrido" },
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
  muscleGroup: MuscleGroup;
  sets: number;
  repsLabel: string | null;
  durationLabel: string | null;
  restLabel: string;
};

type SelectedRoutine = {
  title: string;
  subtitle: string;
  exercises: DisplayExercise[];
  category: WorkoutCategory;
  workoutRoutineId: string | null;
  userRoutineId: string | null;
};

function RoutineCard({
  title,
  meta,
  onSelect,
  onDelete,
}: {
  title: string;
  meta: string;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className={styles.cardRow}>
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
      {onDelete && (
        <button
          type="button"
          className={styles.deleteButton}
          aria-label={`Eliminar ${title}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

function FilterChips({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: { value: string | null; label: string }[];
  active: string | null;
  onSelect: (value: string | null) => void;
}) {
  return (
    <div className={styles.filterGroup}>
      <p className={styles.filterLabel}>{label}</p>
      <div className={styles.filterChips}>
        {options.map((option) => {
          const isActive = active === option.value;
          return (
            <button
              key={option.label}
              type="button"
              className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ""}`}
              onClick={() => onSelect(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function EntrenamientosPage() {
  const searchParams = useSearchParams();
  const { data, isFetching } = useWorkoutRoutines();
  const { data: userData, isFetching: isFetchingUser } = useUserRoutines();
  const deleteUserRoutine = useDeleteUserRoutine();
  const completeWorkout = useCompleteWorkout();
  const [selected, setSelected] = useState<SelectedRoutine | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [activeCategory, setActiveCategory] = useState<UiCategory>(
    parseUiCategory(searchParams.get("category")),
  );
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const allRoutines = data?.routines ?? [];
  const myRoutines = userData?.routines ?? [];
  const meta = UI_CATEGORY_META[activeCategory];

  const categoryRoutines = useMemo(
    () => allRoutines.filter((routine) => routine.category === meta.workoutCategory),
    [allRoutines, meta.workoutCategory],
  );

  const showGroupChips = activeCategory === "musculacion" || activeCategory === "calistenia";

  const availableLevels = useMemo(() => {
    const present = new Set(categoryRoutines.map((r) => r.level));
    return LEVEL_ORDER.filter((level) => present.has(level as WorkoutRoutine["level"]));
  }, [categoryRoutines]);

  const availableGroups = useMemo(() => {
    if (!showGroupChips) return [];
    const present = new Set(categoryRoutines.map((r) => r.dayLabel).filter(Boolean));
    return (GROUP_ORDER[activeCategory] ?? []).filter((g) => present.has(g));
  }, [categoryRoutines, showGroupChips, activeCategory]);

  const filteredRoutines = useMemo(() => {
    return categoryRoutines.filter(
      (routine) =>
        (!selectedLevel || routine.level === selectedLevel) &&
        (!selectedGroup || routine.dayLabel === selectedGroup),
    );
  }, [categoryRoutines, selectedLevel, selectedGroup]);

  const selectCategory = (category: UiCategory) => {
    setActiveCategory(category);
    setSelectedLevel(null);
    setSelectedGroup(null);
  };

  const selectPackRoutine = (routine: WorkoutRoutine) => {
    setSelected({
      title: routine.title,
      subtitle:
        routine.splitType === "sesion"
          ? `${routine.exercises.length} bloques · ${UI_CATEGORY_META[activeCategory].label}`
          : `${routine.exercises.length} ejercicios · Nivel ${LEVEL_LABEL[routine.level] ?? routine.level}`,
      exercises: routine.exercises.map((e) => ({
        id: e.id,
        exerciseName: e.exerciseName,
        muscleGroup: e.muscleGroup,
        sets: e.sets,
        repsLabel: e.repsLabel,
        durationLabel: e.durationLabel,
        restLabel: e.restLabel,
      })),
      category: meta.workoutCategory,
      workoutRoutineId: routine.id,
      userRoutineId: null,
    });
  };

  const selectUserRoutine = (routine: UserRoutine) => {
    setSelected({
      title: routine.title,
      subtitle: `${routine.exercises.length} ejercicios · Tu rutina`,
      exercises: routine.exercises.map((e) => ({
        id: e.id,
        exerciseName: e.exerciseName,
        muscleGroup: e.muscleGroup,
        sets: e.sets,
        repsLabel: e.repsLabel,
        durationLabel: e.durationLabel,
        restLabel: e.restLabel,
      })),
      category: meta.workoutCategory,
      workoutRoutineId: null,
      userRoutineId: routine.id,
    });
  };

  const handleSessionComplete = () => {
    if (!selected) return;
    completeWorkout.mutate(
      {
        category: selected.category,
        routineTitle: selected.title,
        workoutRoutineId: selected.workoutRoutineId,
        userRoutineId: selected.userRoutineId,
      },
      {
        onSuccess: (result) => {
          toast.success(
            result.alreadyLoggedToday
              ? "¡Entrenamiento registrado! Ya tenías uno hoy, tu racha sigue igual."
              : `¡Entrenamiento registrado! Racha: ${result.currentStreak} ${result.currentStreak === 1 ? "día" : "días"} 🔥`,
          );
          setSelected(null);
          setSessionActive(false);
        },
        onError: () => toast.error("No se pudo registrar tu entrenamiento"),
      },
    );
  };

  const handleDeleteUserRoutine = (routine: UserRoutine) => {
    const confirmed = window.confirm(`¿Eliminar "${routine.title}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;
    deleteUserRoutine.mutate(routine.id, {
      onSuccess: () => toast.success("Rutina eliminada"),
      onError: () => toast.error("No se pudo eliminar la rutina"),
    });
  };

  const loading =
    (isFetching && allRoutines.length === 0) ||
    (isFetchingUser && myRoutines.length === 0);

  const renderFilters = () => {
    if (!showGroupChips && availableLevels.length <= 1) return null;
    return (
      <div className={styles.filters}>
        {showGroupChips && availableGroups.length > 1 && (
          <FilterChips
            label="Grupo"
            active={selectedGroup}
            onSelect={setSelectedGroup}
            options={[
              { value: null, label: "Todos" },
              ...availableGroups.map((g) => ({ value: g, label: g })),
            ]}
          />
        )}
        {availableLevels.length > 1 && (
          <FilterChips
            label="Nivel"
            active={selectedLevel}
            onSelect={setSelectedLevel}
            options={[
              { value: null, label: "Todos" },
              ...availableLevels.map((l) => ({ value: l, label: LEVEL_LABEL[l] ?? l })),
            ]}
          />
        )}
      </div>
    );
  };

  const renderRoutineList = (emptyMessage: string) => {
    if (categoryRoutines.length === 0) {
      return (
        <div className={styles.emptyState}>
          <Sparkles size={22} />
          <p>{emptyMessage}</p>
        </div>
      );
    }
    if (filteredRoutines.length === 0) {
      return (
        <div className={styles.emptyState}>
          <Sparkles size={22} />
          <p>No hay rutinas para esta combinación de filtros.</p>
        </div>
      );
    }
    return (
      <div className={styles.list}>
        {filteredRoutines.map((routine) => (
          <RoutineCard
            key={routine.id}
            title={routine.title}
            meta={
              routine.splitType === "sesion"
                ? `${routine.exercises.length} bloques`
                : `${routine.exercises.length} ejercicios`
            }
            onSelect={() => selectPackRoutine(routine)}
          />
        ))}
      </div>
    );
  };

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
              onClick={() => selectCategory(category)}
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
              Rutinas predeterminadas ({categoryRoutines.length})
            </TabsTrigger>
            <TabsTrigger value="mias">
              Mis rutinas ({myRoutines.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rutinas">
            {renderFilters()}
            {renderRoutineList(`Todavía no hay sesiones predefinidas para ${meta.label}.`)}
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
                    onDelete={() => handleDeleteUserRoutine(routine)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <p className={styles.sectionTitle}>Rutinas predeterminadas</p>
          {renderFilters()}
          {renderRoutineList(`Todavía no hay sesiones para ${meta.label}.`)}
        </>
      )}

      {meta.mode === "catalog" && (
        <p className={styles.note}>
          Seguimos digitalizando tu pack — las fichas de Nivel Intermedio
          (Fullbody/AB/ABC) están pendientes por verificar antes de sumarlas.
        </p>
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setSessionActive(false);
          }
        }}
      >
        <DialogContent className={styles.dialogContent}>
          {selected && sessionActive && (
            <WorkoutSession
              routineTitle={selected.title}
              exercises={selected.exercises}
              onComplete={handleSessionComplete}
              onCancel={() => setSessionActive(false)}
              isSaving={completeWorkout.isPending}
              saveError={completeWorkout.isError}
            />
          )}
          {selected && !sessionActive && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>{selected.subtitle}</DialogDescription>
              </DialogHeader>
              <div className={styles.exerciseList}>
                {selected.exercises.map((exercise) => {
                  const imageUrl = getExerciseImageUrl(exercise.exerciseName);
                  return (
                    <div key={exercise.id} className={styles.exerciseRow}>
                      {imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={`Inicio y final: ${exercise.exerciseName}`}
                          className={styles.exerciseImage}
                        />
                      )}
                      <div className={styles.exerciseRowTop}>
                        <div className={styles.exerciseRowInfo}>
                          <p className={styles.exerciseName}>
                            {exercise.exerciseName}
                          </p>
                        </div>
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
                    </div>
                  );
                })}
              </div>
              <Button
                type="button"
                onClick={() => setSessionActive(true)}
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
