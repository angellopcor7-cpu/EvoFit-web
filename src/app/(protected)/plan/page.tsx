"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Spinner } from "@/components/ui/Spinner";
import {
  RoutinePickerDialog,
  type RoutinePickerItem,
} from "@/components/RoutinePickerDialog";
import { useWorkoutRoutines } from "@/hooks/useWorkoutRoutines";
import { useUserRoutines } from "@/hooks/useUserRoutines";
import {
  useWeeklyPlan,
  useSaveWeeklyPlanEntry,
  useDeleteWeeklyPlanEntry,
} from "@/hooks/useWeeklyPlan";
import {
  DAY_ORDER,
  DAY_OF_WEEK_LABEL,
  formatPlannedTime,
  toPlannedTimeValue,
  type WeeklyPlanEntry,
} from "@/lib/weeklyPlan";
import {
  WORKOUT_CATEGORIES,
  WORKOUT_CATEGORY_LABEL,
  LEVEL_LABEL,
  type WorkoutCategory,
  type WorkoutRoutine,
} from "@/lib/workouts";
import styles from "./page.module.css";

const ALL_CATEGORIES_VALUE = "todas";

type RoutineSource = "predeterminada" | "propia";

type DayForm = {
  enabled: boolean;
  source: RoutineSource;
  category: WorkoutCategory;
  workoutRoutineId: string;
  userRoutineId: string;
  plannedTime: string;
};

function emptyDayForm(): DayForm {
  return {
    enabled: false,
    source: "predeterminada",
    category: "musculacion",
    workoutRoutineId: "",
    userRoutineId: "",
    plannedTime: "",
  };
}

function formFromEntry(entry: WeeklyPlanEntry, routines: WorkoutRoutine[]): DayForm {
  if (entry.userRoutineId) {
    return {
      enabled: true,
      source: "propia",
      category: "musculacion",
      workoutRoutineId: "",
      userRoutineId: entry.userRoutineId,
      plannedTime: formatPlannedTime(entry.plannedTime),
    };
  }
  const routine = routines.find((r) => r.id === entry.workoutRoutineId);
  return {
    enabled: true,
    source: "predeterminada",
    category: routine?.category ?? "musculacion",
    workoutRoutineId: entry.workoutRoutineId ?? "",
    userRoutineId: "",
    plannedTime: formatPlannedTime(entry.plannedTime),
  };
}

export default function PlanSemanalPage() {
  const router = useRouter();
  const { data: routinesData, isFetching: isFetchingRoutines } = useWorkoutRoutines();
  const { data: userRoutinesData, isFetching: isFetchingUserRoutines } = useUserRoutines();
  const { data: planData, isFetching: isFetchingPlan } = useWeeklyPlan();
  const saveEntry = useSaveWeeklyPlanEntry();
  const deleteEntry = useDeleteWeeklyPlanEntry();

  const allRoutines = routinesData?.routines ?? [];
  const myRoutines = userRoutinesData?.routines ?? [];

  const [days, setDays] = useState<Record<number, DayForm>>(() => {
    const initial: Record<number, DayForm> = {};
    DAY_ORDER.forEach((d) => {
      initial[d] = emptyDayForm();
    });
    return initial;
  });
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<{
    dayOfWeek: number;
    source: RoutineSource;
  } | null>(null);
  const [pickerCategory, setPickerCategory] = useState<string>(ALL_CATEGORIES_VALUE);

  useEffect(() => {
    if (initialized || !planData) return;
    setDays((prev) => {
      const next = { ...prev };
      planData.entries.forEach((entry) => {
        next[entry.dayOfWeek] = formFromEntry(entry, allRoutines);
      });
      return next;
    });
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planData, initialized]);

  const updateDay = (dayOfWeek: number, patch: Partial<DayForm>) => {
    setDays((prev) => ({ ...prev, [dayOfWeek]: { ...prev[dayOfWeek], ...patch } }));
  };

  const isLoading = isFetchingRoutines || isFetchingUserRoutines || isFetchingPlan;

  const openPicker = (dayOfWeek: number, source: RoutineSource) => {
    if (source === "predeterminada") {
      setPickerCategory(days[dayOfWeek].category ?? ALL_CATEGORIES_VALUE);
    }
    setPicker({ dayOfWeek, source });
  };

  const pickerCategoryOptions = [
    { value: ALL_CATEGORIES_VALUE, label: "Todas" },
    ...WORKOUT_CATEGORIES.map((cat) => ({
      value: cat,
      label: WORKOUT_CATEGORY_LABEL[cat],
    })),
  ];

  const pickerItems: RoutinePickerItem[] = useMemo(() => {
    if (!picker) return [];
    if (picker.source === "propia") {
      return myRoutines.map((routine) => ({
        id: routine.id,
        title: routine.title,
      }));
    }
    const source =
      pickerCategory === ALL_CATEGORIES_VALUE
        ? allRoutines
        : allRoutines.filter((r) => r.category === pickerCategory);
    return source.map((routine) => ({
      id: routine.id,
      title: routine.title,
      subtitle: `${WORKOUT_CATEGORY_LABEL[routine.category]} · ${
        LEVEL_LABEL[routine.level] ?? routine.level
      }`,
      filterValue: routine.dayLabel ?? "",
    }));
  }, [picker, pickerCategory, allRoutines, myRoutines]);

  const pickerSelectedId = picker
    ? picker.source === "propia"
      ? days[picker.dayOfWeek].userRoutineId
      : days[picker.dayOfWeek].workoutRoutineId
    : "";

  const handlePickerSelect = (id: string) => {
    if (!picker) return;
    if (picker.source === "propia") {
      updateDay(picker.dayOfWeek, { userRoutineId: id });
    } else {
      const routine = allRoutines.find((r) => r.id === id);
      updateDay(picker.dayOfWeek, {
        workoutRoutineId: id,
        category: routine?.category ?? days[picker.dayOfWeek].category,
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const dayOfWeek of DAY_ORDER) {
        const form = days[dayOfWeek];
        const existed = (planData?.entries ?? []).some((e) => e.dayOfWeek === dayOfWeek);

        if (!form.enabled) {
          if (existed) await deleteEntry.mutateAsync(dayOfWeek);
          continue;
        }

        if (form.source === "propia") {
          if (!form.userRoutineId) {
            toast.error(`Elige una rutina propia para el ${DAY_OF_WEEK_LABEL[dayOfWeek]}`);
            setSaving(false);
            return;
          }
          await saveEntry.mutateAsync({
            dayOfWeek,
            workoutRoutineId: null,
            userRoutineId: form.userRoutineId,
            plannedTime: toPlannedTimeValue(form.plannedTime),
          });
        } else {
          if (!form.workoutRoutineId) {
            toast.error(`Elige una rutina para el ${DAY_OF_WEEK_LABEL[dayOfWeek]}`);
            setSaving(false);
            return;
          }
          await saveEntry.mutateAsync({
            dayOfWeek,
            workoutRoutineId: form.workoutRoutineId,
            userRoutineId: null,
            plannedTime: toPlannedTimeValue(form.plannedTime),
          });
        }
      }
      toast.success("Plan semanal guardado");
      router.push("/home");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar el plan",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/home" aria-label="Volver">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <h1 className={styles.title}>Tu plan semanal</h1>
      </div>
      <p className={styles.subtitle}>
        Elige qué días vas a entrenar, qué rutina toca cada día (predeterminada o
        propia) y, si quieres, a qué hora — se repite cada semana.
      </p>

      {isLoading && !initialized ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : (
        <>
          <div className={styles.daysList}>
            {DAY_ORDER.map((dayOfWeek) => {
              const form = days[dayOfWeek];
              const selectedPredefTitle = allRoutines.find(
                (r) => r.id === form.workoutRoutineId,
              )?.title;
              const selectedUserTitle = myRoutines.find(
                (r) => r.id === form.userRoutineId,
              )?.title;
              return (
                <div key={dayOfWeek} className={styles.dayCard}>
                  <div className={styles.dayHeader}>
                    <span className={styles.dayLabel}>
                      {DAY_OF_WEEK_LABEL[dayOfWeek]}
                    </span>
                    <Switch
                      checked={form.enabled}
                      onCheckedChange={(checked) => updateDay(dayOfWeek, { enabled: checked })}
                    />
                  </div>

                  {form.enabled && (
                    <div className={styles.dayBody}>
                      <div className={styles.sourceToggle}>
                        <button
                          type="button"
                          className={`${styles.sourceButton} ${
                            form.source === "predeterminada" ? styles.sourceButtonActive : ""
                          }`}
                          onClick={() => updateDay(dayOfWeek, { source: "predeterminada" })}
                        >
                          Predeterminada
                        </button>
                        <button
                          type="button"
                          className={`${styles.sourceButton} ${
                            form.source === "propia" ? styles.sourceButtonActive : ""
                          }`}
                          onClick={() => updateDay(dayOfWeek, { source: "propia" })}
                        >
                          Mi rutina
                        </button>
                      </div>

                      {form.source === "predeterminada" ? (
                        <button
                          type="button"
                          className={styles.routinePickerButton}
                          onClick={() => openPicker(dayOfWeek, "predeterminada")}
                        >
                          <Search size={14} className={styles.routinePickerIcon} />
                          <span
                            className={
                              selectedPredefTitle
                                ? styles.routinePickerValue
                                : styles.routinePickerPlaceholder
                            }
                          >
                            {selectedPredefTitle ?? "Buscar rutina predeterminada"}
                          </span>
                        </button>
                      ) : myRoutines.length === 0 ? (
                        <p className={styles.emptyHint}>
                          Todavía no tienes rutinas propias.{" "}
                          <Link href="/entrenamientos/crear?category=musculacion">
                            Crea una
                          </Link>
                          .
                        </p>
                      ) : (
                        <button
                          type="button"
                          className={styles.routinePickerButton}
                          onClick={() => openPicker(dayOfWeek, "propia")}
                        >
                          <Search size={14} className={styles.routinePickerIcon} />
                          <span
                            className={
                              selectedUserTitle
                                ? styles.routinePickerValue
                                : styles.routinePickerPlaceholder
                            }
                          >
                            {selectedUserTitle ?? "Buscar tu rutina"}
                          </span>
                        </button>
                      )}

                      <div className={styles.timeRow}>
                        <Clock size={14} className={styles.timeIcon} />
                        <Input
                          type="time"
                          value={form.plannedTime}
                          onChange={(e) =>
                            updateDay(dayOfWeek, { plannedTime: e.target.value })
                          }
                          className={styles.timeInput}
                        />
                        {form.plannedTime && (
                          <button
                            type="button"
                            className={styles.clearTimeButton}
                            onClick={() => updateDay(dayOfWeek, { plannedTime: "" })}
                            aria-label="Quitar hora"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar plan semanal"}
          </Button>
        </>
      )}

      <RoutinePickerDialog
        open={picker !== null}
        onOpenChange={(open) => {
          if (!open) setPicker(null);
        }}
        title={
          picker?.source === "propia" ? "Elige tu rutina" : "Buscar rutina predeterminada"
        }
        searchPlaceholder={
          picker?.source === "propia" ? "Buscar entre tus rutinas..." : "Buscar rutina..."
        }
        items={pickerItems}
        selectedId={pickerSelectedId}
        onSelect={handlePickerSelect}
        categories={picker?.source === "predeterminada" ? pickerCategoryOptions : undefined}
        activeCategory={pickerCategory}
        onCategoryChange={setPickerCategory}
        emptyLabel="No encontramos rutinas con ese nombre."
      />
    </div>
  );
}
