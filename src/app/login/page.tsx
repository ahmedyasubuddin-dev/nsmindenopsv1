'use client';

import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { getRoleFromEmail, UserRole } from '@/lib/roles';

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

  const assignRoleAndUserDoc = async (user: any) => {
    const role = getRoleFromEmail(user.email);
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
    // In a real app, a Cloud Function would set custom claims here.
    // For now, role is managed via Firestore document.
  };

  const handleSignIn = async () => {
    setAuthError(null);
    const fullEmail = `${selectedUser}@ns.com`;
    try {
      await signInWithEmailAndPassword(firebaseAuth, fullEmail, password);
      toast({
        title: 'Login Successful',
      });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setAuthError("Invalid credentials. If this is the user's first time, please use the 'Sign Up' tab.");
      } else {
        setAuthError(error.message);
      }
    }
  };

  const handleSignUp = async () => {
    setAuthError(null);
    const fullEmail = `${selectedUser}@ns.com`;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        fullEmail,
        password
      );
      await assignRoleAndUserDoc(userCredential.user);
      toast({
        title: 'Account Created & Logged In',
        description: 'Your account has been successfully created.',
      });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("This user account already exists. Please use the 'Sign In' tab.");
      } else {
        setAuthError(error.message);
      }
    }
  };


  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (user) {
    router.push('/');
    return null;
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
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
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
                  <Input id="username-display" value={selectedUser} readOnly />
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
            </TabsContent>
            <TabsContent value="signup">
               <CardContent className="space-y-4 pt-6">
                 <p className="text-sm text-muted-foreground">Use this tab to create the pre-configured user account in Firebase for the first time.</p>
                <div className="space-y-2">
                  <Label>Signing up as</Label>
                   <Input value={userCredentials[selectedUser].role} readOnly />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-4">
                 {authError && (
                  <p className="text-center text-sm text-destructive">
                    {authError}
                  </p>
                )}
                <Button onClick={handleSignUp} className="w-full">
                  Create Account & Sign In
                </Button>
              </CardFooter>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
