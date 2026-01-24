import { PageHeader } from '@/components/shared/page-header';
import { TeamManager } from '@/components/settings/team/team-manager';

export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server';

export default async function TeamSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let pendingRequests = [];
  let currentUserRole = 'staff'; // Default safe

  if (user) {
      // 1. Fetch User Role
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) currentUserRole = profile.role;

      // 2. Fetch 'join_request' notifications for this user (admin)
      if (currentUserRole === 'admin' || currentUserRole === 'owner' || currentUserRole === 'super_admin') {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'join_request')
            .eq('is_read', false);
        
        if (data) pendingRequests = data;
      }
  }

  // Members will be fetched on client side, but we pass requests
  return (
    <>
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
         <TeamManager pendingRequests={pendingRequests} currentUserRole={currentUserRole} />
      </div>
    </>
  );
}
