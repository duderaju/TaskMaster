'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * Real-time Firestore Document listener hook.
 * Optimized to handle reference changes safely via stabilized inputs.
 */
export function useDoc<T = any>(
  docRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(!!docRef);
  
  const lastDocRef = useRef<DocumentReference<DocumentData> | null | undefined>(null);

  useEffect(() => {
    // If ref changed, reset state immediately
    if (docRef?.path !== lastDocRef.current?.path) {
      setIsLoading(!!docRef);
      setData(null);
      lastDocRef.current = docRef;
    }

    if (!docRef) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setData(null);
        }
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        const contextualError = new FirestorePermissionError({ operation: 'get', path: docRef.path });
        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [docRef]); // Expecting stabilized ref from useMemoFirebase

  return { data, isLoading, error };
}