import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { getTeamMembers } from '@/lib/queries';
import { TeamManager } from '@/components/settings/team/team-manager';

export const dynamic = 'force-dynamic';

export default async function TeamSettingsPage() {
  const members = await getTeamMembers();

  return (
    <AppLayout>
      <PageHeader
        title="Team Management"
        description="Create accounts for your staff."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Settings', href: '/settings' },
          { label: 'Team' }
        ]}
      />
      
      <div className="max-w-6xl mx-auto">
         <TeamManager initialMembers={members} />
      </div>
    </AppLayout>
  );
}
