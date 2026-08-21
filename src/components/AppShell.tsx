import React from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { WelcomeDialog } from "./WelcomeDialog";
import styles from "./AppShell.module.css";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.shell}>
      <TopBar />
      <main className={styles.content}>{children}</main>
      <BottomNav />
      <WelcomeDialog />
    </div>
  );
};
