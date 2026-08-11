"use client";

import { useSyncExternalStore } from "react";

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function subscribe() {
  return () => {};
}

function getClientGreeting() {
  return greetingForHour(new Date().getHours());
}

function getServerGreeting() {
  return "Hello";
}

/** Time-of-day greeting using the visitor’s local clock (avoids UTC SSR mismatch). */
export function DashboardGreeting() {
  const greeting = useSyncExternalStore(
    subscribe,
    getClientGreeting,
    getServerGreeting
  );

  return (
    <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)] sm:text-5xl">
      {greeting}
    </h1>
  );
}
