
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
import { useAuth as useFirebaseAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const users = {
  'superuser@ns.com': 'password',
  'b2_supervisor@ns.com': 'password',
  'b1_supervisor@ns.com': 'password',
  'quality_manager@ns.com': 'password',
  'management@ns.com': 'password',
  'pregger_lead@ns.com': 'password',
  'tapehead_operator@ns.com': 'password',
  'tapehead_lead@ns.com': 'password',
  'gantry_lead@ns.com': 'password',
  'films_lead@ns.com': 'password',
  'graphics_lead@ns.com': 'password',
  // Old users for compatibility
  'lead@ns.com': 'GavinKilledFishes',
  'operator@ns.com': 'GavinKilledFishes',
  'head@ns.com': 'GavinKilledFishes',
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firebaseAuth = useFirebaseAuth();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('b2_supervisor@ns.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      // The redirect is now handled by the layout effect
    } catch (error) {
      console.error(error);
      toast({
        title: 'Invalid Credentials',
        description: 'Please check your email and password.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isUserLoading || user) {
    // Prevent login page from flashing if user is already authenticated and redirecting
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                 <Logo className="size-10 text-primary" />
            </div>
          <CardTitle className="text-2xl font-headline">SRD: Minden Operations</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
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
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            </CardContent>
            <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
