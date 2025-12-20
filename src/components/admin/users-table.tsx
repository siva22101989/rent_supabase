'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, Shield, User, Building, Mail, Clock, Search, Download } from "lucide-react";
import { format } from "date-fns";
import { updateUserRole } from "@/lib/admin-actions";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { exportToExcel } from "@/lib/export-utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

interface AdminUsersTableProps {
    users: any[];
}

function AdminUsersTableComponent({ users }: AdminUsersTableProps) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    
    // Debounce search query
    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

    // Memoize filtered users
    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            (u.full_name && u.full_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
            u.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
    }, [users, debouncedSearchQuery]);

    // Memoize role change handler
    const handleRoleChange = useCallback(async (userId: string, newRole: string) => {
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
    }, [toast]);

    // Memoize export handler
    const handleExport = useCallback(() => {
        const data = filteredUsers.map(u => ({
            'Name': u.full_name || 'N/A',
            'Email': u.email,
            'Role': u.role,
            'Warehouse': u.warehouse_name || 'N/A',
            'Joined': format(new Date(u.created_at), 'yyyy-MM-dd')
        }));
        exportToExcel(data, `users_export_${new Date().getTime()}`, 'Users');
        toast({ title: "Export Started", description: "User data is being downloaded." });
    }, [filteredUsers, toast]);

    const getRoleBadgeColor = useCallback((role: string) => {
        switch (role) {
            case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'owner': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'manager': return 'bg-green-100 text-green-800 border-green-200';
            case 'staff': return 'bg-slate-100 text-slate-800 border-slate-200';
            case 'customer': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    }, []);

    const getRoleIcon = useCallback((role: string) => {
        if (role === 'super_admin' || role === 'owner' || role === 'admin') {
            return <Shield className="h-3 w-3" />;
        }
        return <User className="h-3 w-3" />;
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto" onClick={handleExport}>
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border bg-white overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="w-[250px]">User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Warehouse</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={u.avatar_url} />
                                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                                                {u.full_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{u.full_name || 'Unnamed User'}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {u.email}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`gap-1 ${getRoleBadgeColor(u.role)}`}>
                                        {getRoleIcon(u.role)}
                                        {u.role.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm text-slate-600">
                                        <Building className="h-3 w-3 text-slate-400" />
                                        {u.warehouse_name || 'No warehouse'}
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">
                                    <div className="flex items-center gap-1">
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
                                            <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'owner')}>
                                                Owner
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'admin')}>
                                                Admin
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'manager')}>
                                                Manager
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'staff')}>
                                                Staff
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'customer')}>
                                                Customer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No users found matching "{debouncedSearchQuery}"
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {filteredUsers.map((u) => (
                    <Card key={u.id}>
                        <CardContent className="p-4 space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Avatar className="h-10 w-10 shrink-0">
                                        <AvatarImage src={u.avatar_url} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                                            {u.full_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm truncate">
                                            {u.full_name || 'Unnamed User'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                            <Mail className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{u.email}</span>
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'owner')}>
                                            Owner
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'admin')}>
                                            Admin
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'manager')}>
                                            Manager
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'staff')}>
                                            Staff
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'customer')}>
                                            Customer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Role Badge */}
                            <div>
                                <Badge variant="outline" className={`gap-1 ${getRoleBadgeColor(u.role)}`}>
                                    {getRoleIcon(u.role)}
                                    {u.role.replace('_', ' ')}
                                </Badge>
                            </div>

                            {/* Warehouse & Date */}
                            <div className="flex items-center justify-between text-sm pt-2 border-t">
                                <div className="flex items-center gap-1.5 text-slate-600">
                                    <Building className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="truncate">{u.warehouse_name || 'No warehouse'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(u.created_at), 'MMM d, yyyy')}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {filteredUsers.length === 0 && (
                    <Card>
                        <CardContent className="p-8 text-center text-slate-500">
                            No users found matching "{debouncedSearchQuery}"
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

// Wrap with React.memo
export const AdminUsersTable = React.memo(
    AdminUsersTableComponent,
    (prevProps, nextProps) => {
        return prevProps.users === nextProps.users;
    }
);

AdminUsersTable.displayName = 'AdminUsersTable';
