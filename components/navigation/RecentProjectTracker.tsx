'use client';

import { useEffect } from 'react';

import { setRecentProjectId } from '@/lib/navigation/recent-project';

interface RecentProjectTrackerProps {
  projectId: string;
}

export function RecentProjectTracker({
  projectId,
}: RecentProjectTrackerProps): null {
  useEffect(() => {
    setRecentProjectId(projectId);
  }, [projectId]);

  return null;
}
