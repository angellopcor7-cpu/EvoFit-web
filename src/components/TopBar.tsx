"use client";

import { Flame } from "lucide-react";
import { useAuthSession } from "@/hooks/useProfile";
import styles from "./TopBar.module.css";

export const TopBar = () => {
  const { data } = useAuthSession();
  const streak = data?.profile?.currentStreak ?? 0;

  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <div className={styles.logoBadge}>EF</div>
        <span className={styles.wordmark}>
          <span className={styles.brandEvo}>EVO</span>
          <span className={styles.brandFit}>FIT</span>
        </span>
      </div>
      <div className={styles.streakPill}>
        <Flame size={14} />
        <span>{streak}</span>
      </div>
    </header>
  );
};
