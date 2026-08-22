"use client";

import { Input } from "./ui/Input";
import {
  BODY_TYPES,
  BODY_TYPE_LABEL,
  BODY_TYPE_DESCRIPTION,
  SEX_OPTIONS,
  SEX_LABEL,
  type BodyType,
  type Sex,
} from "@/hooks/useProfile";
import styles from "./BodyDataForm.module.css";

const WEEKLY_GOAL_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export type BodyDataFormValue = {
  weightKg: string;
  heightCm: string;
  age: string;
  sex: Sex | null;
  weeklyWorkoutGoal: number | null;
  bodyType: BodyType | null;
  allergies: string;
};

export function emptyBodyDataFormValue(): BodyDataFormValue {
  return {
    weightKg: "",
    heightCm: "",
    age: "",
    sex: null,
    weeklyWorkoutGoal: null,
    bodyType: null,
    allergies: "",
  };
}

// Formulario de datos corporales compartido entre el onboarding (primer
// paso, después de la bienvenida) y "Editar perfil" en Perfil — para no
// duplicar los chips de tipo de cuerpo/sexo/meta semanal en dos lugares.
export function BodyDataForm({
  value,
  onChange,
}: {
  value: BodyDataFormValue;
  onChange: (patch: Partial<BodyDataFormValue>) => void;
}) {
  return (
    <div className={styles.form}>
      <div className={styles.dataGrid}>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Peso (kg)</span>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="70"
            value={value.weightKg}
            onChange={(e) => onChange({ weightKg: e.target.value })}
          />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Estatura (cm)</span>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="170"
            value={value.heightCm}
            onChange={(e) => onChange({ heightCm: e.target.value })}
          />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Edad</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="28"
            value={value.age}
            onChange={(e) => onChange({ age: e.target.value })}
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
              className={`${styles.chip} ${value.sex === option ? styles.chipActive : ""}`}
              onClick={() => onChange({ sex: option })}
            >
              {SEX_LABEL[option]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.fieldRow}>
        <span className={styles.fieldLabel}>
          ¿Cuántos días a la semana planeas entrenar?
        </span>
        <p className={styles.fieldHint}>
          Así no perdemos tu racha en tus días de descanso — solo si no
          llegas a esta meta en la semana.
        </p>
        <div className={styles.chipRow}>
          {WEEKLY_GOAL_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={`${styles.chip} ${
                value.weeklyWorkoutGoal === n ? styles.chipActive : ""
              }`}
              onClick={() => onChange({ weeklyWorkoutGoal: n })}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.fieldRow}>
        <span className={styles.fieldLabel}>Tipo de cuerpo</span>
        <p className={styles.fieldHint}>
          Si no sabes cuál eres, lee las descripciones y elige la que más se
          parezca a ti — no tiene que ser exacto.
        </p>
        <div className={styles.bodyTypeList}>
          {BODY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`${styles.bodyTypeOption} ${
                value.bodyType === type ? styles.bodyTypeOptionActive : ""
              }`}
              onClick={() => onChange({ bodyType: type })}
            >
              <span className={styles.bodyTypeName}>{BODY_TYPE_LABEL[type]}</span>
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
          value={value.allergies}
          onChange={(e) => onChange({ allergies: e.target.value })}
          maxLength={200}
        />
      </div>
    </div>
  );
}
