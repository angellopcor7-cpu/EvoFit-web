"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/Dialog";
import {
  useAuthSession,
  useSaveBodyProfile,
  BODY_TYPES,
  BODY_TYPE_LABEL,
  BODY_TYPE_DESCRIPTION,
  SEX_OPTIONS,
  SEX_LABEL,
  type BodyType,
  type Sex,
} from "@/hooks/useProfile";
import { useCreateGoal } from "@/hooks/useGoals";
import {
  GOAL_TYPE_META,
  GOAL_DEADLINE_PRESETS,
  addDaysIso,
  type GoalType,
} from "@/lib/goals";
import styles from "./OnboardingDialog.module.css";

const GOAL_TYPES: GoalType[] = ["peso", "distancia", "repeticiones", "personalizada"];

// Onboarding en dos pasos, después del mensaje de bienvenida:
// 1) datos básicos del cuerpo (peso/estatura/edad/sexo/tipo de cuerpo/alergias)
// 2) su primera meta, con tiempo límite — se crea directo en `user_goals`
//    para que aparezca de inmediato en la pestaña Metas.
// Se muestra una sola vez — profiles.has_completed_onboarding pasa a true
// al guardar el paso 1. Si el usuario lo pospone, vuelve a aparecer en su
// próximo inicio de sesión; el paso de la meta se puede omitir sin afectar
// eso, porque es un extra opcional.
export const OnboardingDialog = () => {
  const { data } = useAuthSession();
  const saveBodyProfile = useSaveBodyProfile();
  const createGoal = useCreateGoal();
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState<"datos" | "meta">("datos");

  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);
  const [bodyType, setBodyType] = useState<BodyType | null>(null);
  const [allergies, setAllergies] = useState("");

  const [goalTitle, setGoalTitle] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("peso");
  const [goalTargetValue, setGoalTargetValue] = useState("");
  const [goalCustomUnit, setGoalCustomUnit] = useState("");
  const [goalDeadlineDays, setGoalDeadlineDays] = useState<number | null>(null);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [goalCustomDate, setGoalCustomDate] = useState("");

  const profile = data?.profile;
  const open =
    !!profile && profile.hasSeenWelcome && !profile.hasCompletedOnboarding && !dismissed;

  const parseNumber = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSave = () => {
    saveBodyProfile.mutate(
      {
        weightKg: parseNumber(weightKg),
        heightCm: parseNumber(heightCm),
        age: parseNumber(age),
        sex,
        bodyType,
        allergies: allergies.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Datos guardados");
          setStep("meta");
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : "No se pudo guardar",
          ),
      },
    );
  };

  const handleSkipGoal = () => setDismissed(true);

  const handleSaveGoal = () => {
    if (!goalTitle.trim()) {
      toast.error("Ponle un nombre a tu meta");
      return;
    }
    const value = Number(goalTargetValue);
    if (!value || value <= 0) {
      toast.error("Ingresa un valor objetivo válido");
      return;
    }

    let targetDate: string;
    if (useCustomDate) {
      if (!goalCustomDate) {
        toast.error("Elige una fecha límite");
        return;
      }
      targetDate = goalCustomDate;
    } else if (goalDeadlineDays !== null) {
      targetDate = addDaysIso(goalDeadlineDays);
    } else {
      toast.error("Elige un tiempo límite para tu meta");
      return;
    }

    const unit =
      goalType === "personalizada" ? goalCustomUnit.trim() : GOAL_TYPE_META[goalType].unit;

    createGoal.mutate(
      {
        title: goalTitle.trim(),
        goalType,
        unit,
        targetValue: value,
        targetDate,
      },
      {
        onSuccess: () => {
          toast.success("Meta creada");
          setDismissed(true);
        },
        onError: () => toast.error("No se pudo crear la meta"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && setDismissed(true)}>
      <DialogContent>
        {step === "datos" ? (
          <>
            <DialogHeader>
              <DialogTitle>Cuéntanos sobre ti</DialogTitle>
              <DialogDescription>
                Esto nos ayuda a personalizar tu experiencia. Puedes
                completarlo después si quieres.
              </DialogDescription>
            </DialogHeader>

            <div className={styles.form}>
              <div className={styles.dataGrid}>
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>Peso (kg)</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="70"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                </div>
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>Estatura (cm)</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="170"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                  />
                </div>
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>Edad</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Sexo</span>
                <div className={styles.chipRow}>
                  {SEX_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`${styles.chip} ${sex === option ? styles.chipActive : ""}`}
                      onClick={() => setSex(option)}
                    >
                      {SEX_LABEL[option]}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Tipo de cuerpo</span>
                <p className={styles.fieldHint}>
                  Si no sabes cuál eres, lee las descripciones y elige la que
                  más se parezca a ti — no tiene que ser exacto.
                </p>
                <div className={styles.bodyTypeList}>
                  {BODY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`${styles.bodyTypeOption} ${
                        bodyType === type ? styles.bodyTypeOptionActive : ""
                      }`}
                      onClick={() => setBodyType(type)}
                    >
                      <span className={styles.bodyTypeName}>
                        {BODY_TYPE_LABEL[type]}
                      </span>
                      <span className={styles.bodyTypeDescription}>
                        {BODY_TYPE_DESCRIPTION[type]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Alergias (opcional)</span>
                <Input
                  placeholder="Ej. maní, mariscos, lactosa"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  maxLength={200}
                />
              </div>

              <Button
                type="button"
                className={styles.saveButton}
                onClick={handleSave}
                disabled={saveBodyProfile.isPending}
              >
                {saveBodyProfile.isPending ? "Guardando..." : "Continuar"}
              </Button>
              <button
                type="button"
                className={styles.laterLink}
                onClick={() => setDismissed(true)}
              >
                Completar más tarde
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>¿Cuál es tu meta?</DialogTitle>
              <DialogDescription>
                Ponle un tiempo límite y la vas a ver de inmediato en tu
                pestaña de Metas. Puedes omitir esto si quieres.
              </DialogDescription>
            </DialogHeader>

            <div className={styles.form}>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Meta</span>
                <Input
                  placeholder="Ej. Bajar de peso, correr 5K sin parar..."
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                />
              </div>

              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Tipo</span>
                <div className={styles.chipRow}>
                  {GOAL_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`${styles.chip} ${
                        goalType === type ? styles.chipActive : ""
                      }`}
                      onClick={() => setGoalType(type)}
                    >
                      {GOAL_TYPE_META[type].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Valor objetivo</span>
                <div className={styles.valueRow}>
                  <Input
                    type="number"
                    min={0}
                    placeholder={GOAL_TYPE_META[goalType].placeholder}
                    value={goalTargetValue}
                    onChange={(e) => setGoalTargetValue(e.target.value)}
                  />
                  {goalType === "personalizada" && (
                    <Input
                      placeholder="Unidad (ej. sesiones)"
                      value={goalCustomUnit}
                      onChange={(e) => setGoalCustomUnit(e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Tiempo límite</span>
                <div className={styles.chipRow}>
                  {GOAL_DEADLINE_PRESETS.map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      className={`${styles.chip} ${
                        !useCustomDate && goalDeadlineDays === preset.days
                          ? styles.chipActive
                          : ""
                      }`}
                      onClick={() => {
                        setUseCustomDate(false);
                        setGoalDeadlineDays(preset.days);
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
                    value={goalCustomDate}
                    onChange={(e) => setGoalCustomDate(e.target.value)}
                  />
                )}
              </div>

              <Button
                type="button"
                className={styles.saveButton}
                onClick={handleSaveGoal}
                disabled={createGoal.isPending}
              >
                {createGoal.isPending ? "Guardando..." : "Guardar meta"}
              </Button>
              <button
                type="button"
                className={styles.laterLink}
                onClick={handleSkipGoal}
              >
                Omitir por ahora
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
