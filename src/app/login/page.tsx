
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getRoleFromEmail } from '@/lib/roles';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const { auth: firebaseAuth } = useFirebase();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');


  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSignIn = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, values.email, values.password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Sign In Error:", error);
      toast({
        title: 'Authentication Error',
        description: "Invalid credentials. If this is the user's first time, please use the 'Sign Up' tab.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, values.email, values.password);
      toast({
        title: 'Account Created',
        description: "You have been successfully signed up and logged in.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Sign Up Error:", error);
      if (error.code === 'auth/email-already-in-use') {
         toast({
          title: 'Sign Up Error',
          description: "This user account already exists. Please use the 'Sign In' tab.",
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sign Up Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmit = (values: LoginFormValues) => {
    if (activeTab === 'signin') {
      handleSignIn(values);
    } else {
      handleSignUp(values);
    }
  };
  
   const handleForgotPassword = () => {
    toast({
      title: "Forgot Password",
      description: "Password reset functionality is not yet implemented.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-background p-4">
      <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-sm">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="text-center">
              <Logo className="mx-auto h-12 w-12 text-primary" />
              <CardTitle className="text-2xl font-headline mt-4">SRD: Minden Ops</CardTitle>
              <CardDescription>Please sign in to continue</CardDescription>
               <TabsList className="grid w-full grid-cols-2 mt-4">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <TabsContent value="signin">
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="user@ns.com" {...field} />
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
                </TabsContent>
                 <TabsContent value="signup">
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="user@ns.com" {...field} />
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </TabsContent>
                <CardFooter className="flex flex-col gap-4">
                   <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Processing...' : (activeTab === 'signin' ? 'Sign In' : 'Sign Up')}
                  </Button>
                </CardFooter>
              </form>
            </Form>
        </Tabs>
         <CardFooter className="justify-center items-center text-xs text-center text-muted-foreground pb-4">
            <PrivacyPolicy />
        </CardFooter>
      </Card>
    </div>
  );
}
