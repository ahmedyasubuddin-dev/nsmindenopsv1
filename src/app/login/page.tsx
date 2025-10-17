
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
import { PrivacyPolicy } from '@/components/privacy-policy';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// This function will eventually call our backend. For now, it's a placeholder.
async function signInWithUsernameAndPassword(auth: any, { username, password }: LoginFormValues) {
  console.log("Attempting sign-in for:", username);
  // In the future, this will make a secure call to a Cloud Function
  // which finds the user, checks the password hash, and returns a custom token.
  
  // For now, we'll simulate a successful login for 'superuser'
  if (username === 'superuser' && password === 'password') {
     // This is a mock sign-in with a dummy email to make the Firebase Auth state work.
     // In the next step, this will be replaced with a custom token.
     const dummyEmail = 'superuser@srd-minden.app';
     try {
        const userCredential = await signInWithEmailAndPassword(auth, dummyEmail, password);
        return userCredential;
     } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            // If the dummy user doesn't exist, create it for the demo to work
            return await auth.createUserWithEmailAndPassword(dummyEmail, password);
        }
        throw error;
     }
  } else {
    throw new Error("Invalid username or password.");
  }
}


export default function LoginPage() {
  const { toast } = useToast();
  const { auth: firebaseAuth } = useFirebase();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithUsernameAndPassword(firebaseAuth, values);
      toast({
        title: 'Login Successful',
        description: `Welcome, ${values.username}!`,
      });
      router.push('/dashboard');
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
  
   const handleForgotPassword = async () => {
    toast({
        title: "Password Reset Request",
        description: "A request has been sent to the Superuser to reset your password.",
      });
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center login-background p-4">
        <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <Logo className="mx-auto h-12 w-12 text-primary" />
              <CardTitle className="text-2xl font-headline mt-4">SRD: Minden Ops</CardTitle>
              <CardDescription>Please sign in to continue</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="e.g., superuser" {...field} />
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
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                           <div className="text-right">
                              <Button variant="link" size="sm" type="button" onClick={handleForgotPassword} className="h-auto p-0 text-xs">
                                 Forgot password?
                              </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Sign In'}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          <CardFooter className="flex-col items-center justify-center gap-3 text-xs text-center text-muted-foreground pb-4">
            <p className="px-6">By signing in, you acknowledge and agree to our <PrivacyPolicy /></p>
          </CardFooter>
        </Card>
         <footer className="py-4 text-center text-sm text-white/60">
            © 2025 North Sails LLC | All rights reserved.
        </footer>
      </div>
    </>
  );
}
