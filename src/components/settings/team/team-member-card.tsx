import { cn } from "@/lib/utils";
import type { TeamMember } from "@/lib/definitions";


interface TeamMemberCardProps {
  member: TeamMember;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TeamMemberCard({ member, isSelected, onClick }: TeamMemberCardProps) {
  const roleColors = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
    manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    staff: "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300 border-gray-200 dark:border-zinc-700",
    suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-transparent hover:bg-muted/50 hover:border-border"
      )}
    >
      <div className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border",
        roleColors[member.role as keyof typeof roleColors] || roleColors.staff
      )}>
        <span className="font-bold text-sm">
          {member.fullName?.substring(0, 2).toUpperCase() || '??'}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
            <p className="font-semibold text-sm truncate">{member.fullName}</p>
            {/* Status Dot */}
            <div className={cn("h-2 w-2 rounded-full", member.role === 'suspended' ? 'bg-gray-300' : 'bg-green-500 animate-pulse')} />
        </div>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
      </div>
    </div>
  );
}
