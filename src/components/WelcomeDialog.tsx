"use client";

import { useState } from "react";
import { Flame, Dumbbell, TrendingUp } from "lucide-react";
import { Button } from "./ui/Button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/Dialog";
import { useAuthSession, useMarkWelcomeSeen } from "@/hooks/useProfile";
import styles from "./WelcomeDialog.module.css";

const HIGHLIGHTS = [
  {
    icon: Dumbbell,
    title: "EvoFit es tu herramienta",
    text: "Te organiza los entrenos, la dieta y el progreso.",
  },
  {
    icon: Flame,
    title: "Tú pones el esfuerzo",
    text: "Ninguna app entrena por ti — cada repetición es tuya.",
  },
  {
    icon: TrendingUp,
    title: "No es imposible",
    text: "Un día a la vez. Así se construyen las rachas.",
  },
];

// Se muestra una sola vez, la primera vez que el usuario entra a la app
// (profiles.has_seen_welcome pasa a true apenas se cierra). El mensaje deja
// claro que EvoFit es solo la herramienta — quien realmente mejora es el
// propio usuario — y lo trata de tú para que se sienta más personal.
export const WelcomeDialog = () => {
  const { data } = useAuthSession();
  const markSeen = useMarkWelcomeSeen();
  const [dismissed, setDismissed] = useState(false);

  const profile = data?.profile;
  const firstName = profile?.displayName?.trim().split(" ")[0] || "";
  const open = !!profile && !profile.hasSeenWelcome && !dismissed;

  const handleClose = () => {
    setDismissed(true);
    if (!markSeen.isPending && !markSeen.isSuccess) {
      markSeen.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className={styles.content}>
        <div className={styles.hero}>
          <div className={styles.heroGlowRed} aria-hidden="true" />
          <div className={styles.heroGlowViolet} aria-hidden="true" />
          <div className={styles.iconBadge}>
            <Flame size={26} />
          </div>
          <p className={styles.eyebrow}>Antes de empezar</p>
          <DialogTitle className={styles.title}>
            {firstName ? `${firstName}, esto depende de ti` : "Esto depende de ti"}
          </DialogTitle>
        </div>

        <div className={styles.body}>
          <DialogDescription className={styles.srOnly}>
            EvoFit es una herramienta de apoyo. Quien mejora su físico eres tú.
          </DialogDescription>

          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className={styles.highlightRow}>
              <div className={styles.highlightIcon}>
                <item.icon size={18} />
              </div>
              <div>
                <p className={styles.highlightTitle}>{item.title}</p>
                <p className={styles.highlightText}>{item.text}</p>
              </div>
            </div>
          ))}

          <Button type="button" className={styles.startButton} onClick={handleClose}>
            Vamos a entrenar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
