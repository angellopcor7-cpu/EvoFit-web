// Genera una tarjeta de progreso (racha) como imagen PNG usando Canvas
// nativo del navegador — sin librerías extra. Pensada para compartir en
// redes (formato cuadrado 1080x1080, estilo de marca EvoFit).

export type ShareCardData = {
  displayName: string;
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function createBrandedCanvas(
  subtitle: string,
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; size: number } | null> {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Fondo: degradado casi negro con glow rojo/violeta, igual que la app.
  const bg = ctx.createRadialGradient(
    size * 0.5,
    size * 0.1,
    0,
    size * 0.5,
    size * 0.5,
    size * 0.9,
  );
  bg.addColorStop(0, "#1c1620");
  bg.addColorStop(1, "#0a0a0d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Glow rojo arriba a la derecha.
  const glow1 = ctx.createRadialGradient(
    size * 0.85,
    size * 0.1,
    0,
    size * 0.85,
    size * 0.1,
    size * 0.45,
  );
  glow1.addColorStop(0, "rgba(228, 39, 46, 0.35)");
  glow1.addColorStop(1, "rgba(228, 39, 46, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, size, size);

  // Glow violeta abajo a la izquierda.
  const glow2 = ctx.createRadialGradient(
    size * 0.1,
    size * 0.9,
    0,
    size * 0.1,
    size * 0.9,
    size * 0.4,
  );
  glow2.addColorStop(0, "rgba(124, 92, 255, 0.3)");
  glow2.addColorStop(1, "rgba(124, 92, 255, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, size, size);

  // Logo (si carga; si falla, seguimos sin él).
  try {
    const logo = await loadImage("/icon-192.png");
    const logoSize = 84;
    ctx.drawImage(logo, size / 2 - logoSize / 2, 70, logoSize, logoSize);
  } catch {
    // sin logo, no pasa nada
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#f5f4f7";
  ctx.font = "700 40px system-ui, sans-serif";
  ctx.fillText("EVOFIT", size / 2, 210);

  ctx.fillStyle = "rgba(245,244,247,0.65)";
  ctx.font = "500 32px system-ui, sans-serif";
  ctx.fillText(subtitle, size / 2, 260);

  return { canvas, ctx, size };
}

function drawStatCardPair(
  ctx: CanvasRenderingContext2D,
  size: number,
  cardY: number,
  a: { value: string; label: string },
  b: { value: string; label: string },
) {
  const cardW = 420;
  const cardH = 140;
  const gap = 40;
  const totalW = cardW * 2 + gap;
  const startX = size / 2 - totalW / 2;

  const drawStatCard = (x: number, value: string, label: string) => {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, x, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    roundRect(ctx, x, cardY, cardW, cardH, 24);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 56px system-ui, sans-serif";
    ctx.fillText(value, x + cardW / 2, cardY + 65);

    ctx.fillStyle = "rgba(245,244,247,0.6)";
    ctx.font = "500 26px system-ui, sans-serif";
    ctx.fillText(label, x + cardW / 2, cardY + 105);
  };

  drawStatCard(startX, a.value, a.label);
  drawStatCard(startX + cardW + gap, b.value, b.label);
}

function drawFooter(ctx: CanvasRenderingContext2D, size: number) {
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(245,244,247,0.45)";
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText("Entrena. Progresa. No falles.", size / 2, size - 60);
}

export async function generateStreakShareCard(
  data: ShareCardData,
): Promise<Blob | null> {
  const setup = await createBrandedCanvas(
    `${data.displayName || "Mi"} racha de entrenamiento`,
  );
  if (!setup) return null;
  const { canvas, ctx, size } = setup;

  // Círculo grande con el número de racha.
  const circleY = 520;
  const circleR = 220;
  const circleGrad = ctx.createLinearGradient(
    size / 2 - circleR,
    circleY - circleR,
    size / 2 + circleR,
    circleY + circleR,
  );
  circleGrad.addColorStop(0, "#e4272e");
  circleGrad.addColorStop(1, "#7c5cff");
  ctx.beginPath();
  ctx.arc(size / 2, circleY, circleR, 0, Math.PI * 2);
  ctx.fillStyle = circleGrad;
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 200px system-ui, sans-serif";
  ctx.fillText(String(data.currentStreak), size / 2, circleY + 70);

  ctx.font = "600 40px system-ui, sans-serif";
  ctx.fillText(
    data.currentStreak === 1 ? "día de racha" : "días de racha",
    size / 2,
    circleY + circleR + 60,
  );

  drawStatCardPair(
    ctx,
    size,
    850,
    { value: String(data.longestStreak), label: "Mejor racha" },
    { value: String(data.totalWorkouts), label: "Entrenamientos" },
  );

  drawFooter(ctx, size);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

export type WeeklyShareCardData = {
  displayName: string;
  days: { label: string; count: number; isToday: boolean }[];
  totalThisWeek: number;
};

export async function generateWeeklyShareCard(
  data: WeeklyShareCardData,
): Promise<Blob | null> {
  const setup = await createBrandedCanvas(
    `${data.displayName || "Mi"} semana de entrenamiento`,
  );
  if (!setup) return null;
  const { canvas, ctx, size } = setup;

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 140px system-ui, sans-serif";
  ctx.fillText(String(data.totalThisWeek), size / 2, 430);
  ctx.font = "600 34px system-ui, sans-serif";
  ctx.fillStyle = "rgba(245,244,247,0.7)";
  ctx.fillText(
    data.totalThisWeek === 1 ? "entrenamiento esta semana" : "entrenamientos esta semana",
    size / 2,
    475,
  );

  // Barras de la semana.
  const maxCount = Math.max(1, ...data.days.map((d) => d.count));
  const barAreaW = 780;
  const barGap = 24;
  const barW = (barAreaW - barGap * (data.days.length - 1)) / data.days.length;
  const barMaxH = 260;
  const barBaseY = 850;
  const startX = size / 2 - barAreaW / 2;

  data.days.forEach((day, i) => {
    const x = startX + i * (barW + barGap);
    const h = day.count === 0 ? 8 : Math.max(24, (day.count / maxCount) * barMaxH);
    const y = barBaseY - h;

    if (day.isToday) {
      const grad = ctx.createLinearGradient(x, y, x, barBaseY);
      grad.addColorStop(0, "#e4272e");
      grad.addColorStop(1, "#7c5cff");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = day.count > 0 ? "rgba(228,39,46,0.55)" : "rgba(255,255,255,0.1)";
    }
    roundRect(ctx, x, y, barW, h, 14);
    ctx.fill();

    ctx.fillStyle = day.isToday ? "#ffffff" : "rgba(245,244,247,0.55)";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText(day.label, x + barW / 2, barBaseY + 44);
  });

  drawFooter(ctx, size);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

export type GoalShareCardData = {
  displayName: string;
  title: string;
  targetValue: number;
  unit: string;
  completedDateLabel: string;
  timeToCompleteLabel: string;
};

export async function generateGoalShareCard(
  data: GoalShareCardData,
): Promise<Blob | null> {
  const setup = await createBrandedCanvas(`${data.displayName || "Mi"} meta cumplida`);
  if (!setup) return null;
  const { canvas, ctx, size } = setup;

  // Medalla / círculo con check.
  const circleY = 430;
  const circleR = 150;
  const circleGrad = ctx.createLinearGradient(
    size / 2 - circleR,
    circleY - circleR,
    size / 2 + circleR,
    circleY + circleR,
  );
  circleGrad.addColorStop(0, "#facc15");
  circleGrad.addColorStop(1, "#e4272e");
  ctx.beginPath();
  ctx.arc(size / 2, circleY, circleR, 0, Math.PI * 2);
  ctx.fillStyle = circleGrad;
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(size / 2 - 60, circleY + 5);
  ctx.lineTo(size / 2 - 15, circleY + 55);
  ctx.lineTo(size / 2 + 70, circleY - 55);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 56px system-ui, sans-serif";
  wrapText(ctx, data.title, size / 2, 680, 900, 64);

  ctx.fillStyle = "rgba(245,244,247,0.7)";
  ctx.font = "500 34px system-ui, sans-serif";
  ctx.fillText(
    `Objetivo: ${data.targetValue}${data.unit ? ` ${data.unit}` : ""}`,
    size / 2,
    800,
  );

  drawStatCardPair(
    ctx,
    size,
    870,
    { value: data.timeToCompleteLabel, label: "Tiempo en lograrla" },
    { value: data.completedDateLabel, label: "Fecha" },
  );

  drawFooter(ctx, size);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

export async function shareOrDownloadCard(
  blob: Blob,
  filename: string,
  shareText = "Mira mi progreso en EvoFit 🔥",
) {
  const file = new File([blob], filename, { type: "image/png" });

  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "Mi progreso en EvoFit",
        text: shareText,
      });
      return "shared" as const;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return "cancelled" as const;
      }
      // si falla el share, caemos a descarga
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "downloaded" as const;
}
