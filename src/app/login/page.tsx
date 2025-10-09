
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth as useFirebaseAuth, useFirebase, useUser } from '@/firebase';
import type { UserRole } from '@/lib/roles';

const userCredentials: Record<
  string,
  { password: string; role: UserRole }
> = {
  'superuser': { password: 'password', role: 'Superuser' },
  'b2_supervisor': { password: 'password', role: 'B2 Supervisor' },
  'b1_supervisor': { password: 'password', role: 'B1 Supervisor' },
  'quality_manager': { password: 'password', role: 'Quality Manager' },
  'management': { password: 'password', role: 'Management' },
  'pregger_lead': { password: 'password', role: 'Pregger Lead' },
  'tapehead_operator': { password: 'password', role: 'Tapehead Operator' },
  'tapehead_lead': { password: 'password', role: 'Tapehead Lead' },
  'gantry_lead': { password: 'password', role: 'Gantry Lead' },
  'films_lead': { password: 'password', role: 'Films Lead' },
  'graphics_lead': { password: 'password', role: 'Graphics Lead' },
};

export default function LoginPage() {
  const [selectedUser, setSelectedUser] = useState('superuser');
  const [password, setPassword] = useState(userCredentials['superuser'].password);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const firebaseAuth = useFirebaseAuth();
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const handleUserChange = (value: string) => {
    setSelectedUser(value);
    setPassword(userCredentials[value].password);
    setAuthError(null);
  };
  
  const assignRoleAndUserDoc = async (user: any, role: UserRole) => {
    const userDocRef = doc(firestore, 'users', user.uid);
    const userProfile = {
      id: user.uid,
      email: user.email,
      displayName: user.email?.split('@')[0] || 'User',
      role: role,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, userProfile, { merge: true });
    
    // Simulate calling a Cloud Function to set custom claims.
    // In a real app, this would be a call to a backend endpoint.
    console.log(`[Simulation] Would call Cloud Function to set role '${role}' for user ${user.uid}`);
    if (user.email === 'superuser@ns.com') {
      console.log("[Simulation] As this is the superuser, claim is being set immediately for demo purposes.");
      // For this interactive demo, we can't run a backend function,
      // but we can tell the user what would happen.
       toast({
        title: "Superuser role set (Simulated)",
        description: "In a real app, a Cloud Function would set this. For now, log out and log back in to see admin rights.",
      });
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    const fullEmail = `${selectedUser}@ns.com`;
    const role = userCredentials[selectedUser].role;

    try {
      await signInWithEmailAndPassword(firebaseAuth, fullEmail, password);
      toast({ title: 'Login Successful' });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If user does not exist, try to create them
        try {
          const userCredential = await createUserWithEmailAndPassword(firebaseAuth, fullEmail, password);
          await assignRoleAndUserDoc(userCredential.user, role);
          toast({ title: 'Account Created & Logged In', description: 'Your account has been successfully created.' });
        } catch (createError: any) {
           setAuthError(createError.message);
        }
      } else if (error.code === 'auth/invalid-credential') {
        setAuthError('Invalid username or password. Please try again.');
      } else {
        setAuthError(error.message);
      }
    }
  };


  useEffect(() => {
    // If the user is loaded and exists, redirect them away from the login page.
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);
  
  if (isUserLoading || user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      );
  }

  return (
    <div className="w-full h-screen login-background">
      <div className="flex items-center justify-center h-full bg-black/50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <Logo className="size-8 text-primary"/>
                <CardTitle className="text-3xl font-headline">
                SRD: Minden Ops
                </CardTitle>
            </div>
            <CardDescription>
              Select a pre-configured user to sign in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="username">Sign in as</Label>
              <Select value={selectedUser} onValueChange={handleUserChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(userCredentials).map((key) => (
                    <SelectItem key={key} value={key}>
                      {userCredentials[key].role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username-display">Username</Label>
              <Input id="username-display" value={`${selectedUser}@ns.com`} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-display">Password</Label>
              <Input id="password-display" type="password" value={password} readOnly />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-4">
            {authError && (
              <p className="text-center text-sm text-destructive">
                {authError}
              </p>
            )}
            <Button onClick={handleSignIn} className="w-full">
              Sign In
            </Button>
              <div className="text-center text-sm">
                <Button variant="link" className="p-0 h-auto">Forgot password?</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
