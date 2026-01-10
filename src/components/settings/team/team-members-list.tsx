'use client';

import { useState } from 'react';
import type { TeamMember } from "@/lib/definitions";
import { TeamMemberCard } from "./team-member-card";
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TeamMembersListProps {
  members: TeamMember[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TeamMembersList({ members, selectedId, onSelect }: TeamMembersListProps) {
  const [search, setSearch] = useState('');

  const filtered = members.filter(m => {
    const name = m.fullName || '';
    const email = m.email || '';
    const searchLower = search.toLowerCase();
    
    // Debug log to help diagnose visibility issues
    // console.log('Filtering member:', { name, email, search: searchLower });

    return name.toLowerCase().includes(searchLower) || 
           email.toLowerCase().includes(searchLower);
  });

  return (
    <div className="flex-1 flex flex-col border-r bg-background/50 min-h-0">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Team Members</h3>
            <Badge variant="secondary" className="text-xs">{members.length}</Badge>
        </div>
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search team..." 
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
                No members found.
            </div>
        ) : (
            filtered.map(member => (
            <TeamMemberCard 
                key={member.id} 
                member={member} 
                isSelected={selectedId === member.id}
                onClick={() => onSelect(member.id)}
            />
            ))
        )}
      </div>
    </div>
  );
}
