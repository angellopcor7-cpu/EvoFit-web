"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { Button } from "./ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/Dialog";
import { useAuthSession, useMarkWelcomeSeen } from "@/hooks/useProfile";
import styles from "./WelcomeDialog.module.css";

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
        <DialogHeader>
          <div className={styles.icon}>
            <Flame size={22} />
          </div>
          <DialogTitle className={styles.title}>
            {firstName ? `Antes de empezar, ${firstName}` : "Antes de empezar"}
          </DialogTitle>
          <DialogDescription className={styles.description}>
            EvoFit es solo una herramienta — te va a ayudar a organizar tus
            entrenamientos, tu dieta y tu progreso. Pero quien realmente va a
            mejorar su físico eres tú{firstName ? `, ${firstName}` : ""}. Cada
            entrenamiento, cada comida y cada día de constancia dependen de
            ti, no de la app.
            <br />
            <br />
            No va a ser fácil, pero tampoco es imposible. Un día a la vez.
          </DialogDescription>
        </DialogHeader>
        <Button type="button" className={styles.startButton} onClick={handleClose}>
          Vamos a entrenar
        </Button>
      </DialogContent>
    </Dialog>
  );
};
