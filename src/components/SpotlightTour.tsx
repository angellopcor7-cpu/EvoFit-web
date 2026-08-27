"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./SpotlightTour.module.css";

export type TourStep = {
  ref: RefObject<HTMLElement | null>;
  title: string;
  description: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const PADDING = 8;

export function SpotlightTour({
  steps,
  onFinish,
  onNeverShowAgain,
}: {
  steps: TourStep[];
  onFinish: () => void;
  onNeverShowAgain: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const validSteps = steps.filter((s) => s.ref.current);
  const current = validSteps[stepIndex];
  const isLast = stepIndex === validSteps.length - 1;

  useLayoutEffect(() => {
    function measure() {
      if (!current?.ref.current) return;
      const r = current.ref.current.getBoundingClientRect();
      setRect({
        top: r.top - PADDING,
        left: r.left - PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [current]);

  useEffect(() => {
    // "overflow: hidden" en el body no basta en iOS Safari (el scroll con
    // el dedo se sigue colando). Fijamos el body en su posición actual y
    // además bloqueamos touch/wheel/teclado por si acaso, para que la
    // pantalla no se mueva mientras el tutorial está abierto.
    const scrollY = window.scrollY;
    const body = document.body;
    const original = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    const preventScroll = (event: Event) => {
      event.preventDefault();
    };
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      body.style.position = original.position;
      body.style.top = original.top;
      body.style.left = original.left;
      body.style.right = original.right;
      body.style.width = original.width;
      body.style.overflow = original.overflow;
      window.scrollTo(0, scrollY);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("wheel", preventScroll);
    };
  }, []);

  if (!current || !rect || validSteps.length === 0) return null;

  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const showBelow = spaceBelow > 180 || rect.top < 180;
  const tooltipTop = showBelow ? rect.top + rect.height + 12 : undefined;
  const tooltipBottom = !showBelow
    ? window.innerHeight - rect.top + 12
    : undefined;
  const tooltipLeft = Math.min(
    Math.max(rect.left, 16),
    window.innerWidth - 296,
  );

  return (
    <div className={styles.overlay}>
      <div
        className={styles.spotlight}
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />
      <div
        className={styles.tooltip}
        style={{
          top: tooltipTop,
          bottom: tooltipBottom,
          left: tooltipLeft,
        }}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onFinish}
          aria-label="Cerrar tutorial"
        >
          <X size={16} />
        </button>
        <p className={styles.step}>
          {stepIndex + 1} / {validSteps.length}
        </p>
        <h3 className={styles.title}>{current.title}</h3>
        <p className={styles.description}>{current.description}</p>

        {!isLast ? (
          <Button
            type="button"
            size="sm"
            className={styles.nextButton}
            onClick={() => setStepIndex((i) => i + 1)}
          >
            Siguiente <ChevronRight size={16} />
          </Button>
        ) : (
          <div className={styles.finalActions}>
            <Button
              type="button"
              size="lg"
              variant="destructive"
              className={styles.neverShowButton}
              onClick={onNeverShowAgain}
            >
              No volver a enseñar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={styles.acceptButton}
              onClick={onFinish}
            >
              Entendido
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
