"use client";

import { useCallback, useRef, useState } from "react";
import {
  Excalidraw,
  exportToSvg,
  getNonDeletedElements,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import "@excalidraw/excalidraw/index.css";
import {
  emptySketchScene,
  isSketchSceneData,
  type SketchSceneData,
} from "@/lib/types/sketch";

interface ExcalidrawEditorProps {
  initialData?: SketchSceneData | null;
  onSave: (scene: SketchSceneData) => void;
  onCancel: () => void;
}

export function ExcalidrawEditor({
  initialData,
  onSave,
  onCancel,
}: ExcalidrawEditorProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const scene = isSketchSceneData(initialData)
    ? initialData
    : emptySketchScene();

  const handleApi = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api;
  }, []);

  async function handleSave() {
    const api = apiRef.current;
    if (!api) return;

    setIsSaving(true);
    try {
      const elements = api.getSceneElementsIncludingDeleted();
      const appState = api.getAppState();
      const files = api.getFiles();
      const sceneData = await buildSceneData(elements, appState, files);
      onSave(sceneData);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[var(--ink)]/15 bg-white shadow-[4px_4px_0_rgba(26,26,26,0.06)]">
      <div className="h-[min(60vh,420px)] w-full min-h-[280px]">
        <Excalidraw
          excalidrawAPI={handleApi}
          initialData={{
            elements: scene.elements as OrderedExcalidrawElement[],
            appState: {
              viewBackgroundColor: "#fffdf8",
              ...scene.appState,
              collaborators: new Map(),
            },
            files: scene.files as BinaryFiles,
            scrollToContent: true,
          }}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              export: false,
              saveToActiveFile: false,
              toggleTheme: false,
            },
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--ink)]/8 px-3 py-2">
        <div className="flex-1" />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ink)]/60 hover:bg-[var(--ink)]/5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-[var(--coral)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save sketch"}
        </button>
      </div>
    </div>
  );
}

async function buildSceneData(
  elements: readonly OrderedExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles
): Promise<SketchSceneData> {
  const serialized = JSON.parse(
    serializeAsJSON(elements, appState, files, "database")
  ) as {
    elements?: unknown[];
    appState?: Record<string, unknown>;
    files?: Record<string, unknown>;
  };

  let previewSvg: string | undefined;
  try {
    const nonDeleted = getNonDeletedElements(elements);
    if (nonDeleted.length > 0) {
      const svg = await exportToSvg({
        elements: nonDeleted,
        appState: {
          ...appState,
          exportBackground: true,
          viewBackgroundColor:
            appState.viewBackgroundColor || "#fffdf8",
        },
        files,
        exportPadding: 12,
      });
      previewSvg = svg.outerHTML;
    }
  } catch {
    // Preview is optional — scene data still saves.
  }

  return {
    type: "excalidraw",
    version: 2,
    elements: serialized.elements ?? [],
    appState: {
      viewBackgroundColor: "#fffdf8",
      ...(serialized.appState ?? {}),
    },
    files: serialized.files ?? {},
    previewSvg,
  };
}
