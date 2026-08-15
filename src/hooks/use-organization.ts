'use client';

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { type WithId } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';


// Define the shape of the Organization object
interface Organization {
  id: string;
  name: string;
  status: 'provisioning' | 'active';
  members: { [key: string]: string };
}

type UseOrganizationResult = {
  organization: WithId<Organization> | null;
  isOrgLoading: boolean;
};

/**
 * A production-grade hook for subscribing to an organization's document in Firestore.
 * This is the primary mechanism for driving UI state based on organization readiness.
 *
 * It subscribes to the organization document directly, making Firestore the single
 * source of truth. This avoids race conditions associated with waiting for
 * asynchronous custom claims to propagate to the client.
 *
 * @param organizationId The ID of the organization to subscribe to.
 * @returns An object containing the reactive organization data and loading state.
 */
export function useOrganization(
  organizationId: string | undefined | null
): UseOrganizationResult {
  const firestore = useFirestore();

  // Memoize the document reference to prevent unnecessary re-renders and
  // infinite loops in the underlying `useDoc` hook.
  const orgRef = useMemo(
    () => {
      if (!firestore || !organizationId) {
        return null;
      }
      return doc(firestore, 'organizations', organizationId);
    },
    [firestore, organizationId]
  );

  // useDoc is a real-time subscription. When the server action updates the
  // organization's status from 'provisioning' to 'active', this hook will
  // receive the new data, triggering a re-render in the component that uses it.
  const { data, isLoading, error } = useDoc<Organization>(orgRef);

  if (error) {
    console.error('[useOrganization] Error fetching organization:', error);
  }

  return {
    organization: data,
    isOrgLoading: isLoading,
  };
}
