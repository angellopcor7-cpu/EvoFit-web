"use client";

import React from "react";
import styles from "./Switch.module.css";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export const Switch = ({ checked, onCheckedChange, disabled, id }: SwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`${styles.track} ${checked ? styles.trackOn : ""}`}
    >
      <span className={`${styles.thumb} ${checked ? styles.thumbOn : ""}`} />
    </button>
  );
};
