import Image from "next/image";
import Link from "next/link";

interface BrandMarkProps {
  href?: string | null;
  size?: "nav" | "hero";
  className?: string;
}

export function BrandMark({
  href = "/",
  size = "nav",
  className = "",
}: BrandMarkProps) {
  const isHero = size === "hero";
  // Intrinsic pixel size for Next/Image; display size set via style so both
  // width and height are always specified together (avoids aspect-ratio warning).
  const intrinsicWidth = isHero ? 102 : 62;
  const intrinsicHeight = isHero ? 72 : 44;

  const content = (
    <span
      className={
        isHero
          ? `inline-flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4 ${className}`
          : `inline-flex items-center gap-2.5 ${className}`
      }
    >
      <Image
        src="/inkling-logo.png"
        alt=""
        width={intrinsicWidth}
        height={intrinsicHeight}
        className="select-none"
        style={{ width: "auto", height: intrinsicHeight }}
        priority
      />
      <span
        className={
          isHero
            ? "font-[family-name:var(--font-display)] text-5xl tracking-tight text-[var(--ink)] sm:text-6xl"
            : "font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)] transition group-hover:text-[var(--coral)]"
        }
      >
        Inkling
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="group inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--coral)]"
    >
      {content}
    </Link>
  );
}
