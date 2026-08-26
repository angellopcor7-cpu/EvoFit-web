// Evolución física: una foto al día 1, y luego una por mes hasta el mes 12.
// Cada milestone se desbloquea 30 días después de que se tomó la foto
// ANTERIOR (no desde una fecha fija de día 1) — así, si te tardas más en
// tomar una foto, el siguiente mes se recorre en vez de quedar huérfano.
export const PROGRESS_MILESTONE_COUNT = 13; // índice 0 = Día 1, 1-12 = Mes 1..12
const UNLOCK_DAYS = 30;

export function milestoneLabel(index: number): string {
  return index === 0 ? "Día 1" : `Mes ${index}`;
}

export function milestoneShortLabel(index: number): string {
  return index === 0 ? "D1" : `M${index}`;
}

// Fecha en la que se desbloquea el siguiente milestone: 30 días después de
// la fecha en que se tomó la foto anterior.
export function milestoneUnlockDate(previousPhotoDate: Date): Date {
  const unlock = new Date(previousPhotoDate);
  unlock.setDate(unlock.getDate() + UNLOCK_DAYS);
  return unlock;
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export type ProgressPhoto = {
  milestoneIndex: number;
  storagePath: string;
  takenAt: string;
  url: string | null;
};

export type MilestoneSlot = {
  index: number;
  label: string;
  status: "taken" | "available" | "locked";
  photo: ProgressPhoto | null;
  unlocksAt: Date | null;
};

export function buildMilestoneSlots(photos: ProgressPhoto[]): MilestoneSlot[] {
  const byIndex = new Map(photos.map((p) => [p.milestoneIndex, p]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots: MilestoneSlot[] = [];

  for (let index = 0; index < PROGRESS_MILESTONE_COUNT; index++) {
    const photo = byIndex.get(index) ?? null;
    if (photo) {
      slots.push({ index, label: milestoneLabel(index), status: "taken", photo, unlocksAt: null });
      continue;
    }
    if (index === 0) {
      slots.push({ index, label: milestoneLabel(index), status: "available", photo: null, unlocksAt: null });
      continue;
    }
    // Un mes solo cuenta sus 30 días a partir de que se tomó la foto del
    // mes inmediatamente anterior — si ese todavía no se tomó, este sigue
    // bloqueado sin fecha de desbloqueo definida (no se puede saltar).
    const previousPhoto = byIndex.get(index - 1);
    if (!previousPhoto) {
      slots.push({ index, label: milestoneLabel(index), status: "locked", photo: null, unlocksAt: null });
      continue;
    }
    const previousTakenDate = new Date(`${previousPhoto.takenAt}T00:00:00`);
    const unlocksAt = milestoneUnlockDate(previousTakenDate);
    const status = today >= unlocksAt ? "available" : "locked";
    slots.push({ index, label: milestoneLabel(index), status, photo: null, unlocksAt });
  }
  return slots;
}
