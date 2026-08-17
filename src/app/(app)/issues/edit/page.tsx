'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Unified Edit Interface: Redirects to the Side Panel management system.
 */
function EditIssueRedirectInner() {
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

export default function EditIssueRedirect() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <EditIssueRedirectInner />
    </Suspense>
  );
}