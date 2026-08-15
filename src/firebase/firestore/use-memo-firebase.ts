'use client';

import { useRef } from 'react';

/**
 * A specialized hook for stabilizing Firestore references and queries.
 * 
 * Unlike standard useMemo, this hook provides a stronger guarantee of 
 * reference stability, which is critical for preventing infinite loops 
 * in Firestore real-time listeners (useCollection/useDoc).
 *
 * @param factory A function that returns the Firestore reference or query.
 * @param deps Dependency array.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<T | null>(null);
  const depsRef = useRef<any[]>([]);

  const changed = 
    deps.length !== depsRef.current.length || 
    deps.some((dep, i) => dep !== depsRef.current[i]);

  if (changed || ref.current === null) {
    ref.current = factory();
    depsRef.current = deps;
  }

  return ref.current!;
}
