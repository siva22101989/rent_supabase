'use client';

import { useState } from 'react';
import type { TeamMember } from "@/lib/definitions";
import { TeamMembersList } from "./team-members-list";
import { TeamMemberDetails } from "./team-member-details";
import { AddTeamMemberForm } from "./add-team-member-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TeamManagerProps {
  initialMembers: TeamMember[];
}

export function TeamManager({ initialMembers }: TeamManagerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [members, setMembers] = useState(initialMembers); // For optimistic updates if needed, though we rely on revalidate mostly

  const selectedMember = members.find(m => m.id === selectedId);

  const handleAddClick = () => {
    setSelectedId(null);
    setIsAdding(true);
  };

  const handleSelect = (id: string) => {
    setIsAdding(false);
    setSelectedId(id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-0 border rounded-xl overflow-hidden shadow-sm bg-card min-h-[600px]">
      
      {/* Left Column: List */}
      <div className="flex flex-col h-full border-r">
         <TeamMembersList 
            members={members} 
            selectedId={selectedId} 
            onSelect={handleSelect} 
         />
         <div className="p-4 border-t bg-muted/20">
            <Button className="w-full gap-2" variant="outline" onClick={handleAddClick}>
                <Plus className="w-4 h-4" />
                Add Member
            </Button>
         </div>
      </div>

      {/* Right Column: Content */}
      <div className="bg-background/50 h-full overflow-y-auto">
        {isAdding ? (
            <div className="p-8 max-w-lg mx-auto">
                 <div className="mb-6">
                    <h2 className="text-xl font-bold">Add New Team Member</h2>
                    <p className="text-muted-foreground">Invite a colleague to your warehouse.</p>
                 </div>
                 <AddTeamMemberForm onSuccess={() => {
                     setIsAdding(false);
                     // Ideally we refresh data here or router.refresh() handles it 
                 }} />
            </div>
        ) : selectedMember ? (
            <TeamMemberDetails member={selectedMember} />
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
