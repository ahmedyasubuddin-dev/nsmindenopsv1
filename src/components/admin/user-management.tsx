
"use client";

import React, { useState, useMemo } from 'react';
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
import { PlusCircle, Edit, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { createUser, type CreateUserInput } from '@/ai/flows/create-user-flow';

const userRoles = [
  "Superuser", "B2 Supervisor", "B1 Supervisor", "Quality Manager", "Management", 
  "Pregger Lead", "Tapehead Operator", "Tapehead Lead", "Gantry Lead", 
  "Films Lead", "Graphics Lead"
];

const newUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.string().min(1, "Role is required."),
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

interface UserProfile {
    id: string;
    email: string;
    displayName?: string;
    role: string;
    disabled?: boolean;
}

export function UserManagement() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isUpdateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const { isUserLoading } = useUser();
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    const usersQuery = useMemoFirebase(() => isUserLoading ? null : query(collection(firestore, 'users')), [firestore, isUserLoading]);
    const { data: users, isLoading, error: usersError } = useCollection<UserProfile>(usersQuery);

    const form = useForm<NewUserFormValues>({
        resolver: zodResolver(newUserSchema),
        defaultValues: { email: '', password: '', role: '' },
    });
    
    const updateRoleForm = useForm({ defaultValues: { role: '' }});

    const handleCreateUser = async (values: NewUserFormValues) => {
        setIsCreatingUser(true);
        try {
            const result = await createUser(values);
            toast({ title: "User Created", description: `User ${result.email} has been created with the role ${result.role}.` });
            setCreateDialogOpen(false);
            form.reset();
        } catch (error: any) {
            console.error("Error creating user:", error);
            toast({ title: "Error", description: error.message || "Failed to create user.", variant: 'destructive' });
        } finally {
            setIsCreatingUser(false);
        }
    };
    
    const handleOpenUpdateDialog = (user: UserProfile) => {
        setSelectedUser(user);
        updateRoleForm.setValue('role', user.role);
        setUpdateDialogOpen(true);
    };

    const handleUpdateRole = async (values: { role: string }) => {
        if (!selectedUser) return;
        // This is still a placeholder. We will need a separate flow for updating roles.
        console.log("Simulating role update for:", selectedUser.email, "to", values.role);
        toast({ title: "Role Updated (Simulated)", description: `Role for ${selectedUser.email} is now ${values.role}.` });
        setUpdateDialogOpen(false);
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
                                <Button><PlusCircle className="mr-2"/>Create User</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New User</DialogTitle>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
                                        <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>} />
                                        <FormField control={form.control} name="password" render={({ field }) => <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>} />
                                        <FormField control={form.control} name="role" render={({ field }) => <FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Select a role"/></SelectTrigger></FormControl><SelectContent>{userRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
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
                    </div>
                </CardHeader>
                <CardContent>
                    {usersError && (
                         <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Permission Error</AlertTitle>
                            <AlertDescription>
                                Could not load user data. Check Firestore security rules for the 'users' collection.
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
                            {isLoading || isUserLoading ? (
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
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenUpdateDialog(user)}><Edit className="h-4 w-4"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} className="text-center">No users found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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
        </>
    );
}
