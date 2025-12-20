'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Shield, User, Building, Mail, Clock } from "lucide-react";
import { format } from "date-fns";
import { updateUserRole } from "@/lib/admin-actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Download } from "lucide-react";
import { exportToExcel } from "@/lib/export-utils";

interface AdminUsersTableProps {
    users: any[];
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredUsers = users.filter(u => 
        (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRoleChange = async (userId: string, newRole: string) => {
        const result = await updateUserRole(userId, newRole);
        if (result.success) {
            toast({
                title: "Success",
                description: "User role updated",
            });
        } else {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
    };

    const handleExport = () => {
        const data = filteredUsers.map(u => ({
            'Full Name': u.full_name || 'N/A',
            'Email': u.email,
            'Role': u.role,
            'Warehouse': u.warehouse?.name || 'Unassigned',
            'Joined Date': format(new Date(u.created_at), 'yyyy-MM-dd')
        }));
        exportToExcel(data, `users_export_${new Date().getTime()}`, 'Users');
        toast({ title: "Export Started", description: "User data is being downloaded." });
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'super_admin':
                return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 gap-1"><Shield className="h-3 w-3" /> Super Admin</Badge>;
            case 'admin':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 gap-1"><Shield className="h-3 w-3" /> Admin</Badge>;
            case 'owner':
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 gap-1"><User className="h-3 w-3" /> Owner</Badge>;
            case 'manager':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 gap-1"><User className="h-3 w-3" /> Manager</Badge>;
            default:
                return <Badge variant="outline" className="gap-1"><User className="h-3 w-3" /> Staff</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
            </div>
            <div className="rounded-md border bg-white">
                <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50">
                        <TableHead className="w-[300px]">User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Assigned Warehouse</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">{u.full_name?.[0] || u.email?.[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{u.full_name || 'Anonymous User'}</span>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-normal">
                                            <Mail className="h-3 w-3" />
                                            {u.email}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {getRoleBadge(u.role)}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1 text-sm text-slate-500">
                                    <Building className="h-3 w-3" />
                                    {u.warehouse?.name || <span className="text-xs italic text-slate-400">None</span>}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(u.created_at), 'MMM d, yyyy')}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'super_admin')}>
                                            Set as Super Admin
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'admin')}>
                                            Set as Admin
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'manager')}>
                                            Set as Manager
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'staff')}>
                                            Set as Staff
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-rose-600 focus:text-rose-600">
                                            Suspend User
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No users found matching "{searchQuery}"
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
    );
}
