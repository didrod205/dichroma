/**
 * Color-vision-deficiency simulation matrices.
 *
 * The protan/deutan/tritan transforms use the Machado, Oliveira & Fernandes
 * (2009) severity-1.0 matrices, applied in linear RGB. Milder ("-anomaly")
 * variants are approximated by interpolating between the identity matrix
 * (severity 0) and the full matrix (severity 1).
 */

export type Family = "protan" | "deutan" | "tritan" | "achroma";

export type CVDType =
  | "protanopia"
  | "protanomaly"
  | "deuteranopia"
  | "deuteranomaly"
  | "tritanopia"
  | "tritanomaly"
  | "achromatopsia"
  | "achromatomaly";

export interface CVDInfo {
  type: CVDType;
  label: string;
  family: Family;
  /** Default severity (1 = dichromacy/total, ~0.6 = anomalous). */
  severity: number;
  /** Rough prevalence, for UI context. */
  prevalence: string;
  description: string;
}

/** Row-major 3×3 matrices (Machado 2009, severity 1.0), for linear RGB. */
export const MATRICES: Record<"protan" | "deutan" | "tritan", number[]> = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
};

export const CVD_TYPES: Record<CVDType, CVDInfo> = {
  protanopia: {
    type: "protanopia", label: "Protanopia", family: "protan", severity: 1,
    prevalence: "~1% of men", description: "No working red (L) cones — reds look dark.",
  },
  protanomaly: {
    type: "protanomaly", label: "Protanomaly", family: "protan", severity: 0.6,
    prevalence: "~1% of men", description: "Reduced red sensitivity.",
  },
  deuteranopia: {
    type: "deuteranopia", label: "Deuteranopia", family: "deutan", severity: 1,
    prevalence: "~1% of men", description: "No working green (M) cones.",
  },
  deuteranomaly: {
    type: "deuteranomaly", label: "Deuteranomaly", family: "deutan", severity: 0.6,
    prevalence: "~5% of men", description: "Reduced green sensitivity — the most common type.",
  },
  tritanopia: {
    type: "tritanopia", label: "Tritanopia", family: "tritan", severity: 1,
    prevalence: "rare", description: "No working blue (S) cones.",
  },
  tritanomaly: {
    type: "tritanomaly", label: "Tritanomaly", family: "tritan", severity: 0.6,
    prevalence: "rare", description: "Reduced blue sensitivity.",
  },
  achromatopsia: {
    type: "achromatopsia", label: "Achromatopsia", family: "achroma", severity: 1,
    prevalence: "very rare", description: "No color vision at all (total color blindness).",
  },
  achromatomaly: {
    type: "achromatomaly", label: "Achromatomaly", family: "achroma", severity: 0.6,
    prevalence: "very rare", description: "Severely reduced color vision.",
  },
};

const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];

/** Interpolate a family matrix toward identity by `severity` (0 = none, 1 = full). */
export function matrixFor(family: "protan" | "deutan" | "tritan", severity: number): number[] {
  const m = MATRICES[family];
  return IDENTITY.map((id, i) => id + ((m[i] as number) - id) * severity);
}
