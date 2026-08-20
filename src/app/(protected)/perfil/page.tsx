"use client";

import { LogOut, Flame, TrendingUp, Dumbbell, Settings } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuthSession } from "@/hooks/useProfile";
import { useLogout } from "@/hooks/useAuthActions";
import { useWorkoutStats } from "@/hooks/useWorkoutCompletions";
import styles from "./page.module.css";

const comingSoon = () => toast.info("Editar perfil — muy pronto.");

export default function PerfilPage() {
  const router = useRouter();
  const { data } = useAuthSession();
  const logout = useLogout();
  const { data: stats } = useWorkoutStats();
  const profile = data?.profile;
  const initial = profile?.displayName?.trim().charAt(0).toUpperCase() ?? "A";

  return (
    <div className={styles.page}>
      <div className={styles.identity}>
        <div className={styles.avatar}>{initial}</div>
        <h1 className={styles.name}>{profile?.displayName ?? "Atleta"}</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={comingSoon}
          className={styles.editButton}
        >
          <Settings size={14} /> Editar perfil
        </Button>
      </div>

      <div className={styles.statsCard}>
        <div className={styles.stat}>
          <Flame size={18} className={styles.statIconStreak} />
          <span className={styles.statValue}>
            {profile?.currentStreak ?? 0}
          </span>
          <span className={styles.statLabel}>Racha</span>
        </div>
        <div className={styles.stat}>
          <TrendingUp size={18} className={styles.statIconBest} />
          <span className={styles.statValue}>
            {profile?.longestStreak ?? 0}
          </span>
          <span className={styles.statLabel}>Mejor racha</span>
        </div>
        <div className={styles.stat}>
          <Dumbbell size={18} className={styles.statIconWorkouts} />
          <span className={styles.statValue}>{stats?.totalCount ?? 0}</span>
          <span className={styles.statLabel}>Entrenos</span>
        </div>
      </div>

      <Button
        type="button"
        variant="destructive"
        onClick={() =>
          logout.mutate(undefined, {
            onSuccess: () => router.replace("/"),
          })
        }
        disabled={logout.isPending}
        className={styles.logoutButton}
      >
        <LogOut size={16} />
        {logout.isPending ? "Cerrando sesión..." : "Cerrar sesión"}
      </Button>
    </div>
  );
}
