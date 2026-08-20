"use client";

import { Flame, Dumbbell, TrendingUp } from "lucide-react";
import { useAuthSession } from "@/hooks/useProfile";
import styles from "./page.module.css";

const sampleWeek = [
  { day: "L", value: 40 },
  { day: "M", value: 70 },
  { day: "M", value: 0 },
  { day: "J", value: 85 },
  { day: "V", value: 55 },
  { day: "S", value: 100 },
  { day: "D", value: 0 },
];

export default function ProgresoPage() {
  const { data } = useAuthSession();
  const profile = data?.profile;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tu progreso</h1>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Flame size={18} className={styles.statIconStreak} />
          <span className={styles.statValue}>
            {profile?.currentStreak ?? 0}
          </span>
          <span className={styles.statLabel}>Racha actual</span>
        </div>
        <div className={styles.statCard}>
          <TrendingUp size={18} className={styles.statIconBest} />
          <span className={styles.statValue}>
            {profile?.longestStreak ?? 0}
          </span>
          <span className={styles.statLabel}>Mejor racha</span>
        </div>
        <div className={styles.statCard}>
          <Dumbbell size={18} className={styles.statIconWorkouts} />
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>Entrenamientos</span>
        </div>
      </div>

      <div className={styles.chartCard}>
        <p className={styles.chartTitle}>Actividad de la semana</p>
        <div className={styles.bars}>
          {sampleWeek.map((entry, index) => (
            <div key={index} className={styles.barColumn}>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ height: `${entry.value}%` }}
                />
              </div>
              <span className={styles.barLabel}>{entry.day}</span>
            </div>
          ))}
        </div>
      </div>

      <p className={styles.note}>
        Completa entrenamientos para ver aquí tu evolución real.
      </p>
    </div>
  );
}
