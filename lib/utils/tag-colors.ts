export const TAG_COLOR_IDS = [
  "teal",
  "coral",
  "sun",
  "violet",
  "sky",
  "moss",
] as const;

export type TagColorId = (typeof TAG_COLOR_IDS)[number];

export const DEFAULT_TAG_COLOR: TagColorId = "teal";

export const TAG_COLOR_OPTIONS: Array<{
  id: TagColorId;
  label: string;
}> = [
  { id: "teal", label: "Teal" },
  { id: "coral", label: "Coral" },
  { id: "sun", label: "Sun" },
  { id: "violet", label: "Violet" },
  { id: "sky", label: "Sky" },
  { id: "moss", label: "Moss" },
];

const TAG_COLOR_STYLES: Record<
  TagColorId,
  { soft: string; solid: string; swatch: string }
> = {
  teal: {
    soft: "bg-[var(--teal)]/15 text-[var(--teal-dark)]",
    solid: "bg-[var(--teal)] text-white",
    swatch: "bg-[var(--teal)]",
  },
  coral: {
    soft: "bg-[var(--coral)]/15 text-[#b83a30]",
    solid: "bg-[var(--coral)] text-white",
    swatch: "bg-[var(--coral)]",
  },
  sun: {
    soft: "bg-[var(--sun)]/35 text-[#7a5a10]",
    solid: "bg-[var(--sun)] text-[var(--ink)]",
    swatch: "bg-[var(--sun)]",
  },
  violet: {
    soft: "bg-[#8b7cf7]/15 text-[#4f3db8]",
    solid: "bg-[#8b7cf7] text-white",
    swatch: "bg-[#8b7cf7]",
  },
  sky: {
    soft: "bg-[#5bb8e8]/18 text-[#1f6f96]",
    solid: "bg-[#5bb8e8] text-white",
    swatch: "bg-[#5bb8e8]",
  },
  moss: {
    soft: "bg-[#6aad5f]/18 text-[#2f6a2b]",
    solid: "bg-[#6aad5f] text-white",
    swatch: "bg-[#6aad5f]",
  },
};

export function resolveTagColor(color?: string | null): TagColorId {
  if (color && (TAG_COLOR_IDS as readonly string[]).includes(color)) {
    return color as TagColorId;
  }
  return DEFAULT_TAG_COLOR;
}

export function tagColorClasses(
  color: string | null | undefined,
  variant: "soft" | "solid" | "swatch" = "soft"
) {
  return TAG_COLOR_STYLES[resolveTagColor(color)][variant];
}
