"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import styles from "./RoutinePickerDialog.module.css";

export type RoutinePickerItem = {
  id: string;
  title: string;
  subtitle?: string;
  filterValue?: string;
};

export type RoutinePickerCategory = {
  value: string;
  label: string;
};

// Quita acentos y pasa a minúsculas para que la búsqueda encuentre
// "musculacion" al escribir "musculación" (o sin tilde) sin distinguir caso.
const DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .toLowerCase();
}

export function RoutinePickerDialog({
  open,
  onOpenChange,
  title,
  items,
  selectedId,
  onSelect,
  categories,
  activeCategory,
  onCategoryChange,
  emptyLabel = "No encontramos rutinas con ese nombre.",
  searchPlaceholder = "Buscar rutina...",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: RoutinePickerItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  categories?: RoutinePickerCategory[];
  activeCategory?: string;
  onCategoryChange?: (value: string) => void;
  emptyLabel?: string;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    // El estado del buscador vive en este componente (que no se desmonta
    // entre aperturas porque `open` lo controla el padre), así que hay que
    // limpiarlo explícitamente cada vez que se vuelve a abrir el diálogo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return items;
    return items.filter((item) => {
      const haystack = normalize(`${item.title} ${item.subtitle ?? ""} ${item.filterValue ?? ""}`);
      return haystack.includes(q);
    });
  }, [items, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className={styles.searchRow}>
          <Search size={16} className={styles.searchIcon} />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={styles.searchInput}
            autoFocus
          />
        </div>

        {categories && categories.length > 0 && (
          <div className={styles.categoryRow}>
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`${styles.categoryChip} ${
                  activeCategory === cat.value ? styles.categoryChipActive : ""
                }`}
                onClick={() => onCategoryChange?.(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        <div className={styles.results}>
          {filtered.length === 0 ? (
            <p className={styles.emptyLabel}>{emptyLabel}</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.resultRow}
                onClick={() => {
                  onSelect(item.id);
                  onOpenChange(false);
                }}
              >
                <span className={styles.resultInfo}>
                  <span className={styles.resultTitle}>{item.title}</span>
                  {item.subtitle && (
                    <span className={styles.resultSubtitle}>{item.subtitle}</span>
                  )}
                </span>
                {selectedId === item.id && (
                  <Check size={16} className={styles.resultCheck} />
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
