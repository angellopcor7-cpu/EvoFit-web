"use client";

import { Flame } from "lucide-react";
import { useAuthSession } from "@/hooks/useProfile";
import { NotificationBell } from "./NotificationBell";
import styles from "./TopBar.module.css";

export const TopBar = () => {
  const { data } = useAuthSession();
  const streak = data?.profile?.currentStreak ?? 0;

  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="EvoFit" className={styles.logoImg} />
      </div>
      <div className={styles.rightSection}>
        <div className={styles.streakPill}>
          <Flame size={14} />
          <span>{streak}</span>
        </div>
        <NotificationBell />
      </div>
    </header>
  );
};
