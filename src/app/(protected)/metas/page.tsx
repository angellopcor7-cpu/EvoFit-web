"use client";

import { Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import styles from "./page.module.css";

const sampleGoals = [
  {
    id: "5k",
    title: "Correr 5K sin parar",
    progress: 60,
    deadline: "Faltan 12 días",
  },
  {
    id: "squat",
    title: "Levantar 80kg en sentadilla",
    progress: 35,
    deadline: "Faltan 25 días",
  },
  {
    id: "consistency",
    title: "Entrenar 4 veces por semana",
    progress: 80,
    deadline: "Esta semana",
  },
];

const comingSoon = () => toast.info("Crear metas propias — muy pronto.");

export default function MetasPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tus metas</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={comingSoon}
          className={styles.newButton}
        >
          <Plus size={16} /> Nueva
        </Button>
      </div>

      <div className={styles.list}>
        {sampleGoals.map((goal) => (
          <div key={goal.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Target size={18} />
              </div>
              <div className={styles.cardHeaderText}>
                <p className={styles.cardTitle}>{goal.title}</p>
                <p className={styles.cardDeadline}>{goal.deadline}</p>
              </div>
              <span className={styles.cardPercent}>{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className={styles.progressBar} />
          </div>
        ))}
      </div>
    </div>
  );
}
