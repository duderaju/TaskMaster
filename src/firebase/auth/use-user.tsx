'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth, useFirestore } from '../provider';
import { getOrCreateOrganizationAndUser } from '@/app/actions/user-org-actions';
import { doc, onSnapshot } from 'firebase/firestore';

export interface AppUser extends User {
  organizationId: string;
  role?: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Global hook for accessing authenticated user state and profile data.
 * It combines Firebase Auth state with the user's Firestore profile document.
 * 
 * CRITICAL: We prioritize the role from Firestore to avoid propagation delays 
 * with Custom Claims.
 */
export const useUser = () => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !firestore) {
      setIsUserLoading(false);
      return;
    }

    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          if (unsubscribeDoc) unsubscribeDoc();
          setUser(null);
          setIsUserLoading(true); // Keep loading true during sign-out transition
          setTimeout(() => setIsUserLoading(false), 50); // Small delay to prevent flash
          return;
        }

        // 1. Get Authentication Claims for Organization ID
        let tokenResult = await firebaseUser.getIdTokenResult();
        let orgId = tokenResult.claims.organizationId as string | undefined;

        // 2. Bootstrap if needed (First time login / Migration)
        if (!orgId) {
          console.debug('[useUser:Bootstrap] No orgId claim found, starting provisioning...');
          const displayName = firebaseUser.displayName || '';
          const nameParts = displayName.split(' ');
          
          try {
            orgId = await getOrCreateOrganizationAndUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || `anon-${firebaseUser.uid}@example.com`,
              avatarUrl: firebaseUser.photoURL || '',
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
            });

            // Force refresh token to pick up new organizationId claim
            await firebaseUser.getIdToken(true);
            tokenResult = await firebaseUser.getIdTokenResult();
          } catch (bootstrapErr) {
            console.error('[useUser:Bootstrap] Failed:', bootstrapErr);
          }
        }

        // 3. Subscribe to Firestore Profile for persistent data (Avatar, Names, ROLE)
        if (unsubscribeDoc) unsubscribeDoc();
        
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          const profileData = docSnap.data();
          
          if (orgId) {
            // Priority: Use role from Firestore doc first (instant sync), fallback to claims
            const currentRole = profileData?.role || (tokenResult.claims.role as string | undefined);

            const appUser = {
              ...firebaseUser,
              organizationId: orgId,
              role: currentRole,
              avatarUrl: profileData?.avatarUrl || firebaseUser.photoURL || undefined,
              firstName: profileData?.firstName || firebaseUser.displayName?.split(' ')[0] || '',
              lastName: profileData?.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            } as AppUser;
            
            setUser(appUser);
          } else {
            setUser(null);
          }
          setIsUserLoading(false);
        }, (err) => {
          console.error('[useUser:Firestore] Profile subscription failed:', err);
          setIsUserLoading(false);
        });

        setError(null);
      } catch (e: any) {
        console.error('[useUser:SDK] Session initialization error:', e);
        setError('Failed to initialize session');
        setIsUserLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, [auth, firestore]);

  return { user, isUserLoading, error };
};
