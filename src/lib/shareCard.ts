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

export async function generateStreakShareCard(
  data: ShareCardData,
): Promise<Blob | null> {
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
  ctx.fillText(`${data.displayName || "Mi"} racha de entrenamiento`, size / 2, 260);

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

  // Tarjetas de stats secundarias abajo.
  const cardY = 850;
  const cardW = 420;
  const cardH = 140;
  const gap = 40;
  const totalW = cardW * 2 + gap;
  const startX = size / 2 - totalW / 2;

  const drawStatCard = (
    x: number,
    value: string,
    label: string,
  ) => {
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

  drawStatCard(startX, String(data.longestStreak), "Mejor racha");
  drawStatCard(startX + cardW + gap, String(data.totalWorkouts), "Entrenamientos");

  ctx.fillStyle = "rgba(245,244,247,0.45)";
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText("Entrena. Progresa. No falles.", size / 2, size - 60);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

export async function shareOrDownloadCard(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "image/png" });

  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "Mi racha en EvoFit",
        text: "Mira mi racha de entrenamiento en EvoFit 🔥",
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
