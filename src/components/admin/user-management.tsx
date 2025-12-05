
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, AlertTriangle, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
// User management now uses API routes

const userRoles = [
    "Superuser", "B2 Supervisor", "B1 Supervisor", "Quality Manager", "Management",
    "Pregger Lead", "Tapehead Operator", "Tapehead Lead", "Gantry Lead",
    "Films Lead", "Graphics Lead"
];

const newUserSchema = z.object({
    username: z.string().min(1, "Username is required."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    role: z.string().min(1, "Role is required."),
    email: z.union([z.string().email(), z.literal('')]).optional(),
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

interface UserProfile {
    id: string;
    email?: string;
    displayName?: string;
    role?: string;
    disabled?: boolean;
}

export function UserManagement() {
    const { toast } = useToast();
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isUpdateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [isDeletingUser, setIsDeletingUser] = useState(false);

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getSessionToken = () => {
        if (typeof document === 'undefined') return '';
        console.log('[Client] All cookies:', document.cookie);
        const match = document.cookie.match(new RegExp('(^| )ns-session-token=([^;]+)'));
        const token = match ? match[2] : '';
        console.log('[Client] Extracted token:', token ? token.substring(0, 10) + '...' : 'none');
        return token;
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = getSessionToken();
            const response = await fetch('/api/users', {
                credentials: 'include', // CRITICAL: Send cookies with request
                headers: {
                    'X-Session-Token': token
                }
            });
            if (!response.ok) {
                const errResult = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error("Fetch users failed:", JSON.stringify(errResult, null, 2));
                throw new Error(errResult.error || 'Failed to fetch users');
            }
            const result = await response.json();
            setUsers(result.data || []);
        } catch (err: any) {
            console.error("Failed to fetch users:", err);
            setError("Could not load user data. The backend service may be unavailable.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const form = useForm<NewUserFormValues>({
        resolver: zodResolver(newUserSchema),
        defaultValues: { username: '', password: '', role: '', email: '' },
    });

    const updateRoleForm = useForm({ defaultValues: { role: '' } });

    const handleCreateUser = async (values: NewUserFormValues) => {
        setIsCreatingUser(true);
        try {
            // Normalize role to match username format
            const normalizedRole = values.role.toLowerCase().replace(/\s+/g, '_');
            // Username must equal role (as per requirements)
            const username = normalizedRole;

            const token = getSessionToken();
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Token': token
                },
                credentials: 'include', // Send cookies with request
                body: JSON.stringify({
                    username: username,
                    password: values.password,
                    role: normalizedRole,
                    email: values.email || `${username}@nsmindenops.com`,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create user');
            }

            toast({
                title: "User Created Successfully",
                description: (
                    <div className="space-y-2">
                        <p>User <strong>{username}</strong> has been created.</p>
                        <p>Role: <strong>{normalizedRole}</strong></p>
                        <div className="mt-2 p-2 bg-muted rounded">
                            <p className="text-xs font-mono">Password: <strong>{values.password}</strong></p>
                            <p className="text-xs text-muted-foreground mt-1">⚠️ Save this password - it won't be shown again!</p>
                        </div>
                    </div>
                ),
                duration: 10000, // Show for 10 seconds so they can copy it
            });
            setCreateDialogOpen(false);
            form.reset();
            fetchUsers(); // Refresh the user list
        } catch (error: any) {
            console.error("Error creating user:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create user.",
                variant: 'destructive'
            });
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleOpenUpdateDialog = (user: UserProfile) => {
        setSelectedUser(user);
        updateRoleForm.setValue('role', user.role || '');
        setUpdateDialogOpen(true);
    };

    const handleUpdateRole = async (values: { role: string }) => {
        if (!selectedUser) return;

        try {
            const normalizedRole = values.role.toLowerCase().replace(/\s+/g, '_');

            const token = getSessionToken();
            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Token': token
                },
                credentials: 'include',
                body: JSON.stringify({ role: normalizedRole }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update role');
            }

            toast({
                title: "Role Updated",
                description: `Role for ${selectedUser.email} is now ${normalizedRole}.`
            });
            setUpdateDialogOpen(false);
            fetchUsers(); // Refresh the user list
        } catch (error: any) {
            console.error("Error updating role:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to update role.",
                variant: 'destructive'
            });
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        setIsDeletingUser(true);
        try {
            const token = getSessionToken();
            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'DELETE',
                headers: {
                    'X-Session-Token': token
                },
                credentials: 'include',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete user');
            }

            toast({
                title: "User Deleted",
                description: `User ${selectedUser.email || selectedUser.displayName} has been deleted.`
            });
            setDeleteDialogOpen(false);
            setSelectedUser(null);
            fetchUsers(); // Refresh the user list
        } catch (error: any) {
            console.error("Error deleting user:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to delete user.",
                variant: 'destructive'
            });
        } finally {
            setIsDeletingUser(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Users</CardTitle>
                            <CardDescription>Manage user accounts and their roles.</CardDescription>
                        </div>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button><PlusCircle className="mr-2" />Create User</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New User</DialogTitle>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Role (Username will be auto-set)</FormLabel>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            // Auto-set username to normalized role
                                                            const normalizedRole = value.toLowerCase().replace(/\s+/g, '_');
                                                            form.setValue('username', normalizedRole);
                                                        }}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a role" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {userRoles.map(r => (
                                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="username"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Username (Auto-set from role)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="text"
                                                            {...field}
                                                            disabled
                                                            className="bg-muted"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="Optional, for notifications" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter>
                                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                                            <Button type="submit" disabled={isCreatingUser}>
                                                {isCreatingUser ? 'Creating...' : 'Create'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                        <Button
                            variant="outline"
                            className="ml-2"
                            onClick={() => {
                                console.log('Debug - All Cookies:', document.cookie);
                                const token = getSessionToken();
                                alert(`Token found: ${token ? 'Yes' : 'No'}\nLength: ${token.length}\nCookie: ${document.cookie}`);
                            }}
                        >
                            Debug Session
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error Loading Users</AlertTitle>
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4} className="text-center">Loading users...</TableCell></TableRow>
                            ) : users && users.length > 0 ? (
                                users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                                        <TableCell>
                                            <Badge variant={user.disabled ? 'destructive' : 'default'}>
                                                {user.disabled ? 'Disabled' : 'Enabled'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenUpdateDialog(user)}><Edit className="h-4 w-4" /></Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} className="text-center">No users found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card >

            <Dialog open={isUpdateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Role for {selectedUser?.email}</DialogTitle>
                    </DialogHeader>
                    <Form {...updateRoleForm}>
                        <form onSubmit={updateRoleForm.handleSubmit(handleUpdateRole)} className="space-y-4">
                            <FormField control={updateRoleForm.control} name="role" render={({ field }) => <FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{userRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                                <Button type="submit">Update Role</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>
                                Are you sure you want to delete user <strong>{selectedUser?.email || selectedUser?.displayName}</strong>?
                                This action cannot be undone.
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">Cancel</Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={isDeletingUser}
                        >
                            {isDeletingUser ? 'Deleting...' : 'Delete User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
