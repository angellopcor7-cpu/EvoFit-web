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
  type BodyType,
} from "@/hooks/useProfile";
import styles from "./OnboardingDialog.module.css";

// Primer paso del onboarding (después del mensaje de bienvenida): pedir
// datos básicos del cuerpo para poder personalizar la experiencia más
// adelante. Se muestra una sola vez — profiles.has_completed_onboarding
// pasa a true al guardar. Si el usuario lo pospone, vuelve a aparecer en
// su próximo inicio de sesión.
export const OnboardingDialog = () => {
  const { data } = useAuthSession();
  const saveBodyProfile = useSaveBodyProfile();
  const [dismissed, setDismissed] = useState(false);

  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [bodyType, setBodyType] = useState<BodyType | null>(null);
  const [allergies, setAllergies] = useState("");

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
        bodyType,
        allergies: allergies.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Datos guardados");
          setDismissed(true);
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : "No se pudo guardar",
          ),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && setDismissed(true)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cuéntanos sobre ti</DialogTitle>
          <DialogDescription>
            Esto nos ayuda a personalizar tu experiencia. Puedes completarlo
            después si quieres.
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
            <span className={styles.fieldLabel}>Tipo de cuerpo</span>
            <p className={styles.fieldHint}>
              Si no sabes cuál eres, lee las descripciones y elige la que más
              se parezca a ti — no tiene que ser exacto.
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
            {saveBodyProfile.isPending ? "Guardando..." : "Guardar"}
          </Button>
          <button
            type="button"
            className={styles.laterLink}
            onClick={() => setDismissed(true)}
          >
            Completar más tarde
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
