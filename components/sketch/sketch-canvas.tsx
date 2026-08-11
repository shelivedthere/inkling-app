"use client";

import dynamic from "next/dynamic";
import type { SketchSceneData } from "@/lib/types/sketch";

const ExcalidrawEditor = dynamic(
  () =>
    import("@/components/sketch/excalidraw-editor").then(
      (mod) => mod.ExcalidrawEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(60vh,420px)] min-h-[240px] items-center justify-center rounded-2xl border-2 border-dashed border-[var(--ink)]/15 bg-white/60 text-sm font-semibold text-[var(--ink)]/45">
        Loading sketch pad…
      </div>
    ),
  }
);

interface SketchCanvasProps {
  initialData?: SketchSceneData | null;
  onSave: (scene: SketchSceneData) => void;
  onCancel: () => void;
}

export function SketchCanvas({
  initialData,
  onSave,
  onCancel,
}: SketchCanvasProps) {
  return (
    <ExcalidrawEditor
      initialData={initialData}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}
