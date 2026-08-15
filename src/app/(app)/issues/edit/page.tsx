'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Unified Edit Interface: Redirects to the Side Panel management system.
 */
export default function EditIssueRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const issueId = searchParams.get('issueId');

  useEffect(() => {
    if (issueId) {
      router.replace(`/issues?issueId=${issueId}`);
    } else {
      router.replace('/issues');
    }
  }, [issueId, router]);

  return null;
}