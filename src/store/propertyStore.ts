import type { NewProperty, Property } from '../types';

const KEY = 'cadd:properties';

export function loadProperties(): Property[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Property[]) : [];
  } catch {
    return [];
  }
}

export function saveProperties(properties: Property[]): void {
  localStorage.setItem(KEY, JSON.stringify(properties));
}

export function addProperty(list: Property[], p: NewProperty): Property[] {
  const property: Property = { ...p, id: crypto.randomUUID(), createdAt: Date.now() };
  const next = [...list, property];
  saveProperties(next);
  return next;
}

export function removeProperty(list: Property[], id: string): Property[] {
  const next = list.filter((p) => p.id !== id);
  saveProperties(next);
  return next;
}
