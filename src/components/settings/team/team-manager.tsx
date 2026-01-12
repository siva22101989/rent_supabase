'use client';

import { useState } from 'react';
import type { TeamMember } from "@/lib/definitions";
import { TeamMembersList } from "./team-members-list";
import { TeamMemberDetails } from "./team-member-details";
import { InviteLinkGenerator } from "./invite-link-generator";
import { AddTeamMemberForm } from "./add-team-member-form";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useTeamMembers } from '@/hooks/use-team-members';
import { approveJoinRequest, rejectJoinRequest } from '@/lib/warehouse-actions';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface TeamManagerProps {
  initialMembers: TeamMember[]; 
  pendingRequests?: any[]; // Array of notifications
  currentUserRole?: string;
}

export function TeamManager({ initialMembers, pendingRequests = [], currentUserRole = 'staff' }: TeamManagerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  
  // Use new hook
  const { members, loading, refreshMembers } = useTeamMembers();

  const selectedMember = members.find((m: any) => m.id === selectedId);

  const handleAddClick = () => {
    setSelectedId(null);
    setIsAdding(true);
  };

  const handleSelect = (id: string) => {
    setIsAdding(false);
    setSelectedId(id);
  };

  const handleApprove = async (notification: any) => {
      // notification link: /settings/team?approve_user=XYZ
      // Extract user ID from link or parsed message?
      // Better: parse logic from link param
      const urlParams = new URLSearchParams(notification.link.split('?')[1]);
      const userId = urlParams.get('approve_user');
      if (!userId) {
          toast({ title: "Error", description: "Invalid request data", variant: "destructive" });
          return;
      }
      
      const res = await approveJoinRequest(notification.id, userId);
      if (res.success) {
          toast({ title: "Approved", description: "User added to team." });
          await refreshMembers();
          // Ideally remove request from props lists? 
          // Since it's server prop, we rely on revalidatePath to refresh the page.
          // But full page reload might be needed or router.refresh()
          window.location.reload(); 
      } else {
          toast({ title: "Error", description: res.message, variant: "destructive" });
      }
  };

  const handleReject = async (id: string) => {
      const res = await rejectJoinRequest(id);
      if (res.success) {
          toast({ title: "Rejected", description: "Request removed." });
          window.location.reload(); 
      } else {
          toast({ title: "Error", description: res.message, variant: "destructive" });
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-0 border rounded-xl overflow-hidden shadow-sm bg-card h-[calc(100vh-12rem)] max-h-[900px]">
      
      {/* Left Column: List */}
      <div className={`flex flex-col h-full border-r ${selectedId || isAdding ? 'hidden md:flex' : 'flex'}`}>
         {/* Pending Requests Section */}
         {pendingRequests.length > 0 && (
             <div className="p-4 bg-yellow-50 border-b space-y-3">
                 <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-700">Pending Requests</h4>
                 <div className="space-y-2">
                     {pendingRequests.map(req => (
                         <div key={req.id} className="bg-white p-3 rounded-md shadow-sm border border-yellow-200">
                             <p className="text-sm font-medium text-slate-800 line-clamp-2">{req.message}</p>
                             <div className="flex gap-2 mt-2">
                                 <Button size="sm" className="h-7 w-full bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req)}>
                                     <Check className="h-3 w-3 mr-1" /> Accept
                                 </Button>
                                 <Button size="sm" variant="outline" className="h-7 w-full border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleReject(req.id)}>
                                     <X className="h-3 w-3" />
                                 </Button>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}

         {loading ? (
             <div className="flex items-center justify-center flex-1 h-32">
                 <Loader2 className="animate-spin rounded-full h-8 w-8 text-primary" />
             </div>
         ) : (
            <TeamMembersList 
                members={members} 
                selectedId={selectedId} 
                onSelect={handleSelect} 
            />
         )}
         <div className="p-4 border-t bg-muted/20 mt-auto">
            <Button className="w-full gap-2" variant="outline" onClick={handleAddClick}>
                <Plus className="w-4 h-4" />
                Add Member
            </Button>
         </div>
      </div>

      {/* Right Column: Content */}
      <div className={`bg-background/50 h-full overflow-y-auto ${!selectedId && !isAdding ? 'hidden md:block' : 'block'}`}>
        {/* Mobile Back Button */}
        {(selectedId || isAdding) && (
             <div className="md:hidden p-4 border-b flex items-center gap-2">
                 <Button variant="ghost" size="sm" onClick={() => { setSelectedId(null); setIsAdding(false); }}>
                     <ArrowLeft className="w-4 h-4 mr-1" /> Back to Team
                 </Button>
             </div>
        )}

        {isAdding ? (
            <div className="p-8 max-w-lg mx-auto">
                 <div className="mb-6">
                    <h2 className="text-xl font-bold">Add New Team Member</h2>
                    <p className="text-muted-foreground">Invite a colleague to your warehouse.</p>
                 </div>
                 <AddTeamMemberForm onSuccess={async () => {
                     setIsAdding(false);
                     await refreshMembers();
                 }} />
                 
                 <div className="mt-8 border-t pt-8">
                    <InviteLinkGenerator />
                 </div>
            </div>
        ) : selectedMember ? (
            <TeamMemberDetails member={selectedMember} currentUserRole={currentUserRole} />
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in-50">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="font-semibold text-lg">Manage Your Team</h3>
                <p className="max-w-xs mt-2">Select a member to view details or click "Add Member" to invite someone new.</p>
            </div>
        )}
      </div>
    </div>
  );
}
