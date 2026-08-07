"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CaptureUpdateAction,
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

interface OpenUiState {
  openPopup: AppState["openPopup"];
  openMenu: AppState["openMenu"];
}

export function ExcalidrawEditor({
  initialData,
  onSave,
  onCancel,
}: ExcalidrawEditorProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openUi, setOpenUi] = useState<OpenUiState>({
    openPopup: null,
    openMenu: null,
  });

  const scene = isSketchSceneData(initialData)
    ? initialData
    : emptySketchScene();

  const handleApi = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api;
  }, []);

  const dismissOpenUi = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    const { openPopup, openMenu } = api.getAppState();
    if (!openPopup && !openMenu) return;

    api.updateScene({
      appState: {
        openPopup: null,
        openMenu: null,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
    setOpenUi({ openPopup: null, openMenu: null });
  }, []);

  // Backup: dismiss when interacting inside the editor but outside picker chrome
  // (e.g. tapping the canvas). The fullscreen backdrop below handles taps outside
  // the whole sketch card — needed because Radix sets body pointer-events:none
  // while a modal popover is open, which swallows outside taps.
  useEffect(() => {
    function onPointerDownCapture(event: PointerEvent) {
      const api = apiRef.current;
      if (!api) return;

      const { openPopup, openMenu } = api.getAppState();
      if (!openPopup && !openMenu) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      // Backdrop has its own handler.
      if (target.closest("[data-inkling-picker-dismiss]")) return;

      // Keep interacting with picker / mobile properties chrome.
      if (isInsidePickerChrome(target)) return;

      // Only auto-dismiss for presses that land inside this editor shell
      // (canvas / empty editor chrome). Outside-card presses use the backdrop.
      if (!target.closest("[data-inkling-sketch-editor]")) return;

      dismissOpenUi();
    }

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
    };
  }, [dismissOpenUi]);

  async function handleSave() {
    const api = apiRef.current;
    if (!api) return;

    setIsSaving(true);
    try {
      dismissOpenUi();
      const elements = api.getSceneElementsIncludingDeleted();
      const appState = api.getAppState();
      const files = api.getFiles();
      const sceneData = await buildSceneData(elements, appState, files);
      onSave(sceneData);
    } finally {
      setIsSaving(false);
    }
  }

  const showDismissBackdrop = Boolean(openUi.openPopup || openUi.openMenu);

  return (
    <>
      {showDismissBackdrop
        ? createPortal(
            <div
              data-inkling-picker-dismiss=""
              aria-hidden
              className="fixed inset-0"
              style={{
                // Below Excalidraw popups (1001) and our elevated editor shell.
                zIndex: 999,
                // Explicit auto so taps register even while Radix sets
                // document.body { pointer-events: none }.
                pointerEvents: "auto",
                background: "transparent",
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                dismissOpenUi();
              }}
            />,
            document.body
          )
        : null}

      <div
        data-inkling-sketch-editor=""
        className="relative z-[1000] rounded-2xl border-2 border-[var(--ink)]/15 bg-white shadow-[4px_4px_0_rgba(26,26,26,0.06)]"
      >
        <div className="h-[min(60vh,420px)] w-full min-h-[280px] overflow-hidden rounded-t-[0.9rem]">
          <Excalidraw
            excalidrawAPI={handleApi}
            onChange={(_elements, appState) => {
              setOpenUi((prev) => {
                if (
                  prev.openPopup === appState.openPopup &&
                  prev.openMenu === appState.openMenu
                ) {
                  return prev;
                }
                return {
                  openPopup: appState.openPopup,
                  openMenu: appState.openMenu,
                };
              });
            }}
            initialData={{
              elements: scene.elements as OrderedExcalidrawElement[],
              appState: {
                viewBackgroundColor: "#fffdf8",
                ...scene.appState,
                collaborators: new Map(),
                openPopup: null,
                openMenu: null,
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
    </>
  );
}

function isInsidePickerChrome(target: Element) {
  return Boolean(
    target.closest("[data-radix-portal]") ||
      target.closest("[data-radix-popper-content-wrapper]") ||
      target.closest("[data-prevent-outside-click]") ||
      target.closest(".color-picker-container") ||
      target.closest(".color-picker-popover-container") ||
      target.closest(".popover") ||
      target.closest(".properties-content") ||
      // Mobile shape properties island (openMenu === "shape")
      target.closest(".App-mobile-menu") ||
      target.closest(".App-menu__left")
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
