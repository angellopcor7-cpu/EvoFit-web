"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
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
  Home,
  Plus,
  Play,
  Timer,
  Trash2,
  ChevronDown,
  SlidersHorizontal,
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
import {
  useUserRoutines,
  useCreateUserRoutine,
  useDeleteUserRoutine,
} from "@/hooks/useUserRoutines";
import { RoutinePickerDialog } from "@/components/RoutinePickerDialog";
import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import {
  useAuthSession,
  useMarkWorkoutsTutorialSeen,
} from "@/hooks/useProfile";
import { useCompleteWorkout } from "@/hooks/useWorkoutCompletions";
import {
  BODY_TYPES,
  BODY_TYPE_LABEL,
  type WorkoutCategory,
  type WorkoutRoutine,
} from "@/lib/workouts";
import type { UserRoutine } from "@/lib/userRoutines";
import { MUSCLE_GROUP_LABEL, type MuscleGroup } from "@/lib/exercises";
import styles from "./page.module.css";

function muscleGroupsSummary(exercises: { muscleGroup: MuscleGroup }[]): string {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const e of exercises) {
    const label = MUSCLE_GROUP_LABEL[e.muscleGroup] ?? e.muscleGroup;
    if (!seen.has(label)) {
      seen.add(label);
      labels.push(label);
    }
  }
  return labels.join(", ");
}

const LEVEL_LABEL: Record<string, string> = {
  aprendiz: "Aprendiz",
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  todos: "Todos los niveles",
};

const LEVEL_ORDER = ["aprendiz", "principiante", "intermedio", "avanzado", "todos"];

// Orden de despliegue de los botones de grupo/bloque para las categorías
// donde el day_label realmente representa un grupo que se repite entre
// niveles (musculación y calistenia). El resto de categorías (sesiones
// tipo clase) no usan este filtro porque cada day_label ahí es único.
const GROUP_ORDER: Partial<Record<UiCategory, string[]>> = {
  musculacion: [
    "Full Body",
    "Empuje",
    "Tirón",
    "Piernas",
    "Pecho",
    "Espalda",
    "Hombros",
    "Brazos",
    "Abdomen",
  ],
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
  hibrido: { label: "Ejercicio en casa", icon: Home, mode: "catalog", workoutCategory: "hibrido" },
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
  cardRef,
}: {
  title: string;
  meta: string;
  onSelect: () => void;
  onDelete?: () => void;
  cardRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className={styles.cardRow} ref={cardRef}>
      <button type="button" className={styles.card} onClick={onSelect}>
        <div className={styles.cardIcon}>
          <Dumbbell size={17} />
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
  const { data: sessionData } = useAuthSession();
  const markTutorialSeen = useMarkWorkoutsTutorialSeen();
  const deleteUserRoutine = useDeleteUserRoutine();
  const createUserRoutine = useCreateUserRoutine();
  const completeWorkout = useCompleteWorkout();
  const [selected, setSelected] = useState<SelectedRoutine | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [activeCategory, setActiveCategory] = useState<UiCategory>(
    parseUiCategory(searchParams.get("category")),
  );
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourDismissedThisVisit, setTourDismissedThisVisit] = useState(false);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const newButtonRef = useRef<HTMLAnchorElement>(null);
  const tabsListRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [autoOpenedRoutine, setAutoOpenedRoutine] = useState(false);
  const [addPresetOpen, setAddPresetOpen] = useState(false);
  const [expandedExerciseIds, setExpandedExerciseIds] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleExerciseImage = (exerciseId: string) => {
    setExpandedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const allRoutines = data?.routines ?? [];
  const myRoutines = userData?.routines ?? [];
  const meta = UI_CATEGORY_META[activeCategory];

  const categoryRoutines = useMemo(
    () => allRoutines.filter((routine) => routine.category === meta.workoutCategory),
    [allRoutines, meta.workoutCategory],
  );

  const showGroupChips = activeCategory === "musculacion" || activeCategory === "calistenia";
  const showBodyTypeChips = activeCategory === "musculacion";

  const availableLevels = useMemo(() => {
    const present = new Set(categoryRoutines.map((r) => r.level));
    return LEVEL_ORDER.filter((level) => present.has(level as WorkoutRoutine["level"]));
  }, [categoryRoutines]);

  const availableGroups = useMemo(() => {
    if (!showGroupChips) return [];
    const present = new Set(categoryRoutines.map((r) => r.dayLabel).filter(Boolean));
    return (GROUP_ORDER[activeCategory] ?? []).filter((g) => present.has(g));
  }, [categoryRoutines, showGroupChips, activeCategory]);

  const availableBodyTypes = useMemo(() => {
    if (!showBodyTypeChips) return [];
    const present = new Set(categoryRoutines.map((r) => r.bodyType).filter(Boolean));
    return BODY_TYPES.filter((bt) => present.has(bt));
  }, [categoryRoutines, showBodyTypeChips]);

  const filteredRoutines = useMemo(() => {
    return categoryRoutines.filter(
      (routine) =>
        (!selectedLevel || routine.level === selectedLevel) &&
        (!selectedGroup || routine.dayLabel === selectedGroup) &&
        (!selectedBodyType || routine.bodyType === selectedBodyType),
    );
  }, [categoryRoutines, selectedLevel, selectedGroup, selectedBodyType]);

  const selectCategory = (category: UiCategory) => {
    setActiveCategory(category);
    setSelectedLevel(null);
    setSelectedGroup(null);
    setSelectedBodyType(null);
  };

  const selectPackRoutine = (routine: WorkoutRoutine) => {
    setSelected({
      title: routine.title,
      subtitle:
        routine.splitType === "sesion"
          ? `${routine.exercises.length} bloques · ${UI_CATEGORY_META[activeCategory].label}`
          : `${muscleGroupsSummary(routine.exercises)} · Nivel ${LEVEL_LABEL[routine.level] ?? routine.level}`,
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
      subtitle: `${muscleGroupsSummary(routine.exercises)} · Tu rutina`,
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

  // Deep-link desde la tarjeta "Hoy toca" de Inicio: ?routine=<id>&type=predef|propia
  // abre directo el detalle de esa rutina (el diálogo flota encima de la
  // pestaña que sea, así que no importa cuál esté activa debajo).
  useEffect(() => {
    if (autoOpenedRoutine) return;
    const routineId = searchParams.get("routine");
    const type = searchParams.get("type");
    if (!routineId || !type) return;

    if (type === "propia") {
      const routine = myRoutines.find((r) => r.id === routineId);
      if (routine) {
        selectUserRoutine(routine);
        setAutoOpenedRoutine(true);
      }
    } else {
      const routine = allRoutines.find((r) => r.id === routineId);
      if (routine) {
        selectPackRoutine(routine);
        setAutoOpenedRoutine(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, allRoutines, myRoutines, autoOpenedRoutine]);

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

  const handleAddPresetRoutine = (routineId: string) => {
    const routine = categoryRoutines.find((r) => r.id === routineId);
    if (!routine) return;
    createUserRoutine.mutate(
      {
        title: routine.title,
        exercises: routine.exercises.map((e) => ({
          exerciseId: null,
          exerciseName: e.exerciseName,
          muscleGroup: e.muscleGroup,
          sets: e.sets,
          repsLabel: e.repsLabel,
          durationLabel: e.durationLabel,
          restLabel: e.restLabel,
        })),
      },
      {
        onSuccess: () => toast.success(`"${routine.title}" se agregó a Mis rutinas`),
        onError: () => toast.error("No se pudo agregar la rutina"),
      },
    );
  };

  const loading =
    (isFetching && allRoutines.length === 0) ||
    (isFetchingUser && myRoutines.length === 0);

  useEffect(() => {
    if (loading) return;
    if (!sessionData?.profile) return;
    if (!sessionData.profile.hasSeenWelcome || !sessionData.profile.hasCompletedOnboarding) return;
    if (sessionData.profile.hasSeenWorkoutsTutorial) return;
    if (tourDismissedThisVisit) return;
    const timeout = setTimeout(() => setTourOpen(true), 300);
    return () => clearTimeout(timeout);
  }, [loading, sessionData?.profile, tourDismissedThisVisit]);

  const closeTour = () => {
    setTourOpen(false);
    setTourDismissedThisVisit(true);
  };

  const handleTourFinish = () => {
    closeTour();
  };

  const handleTourNeverShowAgain = () => {
    closeTour();
    markTutorialSeen.mutate();
  };

  const tourSteps: TourStep[] = [
    {
      ref: categoryButtonRef,
      title: "Elige tu categoría",
      description:
        "Aquí cambias entre Musculación, Calistenia, Cardio, Zumba y el resto de categorías de entrenamiento.",
    },
    {
      ref: tabsListRef,
      title: "Predeterminadas o tuyas",
      description:
        "\"Rutinas predeterminadas\" son las que ya vienen armadas. \"Mis rutinas\" son las que tú creas o guardas.",
    },
    {
      ref: filtersButtonRef,
      title: "Filtra para encontrar más rápido",
      description:
        "Filtra por nivel, grupo muscular o tipo de cuerpo para encontrar la rutina ideal para ti.",
    },
    {
      ref: newButtonRef,
      title: "Crea tu propia rutina",
      description:
        "Arma una rutina desde cero eligiendo tú mismo los ejercicios, series y repeticiones.",
    },
    {
      ref: firstCardRef,
      title: "Toca una rutina",
      description:
        "Toca cualquier tarjeta para ver el detalle completo: ejercicios, series, repeticiones y descansos.",
    },
  ];

  // Grupo/tipo de cuerpo/nivel ya no se muestran como chips sueltos en la
  // pantalla — viven dentro del diálogo "Filtros" para no saturar de
  // botones (a petición del usuario). hasAnyFilters decide si ese botón
  // se muestra siquiera.
  const hasAnyFilters =
    (showGroupChips && availableGroups.length > 1) ||
    (showBodyTypeChips && availableBodyTypes.length > 1) ||
    availableLevels.length > 1;

  const activeFilterCount = [selectedGroup, selectedBodyType, selectedLevel].filter(
    Boolean,
  ).length;

  const clearFilters = () => {
    setSelectedGroup(null);
    setSelectedBodyType(null);
    setSelectedLevel(null);
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
        {filteredRoutines.map((routine, index) => (
          <RoutineCard
            key={routine.id}
            title={routine.title}
            meta={
              routine.splitType === "sesion"
                ? `${routine.exercises.length} bloques`
                : `${routine.exercises.length} ejercicios`
            }
            onSelect={() => selectPackRoutine(routine)}
            cardRef={index === 0 ? firstCardRef : undefined}
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
          <button
            type="button"
            className={styles.categoryButton}
            onClick={() => setCategoryPickerOpen(true)}
            ref={categoryButtonRef}
          >
            <meta.icon size={14} />
            <span>{meta.label}</span>
            <ChevronDown size={14} />
          </button>
        </div>
        <div className={styles.headerActions}>
          {hasAnyFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={styles.filtersButton}
              onClick={() => setFiltersOpen(true)}
              ref={filtersButtonRef}
            >
              <SlidersHorizontal size={14} />
              Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          )}
          {meta.mode === "catalog" && (
            <Button
              asChild
              type="button"
              variant="outline"
              size="sm"
              className={styles.newButton}
            >
              <Link
                href={`/entrenamientos/crear?category=${activeCategory}`}
                ref={newButtonRef}
              >
                <Plus size={16} /> Nueva
              </Link>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : meta.mode === "catalog" ? (
        <>
        <Tabs defaultValue="rutinas" className={styles.tabs} key={activeCategory}>
          <TabsList ref={tabsListRef}>
            <TabsTrigger value="rutinas">
              Rutinas predeterminadas ({categoryRoutines.length})
            </TabsTrigger>
            <TabsTrigger value="mias">
              Mis rutinas ({myRoutines.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rutinas">
            {renderRoutineList(`Todavía no hay sesiones predefinidas para ${meta.label}.`)}
          </TabsContent>

          <TabsContent value="mias">
            {myRoutines.length === 0 ? (
              <div className={styles.emptyState}>
                <Sparkles size={22} />
                <p>Aún no has creado ninguna rutina.</p>
                <div className={styles.emptyStateActions}>
                  <Button asChild size="sm">
                    <Link href={`/entrenamientos/crear?category=${activeCategory}`}>
                      <Plus size={16} /> Crear rutina
                    </Link>
                  </Button>
                  {categoryRoutines.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAddPresetOpen(true)}
                    >
                      <Plus size={16} /> Agregar rutina predeterminada
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {categoryRoutines.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={styles.addPresetButton}
                    onClick={() => setAddPresetOpen(true)}
                  >
                    <Plus size={16} /> Agregar rutina predeterminada
                  </Button>
                )}
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
              </>
            )}
          </TabsContent>
        </Tabs>

        <RoutinePickerDialog
          open={addPresetOpen}
          onOpenChange={setAddPresetOpen}
          title="Agregar rutina predeterminada"
          items={categoryRoutines.map((r) => ({
            id: r.id,
            title: r.title,
            subtitle:
              r.splitType === "sesion"
                ? `${r.exercises.length} bloques`
                : `Nivel ${LEVEL_LABEL[r.level] ?? r.level}`,
          }))}
          selectedId=""
          onSelect={handleAddPresetRoutine}
          emptyLabel="No encontramos rutinas con ese nombre."
        />
        </>
      ) : (
        <>
          <p className={styles.sectionTitle}>Rutinas predeterminadas</p>
          {renderRoutineList(`Todavía no hay sesiones para ${meta.label}.`)}
        </>
      )}

      <Dialog open={categoryPickerOpen} onOpenChange={setCategoryPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elige una categoría</DialogTitle>
          </DialogHeader>
          <div className={styles.categoryList}>
            {UI_CATEGORIES.map((category) => {
              const catMeta = UI_CATEGORY_META[category];
              const Icon = catMeta.icon;
              const isActive = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  className={`${styles.categoryOption} ${
                    isActive ? styles.categoryOptionActive : ""
                  }`}
                  onClick={() => {
                    selectCategory(category);
                    setCategoryPickerOpen(false);
                  }}
                >
                  <Icon size={18} />
                  <span>{catMeta.label}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtros</DialogTitle>
            <DialogDescription>{meta.label}</DialogDescription>
          </DialogHeader>
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
            {showBodyTypeChips && availableBodyTypes.length > 1 && (
              <FilterChips
                label="Tipo de cuerpo"
                active={selectedBodyType}
                onSelect={setSelectedBodyType}
                options={[
                  { value: null, label: "Todos" },
                  ...availableBodyTypes.map((bt) => ({
                    value: bt,
                    label: BODY_TYPE_LABEL[bt],
                  })),
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
          {activeFilterCount > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
        </DialogContent>
      </Dialog>

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
                  const isExpanded = expandedExerciseIds.has(exercise.id);
                  return (
                    <div key={exercise.id} className={styles.exerciseRow}>
                      <button
                        type="button"
                        className={styles.exerciseRowTop}
                        onClick={() =>
                          imageUrl && toggleExerciseImage(exercise.id)
                        }
                        aria-expanded={imageUrl ? isExpanded : undefined}
                        style={
                          imageUrl ? undefined : { cursor: "default" }
                        }
                      >
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
                        {imageUrl && (
                          <ChevronDown
                            size={16}
                            className={`${styles.exerciseChevron} ${
                              isExpanded ? styles.exerciseChevronOpen : ""
                            }`}
                          />
                        )}
                      </button>
                      {imageUrl && isExpanded && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={`Inicio y final: ${exercise.exerciseName}`}
                          className={styles.exerciseImage}
                        />
                      )}
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
