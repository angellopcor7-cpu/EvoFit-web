"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, LineChart, Target, User } from "lucide-react";
import styles from "./BottomNav.module.css";

const items = [
  { to: "/home", label: "Inicio", icon: Home },
  { to: "/entrenamientos", label: "Entreno", icon: Dumbbell },
  { to: "/progreso", label: "Progreso", icon: LineChart },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/perfil", label: "Perfil", icon: User },
];

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {items.map(({ to, label, icon: Icon }) => {
        const isActive = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            href={to}
            className={`${styles.navItem} ${isActive ? styles.active : ""}`}
          >
            <Icon size={20} />
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
