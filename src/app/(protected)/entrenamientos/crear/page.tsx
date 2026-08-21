"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Dumbbell,
  Shield,
  Zap,
  Flame,
  Activity,
  Footprints,
  TrendingUp,
  Target,
  CircleDot,
  Layers,
  HeartPulse,
  Plus,
  Minus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useExercises } from "@/hooks/useExercises";
import { useCreateUserRoutine } from "@/hooks/useUserRoutines";
import type { Exercise, MuscleGroup } from "@/lib/exercises";
import { getExerciseImageUrl } from "@/lib/exerciseImages";
import styles from "./page.module.css";

const GROUP_META: Record<
  MuscleGroup,
  { label: string; icon: React.ComponentType<{ size?: number }> }
> = {
  pecho: { label: "Pecho", icon: Dumbbell },
  espalda: { label: "Espalda", icon: Shield },
  hombros: { label: "Hombros", icon: Zap },
  biceps: { label: "Bíceps", icon: Flame },
  triceps: { label: "Tríceps", icon: Activity },
  cuadriceps: { label: "Cuádriceps", icon: Footprints },
  isquiotibiales: { label: "Isquiotibiales", icon: TrendingUp },
  gluteos: { label: "Glúteos", icon: Target },
  pantorrillas: { label: "Pantorrillas", icon: CircleDot },
  abdomen: { label: "Abdomen", icon: Layers },
  cardio: { label: "Cardio", icon: HeartPulse },
};

const CATALOG_CATEGORIES = ["musculacion", "calistenia", "cardio"] as const;
type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

const CATEGORY_LABEL: Record<CatalogCategory, string> = {
  musculacion: "Musculación",
  calistenia: "Calistenia",
  cardio: "Cardio",
};

function parseCategory(value: string | null): CatalogCategory {
  if (value === "calistenia" || value === "cardio") return value;
  return "musculacion";
}

function filterExercisesByCategory(
  exercises: Exercise[],
  category: CatalogCategory,
): Exercise[] {
  if (category === "cardio") {
    return exercises.filter((e) => e.muscleGroup === "cardio");
  }
  if (category === "calistenia") {
    return exercises.filter(
      (e) => e.muscleGroup !== "cardio" && e.equipmentType === "peso_corporal",
    );
  }
  return exercises.filter(
    (e) => e.muscleGroup !== "cardio" && e.equipmentType === "gym",
  );
}

type CartItem = {
  exercise: Exercise;
  sets: number;
  repsLabel: string | null;
  durationLabel: string | null;
  restLabel: string;
};

type View = "groups" | "exercises" | "review";

export default function CrearRutinaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = parseCategory(searchParams.get("category"));
  const { data, isFetching } = useExercises();
  const createRoutine = useCreateUserRoutine();

  const [view, setView] = useState<View>(
    category === "cardio" ? "exercises" : "groups",
  );
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | null>(
    category === "cardio" ? "cardio" : null,
  );
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [routineName, setRoutineName] = useState("");
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

  const exercises = data?.exercises ?? [];

  const categoryExercises = useMemo(
    () => filterExercisesByCategory(exercises, category),
    [exercises, category],
  );

  const groupedExercises = useMemo(() => {
    if (!activeGroup) return [];
    return categoryExercises.filter((e) => e.muscleGroup === activeGroup);
  }, [categoryExercises, activeGroup]);

  const cartCount = Object.keys(cart).length;

  const toggleExercise = (exercise: Exercise) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[exercise.id]) {
        delete next[exercise.id];
      } else {
        next[exercise.id] = {
          exercise,
          sets: exercise.defaultSets,
          repsLabel: exercise.defaultRepsLabel,
          durationLabel: exercise.defaultDurationLabel,
          restLabel: exercise.defaultRestLabel,
        };
      }
      return next;
    });
  };

  const removeFromCart = (exerciseId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
  };

  const adjustSets = (exerciseId: string, delta: number) => {
    setCart((prev) => {
      const item = prev[exerciseId];
      if (!item) return prev;
      const nextSets = Math.min(10, Math.max(1, item.sets + delta));
      return { ...prev, [exerciseId]: { ...item, sets: nextSets } };
    });
  };

  const updateCartField = (
    exerciseId: string,
    patch: Partial<Pick<CartItem, "repsLabel" | "durationLabel" | "restLabel">>,
  ) => {
    setCart((prev) => {
      const item = prev[exerciseId];
      if (!item) return prev;
      return { ...prev, [exerciseId]: { ...item, ...patch } };
    });
  };

  const goBack = () => {
    if (view === "review") {
      setView("exercises");
      return;
    }
    if (view === "exercises" && category !== "cardio") {
      setView("groups");
    }
  };

  const handleSave = () => {
    const items = Object.values(cart);
    if (items.length === 0) {
      toast.error("Agrega al menos un ejercicio");
      return;
    }
    if (!routineName.trim()) {
      toast.error("Ponle un nombre a tu rutina");
      return;
    }
    const invalidItem = items.find(
      (item) =>
        !(item.repsLabel && item.repsLabel.trim()) &&
        !(item.durationLabel && item.durationLabel.trim()),
    );
    if (invalidItem) {
      toast.error(
        `Falta reps o duración para "${invalidItem.exercise.name}"`,
      );
      return;
    }

    createRoutine.mutate(
      {
        title: routineName.trim(),
        exercises: items.map((item) => ({
          exerciseId: item.exercise.id,
          exerciseName: item.exercise.name,
          muscleGroup: item.exercise.muscleGroup,
          sets: item.sets,
          repsLabel:
            item.repsLabel && item.repsLabel.trim()
              ? item.repsLabel.trim()
              : null,
          durationLabel:
            item.durationLabel && item.durationLabel.trim()
              ? item.durationLabel.trim()
              : null,
          restLabel: item.restLabel.trim() || "Sin descanso",
        })),
      },
      {
        onSuccess: () => {
          toast.success("Rutina creada");
          router.push(`/entrenamientos?category=${category}`);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "No se pudo crear la rutina",
          );
        },
      },
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        {view === "groups" || (view === "exercises" && category === "cardio") ? (
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={`/entrenamientos?category=${category}`} aria-label="Volver">
              <ArrowLeft size={18} />
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={goBack}
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </Button>
        )}
        <h1 className={styles.title}>
          {view === "groups" && `Crear rutina · ${CATEGORY_LABEL[category]}`}
          {view === "exercises" &&
            (category === "cardio"
              ? "Cardio"
              : activeGroup && GROUP_META[activeGroup].label)}
          {view === "review" && "Tu rutina"}
        </h1>
        <div className={styles.headerSpacer} />
      </div>

      {view === "groups" && (
        <>
          <p className={styles.hint}>
            Elige un grupo muscular para ver todos los ejercicios disponibles.
          </p>
          {isFetching && exercises.length === 0 ? (
            <div className={styles.loading}>
              <Spinner />
            </div>
          ) : (
            <div className={styles.groupGrid}>
              {(Object.keys(GROUP_META) as MuscleGroup[])
                .filter((group) => group !== "cardio")
                .map((group) => {
                  const meta = GROUP_META[group];
                  const Icon = meta.icon;
                  const countInCart = Object.values(cart).filter(
                    (item) => item.exercise.muscleGroup === group,
                  ).length;
                  return (
                    <button
                      key={group}
                      type="button"
                      className={styles.groupButton}
                      onClick={() => {
                        setActiveGroup(group);
                        setView("exercises");
                      }}
                    >
                      <Icon size={22} />
                      <span>{meta.label}</span>
                      {countInCart > 0 && (
                        <span className={styles.groupBadge}>{countInCart}</span>
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </>
      )}

      {view === "exercises" && activeGroup && (
        <div className={styles.exerciseList}>
          {category === "cardio" && (
            <p className={styles.hint}>
              Elige las actividades de cardio que quieras agregar a tu rutina.
            </p>
          )}
          {groupedExercises.map((exercise) => {
            const inCart = Boolean(cart[exercise.id]);
            const imageUrl = getExerciseImageUrl(exercise.name);
            const isExpanded = expandedExerciseIds.has(exercise.id);
            return (
              <div
                key={exercise.id}
                className={`${styles.exerciseRow} ${inCart ? styles.exerciseRowActive : ""}`}
              >
                <button
                  type="button"
                  className={styles.exerciseRowTop}
                  onClick={() => toggleExercise(exercise)}
                >
                  <div className={styles.exerciseInfo}>
                    <p className={styles.exerciseName}>{exercise.name}</p>
                    <p className={styles.exerciseMeta}>
                      {exercise.defaultRepsLabel
                        ? `${exercise.defaultSets} x ${exercise.defaultRepsLabel}`
                        : `${exercise.defaultDurationLabel ?? ""}`}{" "}
                      · Descanso {exercise.defaultRestLabel}
                    </p>
                  </div>
                  <div
                    className={`${styles.addIcon} ${inCart ? styles.addIconActive : ""}`}
                  >
                    {inCart ? <Check size={16} /> : <Plus size={16} />}
                  </div>
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    className={styles.imageToggle}
                    onClick={() => toggleExerciseImage(exercise.id)}
                    aria-expanded={isExpanded}
                  >
                    <span>Ver imagen</span>
                    <ChevronDown
                      size={14}
                      className={`${styles.exerciseChevron} ${
                        isExpanded ? styles.exerciseChevronOpen : ""
                      }`}
                    />
                  </button>
                )}
                {imageUrl && isExpanded && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={`Inicio y final: ${exercise.name}`}
                    className={styles.exerciseImage}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === "review" && (
        <div className={styles.review}>
          <Input
            placeholder="Nombre de tu rutina (ej. Mi rutina de push)"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            className={styles.nameInput}
          />
          <div className={styles.exerciseList}>
            {Object.values(cart).map((item) => {
              const isDurationBased = item.exercise.defaultRepsLabel === null;
              return (
                <div key={item.exercise.id} className={styles.reviewCard}>
                  <div className={styles.reviewCardHeader}>
                    <div className={styles.exerciseInfo}>
                      <p className={styles.exerciseName}>{item.exercise.name}</p>
                      <p className={styles.exerciseMeta}>
                        {GROUP_META[item.exercise.muscleGroup].label}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeFromCart(item.exercise.id)}
                      aria-label={`Quitar ${item.exercise.name}`}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className={styles.reviewFields}>
                    <div className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Series</span>
                      <div className={styles.stepperRow}>
                        <button
                          type="button"
                          className={styles.stepperButton}
                          onClick={() => adjustSets(item.exercise.id, -1)}
                          aria-label="Menos series"
                        >
                          <Minus size={12} />
                        </button>
                        <span className={styles.stepperValue}>{item.sets}</span>
                        <button
                          type="button"
                          className={styles.stepperButton}
                          onClick={() => adjustSets(item.exercise.id, 1)}
                          aria-label="Más series"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>
                        {isDurationBased ? "Duración" : "Reps"}
                      </span>
                      <Input
                        className={styles.fieldInput}
                        value={
                          (isDurationBased
                            ? item.durationLabel
                            : item.repsLabel) ?? ""
                        }
                        onChange={(e) =>
                          updateCartField(
                            item.exercise.id,
                            isDurationBased
                              ? { durationLabel: e.target.value }
                              : { repsLabel: e.target.value },
                          )
                        }
                        placeholder={isDurationBased ? "30 seg" : "10-12"}
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Descanso</span>
                      <Input
                        className={styles.fieldInput}
                        value={item.restLabel}
                        onChange={(e) =>
                          updateCartField(item.exercise.id, {
                            restLabel: e.target.value,
                          })
                        }
                        placeholder="90 seg"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={createRoutine.isPending}
          >
            {createRoutine.isPending ? <Spinner size="sm" /> : "Guardar rutina"}
          </Button>
        </div>
      )}

      {view !== "review" && cartCount > 0 && (
        <div className={styles.floatingBar}>
          <span>
            {cartCount} ejercicio{cartCount === 1 ? "" : "s"} seleccionado
            {cartCount === 1 ? "" : "s"}
          </span>
          <Button type="button" size="sm" onClick={() => setView("review")}>
            Ver mi rutina
          </Button>
        </div>
      )}
    </div>
  );
}
