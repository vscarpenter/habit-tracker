import type { HabitStatsResult, OverallStatsResult } from "./stats-core";
import type { Habit } from "@/types";

// ── Types ──────────────────────────────────────────────

export interface HeatmapDay {
  date: string;
  count: number;
}

interface CardColors {
  bg: string;
  text: string;
  textMuted: string;
  accent: string;
  heatmapBase: string;
}

// ── Constants ──────────────────────────────────────────

const CARD_WIDTH = 800;
const CARD_HEIGHT = 400;
const DPR = 2;

const COLORS: CardColors = {
  bg: "#0f172a",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  accent: "#3b82f6",
  heatmapBase: "59, 130, 246",
};

// ── Canvas Setup ───────────────────────────────────────

export function createCardCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH * DPR;
  canvas.height = CARD_HEIGHT * DPR;
  canvas.style.width = `${CARD_WIDTH}px`;
  canvas.style.height = `${CARD_HEIGHT}px`;
  return canvas;
}

function setupCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d")!;
  ctx.scale(DPR, DPR);
  return ctx;
}

function drawBackground(ctx: CanvasRenderingContext2D, accentColor: string) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Accent stripe
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, CARD_WIDTH, 4);
}

function drawWatermark(ctx: CanvasRenderingContext2D) {
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = "right";
  ctx.fillText("HabitFlow", CARD_WIDTH - 24, CARD_HEIGHT - 16);
  ctx.textAlign = "left";
}

// ── Heatmap Drawing ────────────────────────────────────

const HEATMAP_SQUARE_SIZE = 10;
const HEATMAP_GAP = 4;

function getHeatmapColor(count: number, maxCount: number): string {
  if (count === 0) return `rgba(${COLORS.heatmapBase}, 0.08)`;
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  const opacity = 0.2 + intensity * 0.8;
  return `rgba(${COLORS.heatmapBase}, ${opacity})`;
}

function drawMiniHeatmap(
  ctx: CanvasRenderingContext2D,
  data: HeatmapDay[],
  x: number,
  y: number,
  cols: number,
  rows: number
) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const step = HEATMAP_SQUARE_SIZE + HEATMAP_GAP;

  for (let i = 0; i < data.length && i < cols * rows; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const sx = x + col * step;
    const sy = y + row * step;

    ctx.beginPath();
    ctx.roundRect(sx, sy, HEATMAP_SQUARE_SIZE, HEATMAP_SQUARE_SIZE, 2);
    ctx.fillStyle = getHeatmapColor(data[i].count, maxCount);
    ctx.fill();
  }
}

// ── Habit Card Renderer ────────────────────────────────

export function renderHabitCard(
  canvas: HTMLCanvasElement,
  habit: Habit,
  stats: HabitStatsResult,
  heatmapData: HeatmapDay[]
): void {
  const ctx = setupCtx(canvas);
  drawBackground(ctx, habit.color);

  const padX = 32;
  let cursorY = 40;

  // Icon + Name
  ctx.font = "24px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`${habit.icon}  ${habit.name}`, padX, cursorY);

  // Streak badge (right side)
  ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = "#f59e0b";
  ctx.fillText(`${stats.currentStreak} days`, CARD_WIDTH - padX, cursorY);
  ctx.textAlign = "left";

  cursorY += 32;

  // Streak label
  ctx.font = "13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText("current streak", CARD_WIDTH - padX, cursorY);
  ctx.textAlign = "left";

  cursorY += 20;

  // Completion rate
  ctx.font = "16px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText(`Completion rate: ${stats.completionRate}%`, padX, cursorY);

  cursorY += 16;

  // Best streak
  ctx.fillText(`Best streak: ${stats.bestStreak} days`, padX, cursorY + 20);

  cursorY += 52;

  // Progress bar
  const barWidth = CARD_WIDTH - padX * 2;
  const barHeight = 8;
  ctx.beginPath();
  ctx.roundRect(padX, cursorY, barWidth, barHeight, 4);
  ctx.fillStyle = `rgba(${COLORS.heatmapBase}, 0.15)`;
  ctx.fill();

  const fillWidth = (stats.completionRate / 100) * barWidth;
  if (fillWidth > 0) {
    ctx.beginPath();
    ctx.roundRect(padX, cursorY, fillWidth, barHeight, 4);
    ctx.fillStyle = habit.color;
    ctx.fill();
  }

  cursorY += 32;

  // Mini heatmap (last 30 days, 2 rows of 15)
  const last30 = heatmapData.slice(-30);
  drawMiniHeatmap(ctx, last30, padX, cursorY, 15, 2);

  // Heatmap label
  ctx.font = "11px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText("Last 30 days", padX, cursorY + 38);

  drawWatermark(ctx);
}

// ── Overall Stats Card Renderer ────────────────────────

export function renderOverallCard(
  canvas: HTMLCanvasElement,
  stats: OverallStatsResult,
  heatmapData: HeatmapDay[]
): void {
  const ctx = setupCtx(canvas);
  drawBackground(ctx, COLORS.accent);

  const padX = 32;
  let cursorY = 40;

  // Title
  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = COLORS.text;
  ctx.fillText("My HabitFlow Stats", padX, cursorY);

  // Date (right)
  ctx.font = "13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), CARD_WIDTH - padX, cursorY);
  ctx.textAlign = "left";

  cursorY += 44;

  // Stats row
  const statItems = [
    { label: "Active Habits", value: String(stats.totalActiveHabits) },
    { label: "Completion Rate", value: `${stats.overallCompletionRate}%` },
    { label: "Best Streak", value: `${stats.bestCurrentStreak} days` },
  ];

  const colWidth = (CARD_WIDTH - padX * 2) / statItems.length;
  for (let i = 0; i < statItems.length; i++) {
    const x = padX + i * colWidth;
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = COLORS.text;
    ctx.fillText(statItems[i].value, x, cursorY);

    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(statItems[i].label, x, cursorY + 20);
  }

  cursorY += 56;

  // Year heatmap (52 weeks x 7 days, smaller squares)
  const maxCount = Math.max(...heatmapData.map((d) => d.count), 1);
  const sqSize = 7;
  const gap = 2;
  const step = sqSize + gap;
  const weeksToShow = Math.min(52, Math.ceil(heatmapData.length / 7));
  const heatmapWidth = weeksToShow * step;
  const startX = padX + Math.max(0, (CARD_WIDTH - padX * 2 - heatmapWidth) / 2);

  for (let i = 0; i < heatmapData.length && i < 52 * 7; i++) {
    const week = Math.floor(i / 7);
    const day = i % 7;
    const sx = startX + week * step;
    const sy = cursorY + day * step;

    ctx.beginPath();
    ctx.roundRect(sx, sy, sqSize, sqSize, 1.5);
    ctx.fillStyle = getHeatmapColor(heatmapData[i].count, maxCount);
    ctx.fill();
  }

  drawWatermark(ctx);
}
