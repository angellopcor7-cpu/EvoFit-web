// Evolución física: una foto al día 1, y luego una por mes hasta el mes 12.
export const PROGRESS_MILESTONE_COUNT = 13; // índice 0 = Día 1, 1-12 = Mes 1..12

export function milestoneLabel(index: number): string {
  return index === 0 ? "Día 1" : `Mes ${index}`;
}

export function milestoneShortLabel(index: number): string {
  return index === 0 ? "D1" : `M${index}`;
}

// Fecha en la que se desbloquea un milestone, contando desde la fecha de la
// foto del Día 1 (milestone 0). El Día 1 siempre está desbloqueado.
export function milestoneUnlockDate(day1Date: Date, index: number): Date {
  const unlock = new Date(day1Date);
  unlock.setMonth(unlock.getMonth() + index);
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
  const day1 = byIndex.get(0);
  const day1Date = day1 ? new Date(`${day1.takenAt}T00:00:00`) : null;
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
    if (!day1Date) {
      slots.push({ index, label: milestoneLabel(index), status: "locked", photo: null, unlocksAt: null });
      continue;
    }
    const unlocksAt = milestoneUnlockDate(day1Date, index);
    const status = today >= unlocksAt ? "available" : "locked";
    slots.push({ index, label: milestoneLabel(index), status, photo: null, unlocksAt });
  }
  return slots;
}
