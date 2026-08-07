"use client";

import { useRef, useState, type PointerEvent } from "react";
import { pointsToPath, type Point } from "@/lib/utils/stroke";

interface SketchCanvasProps {
  initialSvg?: string;
  onSave: (svg: string) => void;
  onCancel: () => void;
}

export function SketchCanvas({
  initialSvg,
  onSave,
  onCancel,
}: SketchCanvasProps) {
  const [paths, setPaths] = useState<string[]>(() =>
    initialSvg ? extractPaths(initialSvg) : []
  );
  const [current, setCurrent] = useState<Point[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const drawing = useRef(false);
  const currentRef = useRef<Point[]>([]);

  function pointerPos(event: PointerEvent<SVGSVGElement>): Point | null {
    const svg = svgRef.current;
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    // Map screen coords into the SVG viewBox (0 0 360 240)
    const x = ((event.clientX - rect.left) / rect.width) * 360;
    const y = ((event.clientY - rect.top) / rect.height) * 240;

    return [x, y, event.pressure || 0.5];
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    const point = pointerPos(event);
    if (!point) return;

    svgRef.current?.setPointerCapture(event.pointerId);
    drawing.current = true;
    currentRef.current = [point];
    setCurrent([point]);
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!drawing.current) return;

    // Read geometry synchronously — do not touch the event inside setState.
    const point = pointerPos(event);
    if (!point) return;

    const next = [...currentRef.current, point];
    currentRef.current = next;
    setCurrent(next);
  }

  function handlePointerUp() {
    if (!drawing.current) return;
    drawing.current = false;

    const stroke = currentRef.current;
    if (stroke.length > 1) {
      setPaths((prev) => [...prev, pointsToPath(stroke)]);
    }
    currentRef.current = [];
    setCurrent([]);
  }

  function handleSave() {
    const stroke = currentRef.current;
    const allPaths =
      stroke.length > 1 ? [...paths, pointsToPath(stroke)] : paths;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" width="100%" height="100%">${allPaths
      .map((d) => `<path d="${d}" fill="currentColor"/>`)
      .join("")}</svg>`;
    onSave(svg);
  }

  const livePath = current.length > 1 ? pointsToPath(current) : "";

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[var(--ink)]/15 bg-white shadow-[4px_4px_0_rgba(26,26,26,0.06)]">
      <svg
        ref={svgRef}
        viewBox="0 0 360 240"
        className="h-56 w-full touch-none cursor-crosshair text-[var(--ink)] sm:h-64"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <rect width="360" height="240" fill="#fffdf8" />
        {paths.map((d, i) => (
          <path key={i} d={d} fill="currentColor" />
        ))}
        {livePath ? <path d={livePath} fill="currentColor" /> : null}
      </svg>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--ink)]/8 px-3 py-2">
        <button
          type="button"
          onClick={() => {
            setPaths([]);
            currentRef.current = [];
            setCurrent([]);
          }}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ink)]/60 hover:bg-[var(--ink)]/5"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => setPaths((prev) => prev.slice(0, -1))}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ink)]/60 hover:bg-[var(--ink)]/5"
        >
          Undo
        </button>
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
          className="rounded-lg bg-[var(--coral)] px-3 py-1.5 text-sm font-semibold text-white"
        >
          Save sketch
        </button>
      </div>
    </div>
  );
}

function extractPaths(svg: string) {
  const matches = [...svg.matchAll(/d="([^"]+)"/g)];
  return matches.map((match) => match[1]);
}
