
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons';
import { useFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

async function signInWithUsernameAndPassword(auth: any, { username, password }: LoginFormValues) {
  console.log("Attempting sign-in for:", username);
  
  if (username === 'superuser' && password.toLowerCase() === 'password') {
     try {
        const userCredential = await signInAnonymously(auth);
        return userCredential;
     } catch (error) {
        console.error("Anonymous sign-in for placeholder failed:", error);
        throw new Error("Could not create a temporary session.");
     }
  } else {
    throw new Error("Invalid username or password.");
  }
}

function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { toast } = useToast();
  const { auth: firebaseAuth } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithUsernameAndPassword(firebaseAuth, values);
      toast({
        title: 'Login Successful',
        description: `Welcome, ${values.username}!`,
      });
      onLoginSuccess();
    } catch (error: any) {
      console.error("Sign In Error:", error);
      toast({
        variant: "destructive",
        title: 'Login Failed',
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: "Password Reset Request",
      description: "A request has been sent to the Superuser to reset your password.",
    });
  };

  return (
    <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-sm border-none">
      <CardHeader className="text-center">
        <Logo className="mx-auto h-12 w-12 text-primary" />
        <CardTitle className="text-2xl font-headline mt-4">SRD: Minden Ops</CardTitle>
        <CardDescription>Please sign in to continue</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl><Input type="text" placeholder="e.g., superuser" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                <div className="text-right">
                  <Button variant="link" size="sm" type="button" onClick={handleForgotPassword} className="h-auto p-0 text-xs">
                    Forgot password?
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Sign In'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleOpenChange = (isOpen: boolean) => {
    // Keep modal open until login is successful
    if (open) return; 
    setOpen(isOpen);
  };
  
  const handleLoginSuccess = () => {
    setOpen(false);
    router.push('/dashboard'); 
  };
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center login-background p-4">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
           <div className="text-center text-white">
              <Logo className="mx-auto h-16 w-16 text-white drop-shadow-lg" />
              <h1 className="mt-4 text-4xl font-bold font-headline drop-shadow-md">North Sails Minden Operations Dashboard</h1>
              <p className="mt-2 text-lg text-white/80 drop-shadow">Operations insight across all departments.</p>
              <Button size="lg" className="mt-8">Sign In</Button>
            </div>
        </DialogTrigger>
        <DialogContent className="p-0 bg-transparent border-none shadow-none w-full max-w-md">
            <DialogHeader className="sr-only">
              <DialogTitle>Sign In</DialogTitle>
              <DialogDescription>
                Enter your username and password to access the dashboard.
              </DialogDescription>
            </DialogHeader>
           <LoginForm onLoginSuccess={handleLoginSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
