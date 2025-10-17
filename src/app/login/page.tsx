
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

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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
    // This will be replaced with a call to a custom auth Cloud Function
    console.log("Attempting to sign in with:", values);
    
    // Mock successful login for now
    setTimeout(() => {
      toast({
        title: 'Login Successful (Mock)',
        description: `Welcome, ${values.username}!`,
      });
      // In a real scenario, we'd get a custom token and sign in with it
      // For now, we just redirect. The AuthGuard will need to be adjusted.
      router.push('/dashboard'); 
      setIsLoading(false);
    }, 1000);
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
