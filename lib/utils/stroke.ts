import getStroke from "perfect-freehand";

export type Point = [number, number, number];

export function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"] as Array<string | number>
  );

  d.push("Z");
  return d.join(" ");
}

export function pointsToPath(points: Point[]) {
  const stroke = getStroke(points, {
    size: 6,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  });
  return getSvgPathFromStroke(stroke);
}
