
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth as useFirebaseAuth, useFirebase, useUser } from '@/firebase';
import { getRoleFromEmail } from '@/lib/roles';
import { doc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { PrivacyPolicy } from '@/components/privacy-policy';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const users = {
  'superuser': 'Super.P@ssw0rd',
  'b2_supervisor': 'B2.Sup.P@ss',
  'b1_supervisor': 'B1.Sup.P@ss',
  'quality_manager': 'QM.P@ssw0rd',
  'management': 'M@n@ge.P@ss',
  'pregger_lead': 'Preg.Ld.P@ss',
  'tapehead_operator': 'T@peOp.P@ss',
  'tapehead_lead': 'T@peLd.P@ss',
  'gantry_lead': 'G@ntry.P@ss',
  'films_lead': 'F!lms.P@ss',
  'graphics_lead': 'Gr@ph!cs.P@ss',
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firebaseAuth = useFirebaseAuth();
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('b2_supervisor');
  const [password, setPassword] = useState('B2.Sup.P@ss');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('signin');


  const assignRoleAndUserDoc = async (user: User) => {
    const role = getRoleFromEmail(user.email);
    if (role && user.uid) {
      try {
        const roleDocRef = doc(firestore, 'roles_admin', user.uid);
        await setDoc(roleDocRef, { role: role });
        
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.email?.split('@')[0] || 'User',
            role: role
        }, { merge: true });

        console.log(`Role '${role}' assigned and user document created for ${user.uid}`);

      } catch (error) {
        console.error("Error assigning role/user doc:", error);
        toast({
          title: 'Setup Failed',
          description: 'Could not set the user role in the database.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    const fullEmail = `${email}@ns.com`;

    if (activeTab === 'signin') {
      // --- SIGN IN LOGIC ---
      try {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, fullEmail, password);
        await assignRoleAndUserDoc(userCredential.user);
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
      } catch (error: any) {
         if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          setAuthError("User not found or invalid password. If this is a pre-configured user's first time, please use the 'Sign Up' tab.");
        } else {
          setAuthError(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // --- SIGN UP LOGIC ---
      try {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, fullEmail, password);
        await assignRoleAndUserDoc(userCredential.user);
        toast({
          title: 'Account Created & Logged In',
          description: 'Your user account has been successfully created.',
        });
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          setAuthError("This user account already exists. Please use the 'Sign In' tab.");
        } else {
          setAuthError(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  if (isUserLoading || user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const handleUserSelection = (selectedEmail: string) => {
      setEmail(selectedEmail);
      const newPassword = users[selectedEmail as keyof typeof users];
      if (newPassword) {
          setPassword(newPassword);
      }
  }

  return (
    <div className="relative min-h-screen w-full login-background">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <Logo className="size-10 text-primary" />
                </div>
            <CardTitle className="text-2xl font-headline">North Sails Minden Operations</CardTitle>
            <CardDescription>SRD application for plant operations.</CardDescription>
            </CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <form onSubmit={handleAuthAction}>
                    <TabsContent value="signin">
                        <CardContent className="space-y-4 pt-6">
                             {authError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Authentication Error</AlertTitle>
                                    <AlertDescription>{authError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label>Select a user to sign in as:</Label>
                                <Select value={email} onValueChange={handleUserSelection}>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a user role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {Object.keys(users).map((userEmail) => (
                                        <SelectItem key={userEmail} value={userEmail}>
                                        {userEmail}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Username</Label>
                                <Input id="email" type="text" placeholder="e.g. b2_supervisor" required value={email} onChange={(e) => setEmail(e.target.value)} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </CardFooter>
                    </TabsContent>
                    <TabsContent value="signup">
                       <CardContent className="space-y-4 pt-6">
                             {authError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Sign Up Error</AlertTitle>
                                    <AlertDescription>{authError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label>Select a user to create:</Label>
                                <Select value={email} onValueChange={handleUserSelection}>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a user role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {Object.keys(users).map((userEmail) => (
                                        <SelectItem key={userEmail} value={userEmail}>
                                        {userEmail}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email-signup">Username</Label>
                                <Input id="email-signup" type="text" placeholder="e.g. b2_supervisor" required value={email} onChange={(e) => setEmail(e.target.value)} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-signup">Password</Label>
                                <Input id="password-signup" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? 'Creating Account...' : 'Create Account & Sign In'}
                            </Button>
                        </CardFooter>
                    </TabsContent>
                </form>
            </Tabs>
        </Card>
        <div className="mt-6 text-center">
            <PrivacyPolicy />
        </div>
      </div>
    </div>
  );
}
