"use client";

export function getStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setStore<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeStore(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
