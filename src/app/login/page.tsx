
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth as useAppAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';

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
  'lead@ns.com': 'GavinKilledFishes',
  'operator@ns.com': 'GavinKilledFishes',
  'head@ns.com': 'GavinKilledFishes',
};

const PrivacyPolicy = () => (
    <div className="prose prose-sm text-gray-700 dark:text-gray-300">
        <h2 className="text-gray-800 dark:text-gray-200">PRIVACY POLICY</h2>
        <p>Information about personal data processing. In force since 26 September 2023.</p>
        <p>This information is provided pursuant to Regulation (EU) 2016/679 of the European Parliament and Council of 27 April 2016 about the protection of personal data (GDPR) and illustrates how the personal data given on this website are processed.</p>
        
        <h3 className="text-gray-800 dark:text-gray-200">Data Controller.</h3>
        <p>North Sails GmbH - Harkortstraße 79, 22765 Hamburg - DE814864953, Email: webcustomercare@northsail.com, share capital, 33.750,00 Euro, Telephone +39 0185200555, (telephone number active from Monday to Friday, from 09.00 to 18.00) (North Sails) in relation to personal data given by the user on the website www.northsails.com (Website).</p>
        
        <h3 className="text-gray-800 dark:text-gray-200">Purpose of the processing.</h3>
        <p>North Sails shall process personal data provided by the user for the following purposes:</p>
        <ol>
            <li>To register with the Website and make use of the services reserved for registered users (so-called Website registration purposes)</li>
            <li>To purchase products offered for online sale on the Website and, therefore, to conclude the sales contract and the correct execution of the operations connected to the same</li>
            <li>With the express consent of the user, for North Sails to send by email informative and promotional communications (including the newsletter) about the products on sale on the Website (marketing purposes)</li>
            <li>With the user’s consent, for the analysis of their consumption choices and shopping habits (profiling) by North Sails by collecting data about the type and frequency of purchases made online in order to send information and/or advertising material of specific interest to the user by email</li>
            <li>To respond to user queries (customer care)</li>
            <li>To send an email to remind the user to complete the purchase if they have not logged in to the Website and abandon the purchase procedure without completing it</li>
            <li>For administration-accounting purposes linked to purchasing on the Website</li>
            <li>To fulfil legal obligations</li>
            <li>For defense in court.</li>
            <li>For the activation and execution purposes of the LOYALTY PROGRAM (for more information, see the General Sales Conditions published and on the Website, the so-called LOYALTY PROGRAM purposes).</li>
        </ol>
        
        <h3 className="text-gray-800 dark:text-gray-200">Special categories of personal data</h3>
        <p>Special categories of personal data are not subject to processing by North Sails. “Special categories” are understood, pursuant to article 9 of the GDPR, to be data that reveal: (i) racial or ethnic origin, (ii) political opinions, religious or philosophical convictions; (iii) trade union membership, (iv) genetic data and biometric data for the purpose of uniquely identifying a natural person; (v) data concerning a natural person’s health, sex life or sexual orientation. These categories of data are not processed via the North Sails Website.</p>
        
        <h3 className="text-gray-800 dark:text-gray-200">Data supply and consequences in the event of failure to consent to processing. Legal basis. Storage period of personal data</h3>
        <h4>To register with the Website</h4>
        <p>The supply of data to register with the Website is merely optional (letter a. of previous article 2.) However, since such processing is necessary to register with the Website, the user’s refusal to supply the data in question shall render registration with the Website impossible.The legal basis for this processing is North Sail’s legitimate interest in allowing the user to register with the Website. For this purpose, personal data shall be stored for as long as the user maintains their account active on the Website.</p>
        
        <h4>To purchase on the Website</h4>
        <p>The supply of data for the purpose of making purchases on the Website is merely optional (letter b. of the previous art. 2). However, since such processing is necessary to purchase one or more products on the Website, the user’s refusal to supply the data in question shall render making purchases on the Website impossible. The legal basis for this processing is North Sail’s obligation to execute a contract of which the user is a party. For this purpose the personal data shall be stored until the purchase order has been correctly executed.</p>

        <h4>To send marketing communications</h4>
        <p>The supply of data for the purpose of sending marketing communications is merely optional (letter c. of the previous art. 2). However, since such processing is necessary to allow such communications to be sent, the user’s refusal to supply the data in question shall render it impossible to send marketing communications. More specifically, please note that failure to consent shall not affect the possibility of registering with the Website and/or make purchases on the same but shall exclusively make it impossible to receive from North Sails information and promotional communications about products on sale on the Website (including the newsletter) by email. The legal basis for this processing is the user’s consent to receive marketing communications. For this purpose personal data shall be stored until the user withdraws consent. In any case the personal data shall be deleted if the user has not opened a marketing email in 24 months.</p>

        <h4>To send personal marketing communications (profiling)</h4>
        <p>The supply of data for the purpose of sending personalised marketing communications based on the user’s preferences expressed during navigation on the Website and/or online is merely optional. (letter d. of previous art. 2). However, since such processing is necessary to allow these communications, any refusal by the user to supply the data in question shall make it impossible to send personalised marketing communications. More specifically, please note that failure to consent shall not in any way affect the possibility of registering with the Website and/or make purchases on the same but shall exclusively make it impossible to receive from North Sails personalised information and promotional communications about products on sale on the Website (including the newsletter) by email. Therefore, lack of consent shall render it impossible for North Sails to collect data about the type and frequency of purchases made online in order to send information and/or advertising material of specific interest to the user by email. The legal basis for this processing is the user’s consent to receive personalised marketing communications. For this purpose personal data shall be stored until the user withdraws consent. In any case the personal data shall be deleted if the user has not opened a marketing email in 12 months.</p>

        <h4>To respond to user queries (customer care);</h4>
        <p>The supply of data in order to respond to user queries is merely optional (letter e. of previous article 2.) However, since such processing is necessary to respond to user queries, refusal to supply the data in question shall render customer care activities impossible. The legal basis for this processing is the legitimate interest of North Sails to provide customer care to the user. For this purpose the personal data shall be stored until the ticket has been closed or settled.</p>

        <h4>To send “abandoned shopping cart” communications</h4>
        <p>The supply of data for the purpose of sending “abandoned shopping cart” communications is merely optional (letter f. of the previous art. 2). However, since such processing is necessary to allow North Sails to send communications to the user to remind them to complete their purchase, refusal to supply the data in question shall render it impossible to send this type of communications. The legal basis for this processing is the legitimate interest of North Sails to send communications to the user reminding them to complete the purchase on the Website. For this purpose the personal data shall be stored so that no more than 3 “abandoned shopping cart” communications can be sent.</p>

        <h4>Proceed with the request for activation and execution of the LOYALTY PROGRAM.</h4>
        <p>The provision of data for the purpose of activating and executing the LOYALTY PROGRAM is optional and occurs simultaneously with the creation of the user account on the Website. However, since this processing is necessary to allow the activation and execution of the service, the user's possible refusal to provide the relevant data will make it impossible to join the LOYALTY PROGRAM. The legal basis for this processing is North Sails' legitimate interest in allowing the user to activate and execute the LOYALTY PROGRAM. For this purpose, personal data will be kept until the user keeps the account active on the Website.</p>

        <h4>To fulfil administration, accounting or tax obligations relating to purchases on the Website</h4>
        <p>The supply of data for the purpose of fulfilling administration, accounting or tax obligations related to purchases on the Website is merely optional (letter g. of the previous art. 2). However, since such processing is necessary to allow North Sails to fulfil these obligations, the user’s refusal to supply the data in question shall render it impossible to comply with the applicable law in force at the time. In this case North Sails reserves the right to claim from the user compensation for any damage suffered, for not being able to observe administration, accounting or tax obligations related to the user’s purchase on the Website. The legal basis for this processing is North Sail’s obligation to comply with the administration, accounting or tax laws applicable at the time. For this purpose the personal data shall be stored for the time required to comply with the above-mentioned obligations and for the time required by the applicable law at the time.</p>

        <h4>To fulfil legal obligations</h4>
        <p>The supply of data for the purpose of fulfilling legal obligations is merely optional (letter h. of previous article 2.) However, since such processing is necessary to allow North Sails to fulfil the legal obligations applicable at the time, the user’s refusal to supply the data in question shall render it impossible to comply with these obligations. In this case North Sails reserves the right to claim from the user compensation for any damage suffered for not being able to observe legal obligations. The legal basis for the processing is North Sail’s obligation to comply with the applicable law at the time. For this purpose the personal data shall be stored for the time required to comply with the above-mentioned obligations and for the time required by the applicable law at the time.</p>

        <h4>To defend its rights in court</h4>
        <p>The supply of data for the purpose of defending one’s rights in court is merely optional (lettera i. of the previous art. 2). However, since such processing is necessary to allow North Sails to defend its rights, the user’s refusal to supply the data in question shall render it impossible or difficult for North Sails to do so. The legal basis for this processing is the legitimate interest of North Sails to defend its rights before the Authority of jurisdiction. For this purpose the personal data shall be stored until the judgement or decision relating to the proceedings in which North Sails had to defend its rights becomes final.</p>

        <h3 className="text-gray-800 dark:text-gray-200">How to withdraw consent</h3>
        <p>The user may in any case withdraw the consent given for the purposes described in points (c) (marketing purposes) and (d) (profiling purposes) of art. 2: by contacting North Sails at the addresses listed in the previous art. 1; using the special link at the bottom of all promotional emails sent by North Sails. The user can, in any case, revoke any consent given for the purposes described in points (a) (so-called Website registration purposes) and (j) (so-called LOYALTY PROGRAM purposes) of Article 2: by deleting the created account.</p>

        <h3 className="text-gray-800 dark:text-gray-200">Scope of data communication</h3>
        <p>The personal data supplied by the user, for the purposes described in the previous art. 2, can be made known or communicated to the following subjects: employees and/or collaborators of North Sails for carrying out administration, accounting and IT and logistics activities working as data supervisors and persons in charge of processing; companies that manage online payment transactions; all public and/or private entities, natural and/or legal persons (legal, administration and tax consultancy firms) if communication is necessary or functional to the proper fulfilment of the contractual obligations undertaken in relation to the services provided via the Website, as well as legal obligations; all those entities (including Public Authorities) that have access to data in by virtue of regulatory or administrative measures; carriers and entities in charge of delivery and/or collection of the products purchased; companies that send, on behalf of North Sails, the newsletters and other communications. All the personal data supplied by the user in relation to registration with the Website and/or purchases through the Website are not disclosed. The updated list of the data supervisors and persons in charge of processing can be viewed at the Data Controller’s address.</p>

        <h3 className="text-gray-800 dark:text-gray-200">User rights</h3>
        <p>The user has the right to:</p>
        <ul>
            <li>a) obtain confirmation of the existence or otherwise of personal data that regards them and their communication in intelligible form; and withdraw consent at any time without prejudice to the lawfulness of the processing based on the consent granted before withdrawal;</li>
            <li>b) obtain information: about the origin of personal data, about processing purposes and methods, about the logic applied in the case of processing carried out using electronic tools; about the identification details of the Data controller; about the entities or categories of entity to which the data may be communicated or who may learn of the same as designated representatives in the State’s territory, data supervisors or persons in charge of processing;</li>
            <li>c) obtain: -the updating, rectification or integration of data concerning them; - the deletion, transformation in anonymous form or blocking of data unlawfully processed, including data whose storage is necessary for the purposes for which they were collected or then processed; - certification that the operations referred to in the previous points have been notified, also with regard to their content, to those to which the data have been communicated or disclosed, unless this requirement proves impossible or involves the use of a manifestly disproportionate method compared to the right to be protected; - the transferability of the data;</li>
            <li>d) object, wholly or partially: - on legitimate grounds, to the processing of the data that concerns them, even if still relevant to the purpose of the collection; - to the processing of the personal data concerning them for the purposes of commercial information or for sending advertising or direct sales material. The above rights may be exercised by making a request to the Data Controller, at the address listed in art. 1.</li>
        </ul>

        <h3 className="text-gray-800 dark:text-gray-200">Transfer of data to non-EU countries</h3>
        <p>The user’s personal data may be transferred to the USA pursuant to the European Commission’s Adequacy Decision of 10 July 2023, which established that USA law has an adequate level of privacy security. The transfer of data to the USA is necessary for the correct execution of purchase orders made on the Website.</p>

        <h3 className="text-gray-800 dark:text-gray-200">Updating of the privacy policy</h3>
        <p>The user is invited to read this privacy policy each time they make a purchase on the Website. In the event of one or more material changes to this privacy policy, North Sails shall notify the user by email.</p>
    </div>
);


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAppAuth();
  const firebaseAuth = useFirebaseAuth();

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
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(firebaseAuth, email, password);
          toast({
            title: 'Account Created',
            description: `A new account for ${email} has been created. Welcome!`,
          });
        } catch (createError: any) {
          console.error("Firebase Create User Error:", createError);
          toast({
            title: 'Account Creation Failed',
            description: createError.message,
            variant: 'destructive',
          });
        }
      } else {
        console.error("Firebase Auth Error:", error);
        let description = 'Could not process your login request.';
        if (error.code === 'auth/wrong-password') {
            description = 'Invalid password. Please check your credentials.';
        }
        toast({
          title: 'Authentication Failed',
          description,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isAuthenticated) {
    return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  const handleUserSelection = (selectedEmail: string) => {
      setEmail(selectedEmail);
      const newPassword = users[selectedEmail as keyof typeof users];
      if (newPassword) {
          setPassword(newPassword);
      }
  }

  return (
    <div className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url('/login-background.jpg')"}}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm text-card-foreground border-white/20">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <Logo className="size-10 text-white" />
                </div>
            <CardTitle className="text-2xl font-headline text-white">North Sails Minden Operations Dashboard</CardTitle>
            <CardDescription className="text-gray-300">Enter your credentials to access the dashboard.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label className="text-gray-300">Select a user to sign in as:</Label>
                <Select value={email} onValueChange={handleUserSelection}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly
                    className="bg-white/10 border-white/20 text-white"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">Password</Label>
                    <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                     className="bg-white/10 border-white/20 text-white"
                    />
                </div>
                </CardContent>
                <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" type="submit" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
                </CardFooter>
            </form>
        </Card>
        
        <div className="mt-8">
           <Dialog>
                <DialogTrigger asChild>
                    <Button variant="link" className="text-gray-300 hover:text-white">Privacy Policy</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Privacy Policy</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto pr-6">
                        <PrivacyPolicy />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button>Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

      </div>
    </div>
  );
}
