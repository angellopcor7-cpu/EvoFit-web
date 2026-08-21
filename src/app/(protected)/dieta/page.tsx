"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Flame, Beef, Wheat, Droplet, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";
import { useDietPlan, useCreateDietPlan, useRegenerateDietPlan } from "@/hooks/useDietPlan";
import { useAuthSession } from "@/hooks/useProfile";
import {
  DIET_GOALS,
  DIET_GOAL_LABEL,
  DIET_STYLES,
  DIET_STYLE_LABEL,
  DIET_BUDGETS,
  DIET_BUDGET_LABEL,
  DIET_MEAL_SLOT_LABEL,
  DIET_PROTEIN_TYPES,
  DIET_PROTEIN_TYPE_LABEL,
  type DietGoal,
  type DietStyle,
  type DietBudget,
  type DietProteinType,
} from "@/lib/diet";
import {
  ACTIVITY_LEVELS,
  ACTIVITY_LEVEL_LABEL,
  SEX_OPTIONS,
  type ActivityLevel,
  type Sex,
} from "@/lib/dietCalculations";
import styles from "./page.module.css";

type Step = "meta" | "datos" | "resultado";

export default function DietaPage() {
  const { data, isLoading } = useDietPlan();
  const { data: sessionData } = useAuthSession();
  const createPlan = useCreateDietPlan();
  const regeneratePlan = useRegenerateDietPlan();
  const allergies = sessionData?.profile?.allergies?.trim() || null;

  const [step, setStep] = useState<Step | null>(null);
  const [goal, setGoal] = useState<DietGoal | null>(null);
  const [dietStyle, setDietStyle] = useState<DietStyle | null>(null);
  const [budget, setBudget] = useState<DietBudget | null>(null);
  const [sex, setSex] = useState<Sex>("masculino");
  const [age, setAge] = useState("28");
  const [heightCm, setHeightCm] = useState("170");
  const [weightKg, setWeightKg] = useState("70");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderado");
  const [proteinPreferences, setProteinPreferences] = useState<DietProteinType[]>([]);

  useEffect(() => {
    if (step === null && data !== undefined) {
      setStep(data.plan ? "resultado" : "meta");
    }
  }, [data, step]);

  // Cada día, al abrir la pantalla, se regenera el menú automáticamente para
  // variar las comidas — solo si todavía no se regeneró hoy.
  useEffect(() => {
    const plan = data?.plan;
    if (!plan) return;
    const todayUtc = new Date().toISOString().slice(0, 10);
    if (plan.mealsGeneratedOn === todayUtc) return;
    regeneratePlan.mutate({ proteinPreferences: plan.proteinPreferences });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.plan?.id, data?.plan?.mealsGeneratedOn]);

  const toggleProtein = (protein: DietProteinType) => {
    setProteinPreferences((prev) =>
      prev.includes(protein)
        ? prev.filter((p) => p !== protein)
        : [...prev, protein],
    );
  };

  const handleContinueFromMeta = () => {
    if (!goal) {
      toast.error("Elige una meta");
      return;
    }
    if (!dietStyle) {
      toast.error("Elige un estilo de alimentación");
      return;
    }
    if (!budget) {
      toast.error("Elige tu presupuesto");
      return;
    }
    setStep("datos");
  };

  const handleCreatePlan = () => {
    if (!goal || !dietStyle || !budget) {
      setStep("meta");
      return;
    }
    const ageNum = Number(age);
    const heightNum = Number(heightCm);
    const weightNum = Number(weightKg);
    if (!ageNum || !heightNum || !weightNum) {
      toast.error("Revisa tus datos: edad, estatura y peso");
      return;
    }

    createPlan.mutate(
      {
        goal,
        dietStyle,
        budget,
        sex,
        age: ageNum,
        heightCm: heightNum,
        weightKg: weightNum,
        activityLevel,
        proteinPreferences,
      },
      {
        onSuccess: () => {
          toast.success("Tu plan de alimentación está listo");
          setStep("resultado");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "No se pudo crear tu plan",
          );
        },
      },
    );
  };

  const handleRegenerate = () => {
    regeneratePlan.mutate(
      { proteinPreferences },
      {
        onSuccess: () => toast.success("Menú actualizado"),
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "No se pudo regenerar tu menú",
          );
        },
      },
    );
  };

  const plan = data?.plan ?? null;

  if (isLoading || step === null) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/home" aria-label="Volver">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <h1 className={styles.title}>
          {step === "meta" && "Arma tu dieta"}
          {step === "datos" && "Tus datos"}
          {step === "resultado" && "Tu plan"}
        </h1>
        <div className={styles.headerSpacer} />
      </div>

      {step === "meta" && (
        <div className={styles.stepContent}>
          <p className={styles.hint}>¿Cuál es tu meta principal?</p>
          <div className={styles.chipGrid}>
            {DIET_GOALS.map((g) => (
              <button
                key={g}
                type="button"
                className={`${styles.chip} ${goal === g ? styles.chipActive : ""}`}
                onClick={() => setGoal(g)}
              >
                {DIET_GOAL_LABEL[g]}
              </button>
            ))}
          </div>

          <p className={styles.hint}>¿Qué estilo de alimentación prefieres?</p>
          <div className={styles.chipGrid}>
            {DIET_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.chip} ${dietStyle === s ? styles.chipActive : ""}`}
                onClick={() => setDietStyle(s)}
              >
                {DIET_STYLE_LABEL[s]}
              </button>
            ))}
          </div>

          <p className={styles.hint}>¿Cuál es tu presupuesto?</p>
          <div className={styles.chipGrid}>
            {DIET_BUDGETS.map((b) => (
              <button
                key={b}
                type="button"
                className={`${styles.chip} ${budget === b ? styles.chipActive : ""}`}
                onClick={() => setBudget(b)}
              >
                {DIET_BUDGET_LABEL[b]}
              </button>
            ))}
          </div>

          <Button type="button" className={styles.primaryButton} onClick={handleContinueFromMeta}>
            Continuar
          </Button>
        </div>
      )}

      {step === "datos" && (
        <div className={styles.stepContent}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Sexo</span>
            <div className={styles.chipGrid}>
              {SEX_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.chip} ${sex === option ? styles.chipActive : ""}`}
                  onClick={() => setSex(option)}
                >
                  {option === "masculino" ? "Masculino" : "Femenino"}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.dataGrid}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Edad</span>
              <Input
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Estatura (cm)</span>
              <Input
                type="number"
                inputMode="numeric"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Peso (kg)</span>
              <Input
                type="number"
                inputMode="numeric"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Nivel de actividad</span>
            <Select
              value={activityLevel}
              onValueChange={(value) => setActivityLevel(value as ActivityLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {ACTIVITY_LEVEL_LABEL[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>
              Proteínas que prefieres (opcional)
            </span>
            <div className={styles.chipGrid}>
              {DIET_PROTEIN_TYPES.filter((p) => p !== "ninguna").map((protein) => (
                <button
                  key={protein}
                  type="button"
                  className={`${styles.chip} ${proteinPreferences.includes(protein) ? styles.chipActive : ""}`}
                  onClick={() => toggleProtein(protein)}
                >
                  {DIET_PROTEIN_TYPE_LABEL[protein]}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            className={styles.primaryButton}
            onClick={handleCreatePlan}
            disabled={createPlan.isPending}
          >
            {createPlan.isPending ? <Spinner size="sm" /> : "Calcular mi plan"}
          </Button>
        </div>
      )}

      {step === "resultado" && plan && (
        <div className={styles.stepContent}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryEyebrow}>
              {DIET_GOAL_LABEL[plan.goal]} · {DIET_STYLE_LABEL[plan.dietStyle]} ·{" "}
              {DIET_BUDGET_LABEL[plan.budget]}
            </p>
            <p className={styles.summaryKcal}>{plan.targetKcal} kcal/día</p>
            <div className={styles.macrosRow}>
              <div className={styles.macroStat}>
                <Beef size={16} className={styles.macroIconProtein} />
                <span>{plan.targetProteinG} g</span>
                <span className={styles.macroLabel}>Proteína</span>
              </div>
              <div className={styles.macroStat}>
                <Wheat size={16} className={styles.macroIconCarbs} />
                <span>{plan.targetCarbsG} g</span>
                <span className={styles.macroLabel}>Carbos</span>
              </div>
              <div className={styles.macroStat}>
                <Droplet size={16} className={styles.macroIconFat} />
                <span>{plan.targetFatG} g</span>
                <span className={styles.macroLabel}>Grasa</span>
              </div>
            </div>
          </div>

          {allergies && (
            <p className={styles.allergyNote}>
              <ShieldAlert size={14} /> Evitando alimentos con: {allergies}
            </p>
          )}

          <div className={styles.mealList}>
            {plan.meals.map((meal) => (
              <div key={meal.id} className={styles.mealCard}>
                <p className={styles.mealSlot}>
                  {DIET_MEAL_SLOT_LABEL[meal.mealSlot]}
                </p>
                <p className={styles.mealName}>{meal.name}</p>
                <p className={styles.mealDescription}>{meal.description}</p>
                <p className={styles.mealMacros}>
                  <Flame size={12} /> {meal.kcal} kcal · P {meal.proteinG}g · C{" "}
                  {meal.carbsG}g · G {meal.fatG}g
                </p>
              </div>
            ))}
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>
              Proteínas que prefieres al regenerar
            </span>
            <div className={styles.chipGrid}>
              {DIET_PROTEIN_TYPES.filter((p) => p !== "ninguna").map((protein) => (
                <button
                  key={protein}
                  type="button"
                  className={`${styles.chip} ${proteinPreferences.includes(protein) ? styles.chipActive : ""}`}
                  onClick={() => toggleProtein(protein)}
                >
                  {DIET_PROTEIN_TYPE_LABEL[protein]}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className={styles.primaryButton}
            onClick={handleRegenerate}
            disabled={regeneratePlan.isPending}
          >
            {regeneratePlan.isPending ? (
              <Spinner size="sm" />
            ) : (
              <>
                <RefreshCw size={16} /> Regenerar menú
              </>
            )}
          </Button>

          <button
            type="button"
            className={styles.rebuildLink}
            onClick={() => {
              setGoal(plan.goal);
              setDietStyle(plan.dietStyle);
              setBudget(plan.budget);
              setStep("meta");
            }}
          >
            Rehacer mi plan desde cero
          </button>
        </div>
      )}
    </div>
  );
}
