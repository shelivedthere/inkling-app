/** Persisted Excalidraw scene stored inside a note sketch block. */
export interface SketchSceneData {
  type: "excalidraw";
  version: 2;
  elements: unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
  /** Lightweight SVG snapshot for inline preview outside the editor */
  previewSvg?: string;
}

export type SketchBlockData = SketchSceneData | string;

export function isSketchSceneData(data: unknown): data is SketchSceneData {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as SketchSceneData).type === "excalidraw" &&
    Array.isArray((data as SketchSceneData).elements)
  );
}

/** Old perfect-freehand sketches were stored as raw SVG markup strings. */
export function isLegacySketchData(data: unknown): data is string {
  return typeof data === "string" && data.trim().startsWith("<svg");
}

export function hasSketchContent(data: SketchBlockData | "" | null | undefined) {
  if (!data) return false;
  if (isLegacySketchData(data)) return true;
  if (isSketchSceneData(data)) return data.elements.length > 0 || Boolean(data.previewSvg);
  return false;
}

export function emptySketchScene(): SketchSceneData {
  return {
    type: "excalidraw",
    version: 2,
    elements: [],
    appState: {
      viewBackgroundColor: "#fffdf8",
    },
    files: {},
  };
}
