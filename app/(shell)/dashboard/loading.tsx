import { PageContainer } from '@/components/layout/PageContainer';
import { DashboardPageSkeleton } from '@/features/dashboard/components/DashboardSkeleton';

export default function DashboardLoading(): React.JSX.Element {
  return (
    <PageContainer className="bg-[#F8FAFC]">
      <DashboardPageSkeleton />
    </PageContainer>
  );
}
