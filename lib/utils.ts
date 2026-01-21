import { v5 as uuidv5 } from "uuid";
import { type AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { Locale } from "next-intl";

export const getDir = (locale: Locale) => {
  return locale === "ar" ? "rtl" : "ltr";
};

export const isPromise = (obj: unknown): obj is Promise<unknown> =>
  !!obj &&
  typeof (obj as Record<string, unknown>).then === "function" &&
  typeof (obj as Record<string, unknown>).catch === "function";

export const formatCurrency = (amountInCents: number): string => {
  const absAmount = Math.abs(amountInCents) / 100;
  const parts = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  if (amountInCents < 0) {
    return `$ (${parts})`;
  }
  return `$ ${parts}`;
};

export const formatPercent = (value: number): string => {
  return `${value >= 0 ? "" : ""}${(value * 100).toFixed(2)}%`;
};

export const getProjectStatus = (
  project: Pick<
    inferRouterOutputs<AppRouter>["projects"]["list"]["items"][number],
    "startDate" | "endDate" | "price" | "paid"
  >
) => {
  if (!project.startDate) return "planning";
  if (!project.endDate) return "inProgress";
  if (project.paid !== project.price) return "awaitingPayment";
  return "completed";
};

export const getCurrentTime = () => new Date();

export function toUuid(input: number | string): string {
  const NUMBER_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";
  const name = input.toString();
  return uuidv5(name, NUMBER_NAMESPACE);
}

/**
 * Converts an array of strings into an array of distinguishable blue shades.
 * Colors are evenly distributed across a blue color spectrum to ensure maximum visual distinction.
 *
 * @param strings - Array of strings to convert to colors
 * @returns Array of hex color strings in blue shades
 */
export function stringsToNeutralColors(strings: string[]) {
  if (strings.length === 0) return [];

  // Blue shades palette - various shades from light to dark blue
  // Based on Tailwind CSS blue scale and custom blue variations
  const BLUE_PALETTE = [
    "#93C5FD", // Blue 300 - Light blue
    "#60A5FA", // Blue 400 - Medium-light blue
    "#3B82F6", // Blue 500 - Medium blue
    "#2563EB", // Blue 600 - Medium-dark blue
    "#1D4ED8", // Blue 700 - Dark blue
    "#1E40AF", // Blue 800 - Darker blue
    "#1E3A8A", // Blue 900 - Very dark blue
    "#60A5FA", // Additional medium-light blue variant
    "#3B82F6", // Additional medium blue variant
    "#2563EB", // Additional medium-dark blue variant
    "#1D4ED8", // Additional dark blue variant
    "#1E40AF", // Additional darker blue variant
  ];

  const count = strings.length;
  const paletteSize = BLUE_PALETTE.length;

  if (count <= paletteSize) {
    // Distribute evenly across the palette
    const step = paletteSize / count;
    return strings.map((_, index) => {
      const paletteIndex = Math.floor(index * step);
      return BLUE_PALETTE[Math.min(paletteIndex, paletteSize - 1)];
    });
  }

  // For more strings than palette colors, generate intermediate shades
  // by interpolating between palette colors
  const colors: string[] = [];
  const range = paletteSize - 1;
  const step = range / (count - 1);

  function interpolateHexColor(color1: string, color2: string, factor: number) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);

    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  }

  for (let i = 0; i < count; i++) {
    const position = i * step;
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.min(lowerIndex + 1, range);
    const fraction = position - lowerIndex;

    const lowerColor = BLUE_PALETTE[lowerIndex];
    const upperColor = BLUE_PALETTE[upperIndex];

    // Interpolate between two colors
    const color = interpolateHexColor(lowerColor, upperColor, fraction);
    colors.push(color);
  }

  return colors;
}
