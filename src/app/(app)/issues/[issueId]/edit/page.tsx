'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redundant edit page UI removed in favor of the Side Panel (IssueDetailPanel).
 * This page now seamlessly redirects to the main issues view with the item open.
 */
export default function EditIssueRedirect() {
  const router = useRouter();
  const params = useParams();
  const issueId = params.issueId as string;

  useEffect(() => {
    if (issueId) {
      router.replace(`/issues?issueId=${issueId}`);
    }
  }, [issueId, router]);

  return null;
}