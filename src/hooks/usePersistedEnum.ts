'use client';

import { useCallback, useEffect, useState } from 'react';
import { safeLocalStorage } from '@/lib/storage';

export interface UsePersistedEnumOptions<T extends string> {
  /** localStorage key. */
  key: string;
  /** Value used before hydration / when storage is empty or invalid. */
  defaultValue: T;
  /** All valid values (used for restore validation + cycle ordering). */
  validValues: readonly T[];
  /**
   * Called when the value changes after hydration. Defaults to writing
   * the value to localStorage. Override to skip persistence for the
   * default value (e.g., ThemeToggle's `system` clears storage).
   */
  persist?: (value: T, storage: typeof safeLocalStorage) => void;
}

export interface UsePersistedEnumResult<T extends string> {
  value: T;
  setValue: (next: T) => void;
  /** Advance to the next value in `validValues`, wrapping to the first. */
  cycle: () => void;
  /** True after the restore-from-storage effect has run. */
  hydrated: boolean;
}

/**
 * Persist a string-enum value to localStorage with restore + cycle.
 *
 * Pattern duplicated across ThemeToggle and ReadingPreferences before
 * extraction:
 *   1. On mount, read localStorage, validate, set state, mark hydrated.
 *   2. On change (after hydration), write back to localStorage.
 *   3. Cycle to the next valid value.
 *
 * The hook is SSR-safe: returns `defaultValue` until hydration completes.
 */
export function usePersistedEnum<T extends string>(
  options: UsePersistedEnumOptions<T>,
): UsePersistedEnumResult<T> {
  const { key, defaultValue, validValues, persist } = options;
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = safeLocalStorage.getItem(key) as T | null;
    if (stored && validValues.includes(stored)) {
      setValue(stored);
    }
    setHydrated(true);
    // We intentionally only run this once on mount. key/validValues
    // should be stable across renders for a given component instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persist on change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (persist) {
      persist(value, safeLocalStorage);
    } else {
      safeLocalStorage.setItem(key, value);
    }
  }, [value, key, hydrated, persist]);

  const cycle = useCallback(() => {
    setValue((prev) => {
      const idx = validValues.indexOf(prev);
      return validValues[(idx + 1) % validValues.length];
    });
  }, [validValues]);

  return { value, setValue, cycle, hydrated };
}
