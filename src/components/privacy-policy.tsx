
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "./ui/button"

export function PrivacyPolicy() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-white/80 hover:text-white">Privacy Policy</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
        </DialogHeader>
        <div className="prose prose-sm dark:prose-invert max-h-[70vh] overflow-y-auto pr-4 text-sm text-muted-foreground space-y-4">
            <p>Information about personal data processing. In force since 26 September 2023.</p>
            <p>This information is provided pursuant to Regulation (EU) 2016/679 of the European Parliament and Council of 27 April 2016 about the protection of personal data (GDPR) and illustrates how the personal data given on this website are processed.</p>
            
            <h3 className="font-semibold text-foreground">Data Controller.</h3>
            <p>North Sails GmbH - Harkortstraße 79, 22765 Hamburg - DE814864953, Email: webcustomercare@northsail.com, share capital, 33.750,00 Euro, Telephone +39 0185200555, (telephone number active from Monday to Friday, from 09.00 to 18.00) (North Sails) in relation to personal data given by the user on the website www.northsails.com (Website).</p>
            
            <h3 className="font-semibold text-foreground">Purpose of the processing.</h3>
            <p>North Sails shall process personal data provided by the user for the following purposes:</p>
            <ol className="list-decimal list-inside space-y-2">
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

            <h3 className="font-semibold text-foreground">Special categories of personal data</h3>
            <p>Special categories of personal data are not subject to processing by North Sails. “Special categories” are understood, pursuant to article 9 of the GDPR, to be data that reveal: (i) racial or ethnic origin, (ii) political opinions, religious or philosophical convictions; (iii) trade union membership, (iv) genetic data and biometric data for the purpose of uniquely identifying a natural person; (v) data concerning a natural person’s health, sex life or sexual orientation. These categories of data are not processed via the North Sails Website.</p>

            <h3 className="font-semibold text-foreground">Data supply and consequences in the event of failure to consent to processing. Legal basis. Storage period of personal data</h3>
            <p>To register with the Website: The supply of data to register with the Website is merely optional (letter a. of previous article 2.) However, since such processing is necessary to register with the Website, the user’s refusal to supply the data in question shall render registration with the Website impossible.The legal basis for this processing is North Sail’s legitimate interest in allowing the user to register with the Website. For this purpose, personal data shall be stored for as long as the user maintains their account active on the Website.</p>
            
            <h3 className="font-semibold text-foreground">How to withdraw consent</h3>
            <p>The user may in any case withdraw the consent given for the purposes described in points (c) (marketing purposes) and (d) (profiling purposes) of art. 2: by contacting North Sails at the addresses listed in the previous art. 1; using the special link at the bottom of all promotional emails sent by North Sails. The user can, in any case, revoke any consent given for the purposes described in points (a) (so-called Website registration purposes) and (j) (so-called LOYALTY PROGRAM purposes) of Article 2: by deleting the created account.</p>

            <h3 className="font-semibold text-foreground">Scope of data communication</h3>
            <p>The personal data supplied by the user, for the purposes described in the previous art. 2, can be made known or communicated to the following subjects: employees and/or collaborators of North Sails for carrying out administration, accounting and IT and logistics activities working as data supervisors and persons in charge of processing; companies that manage online payment transactions; all public and/or private entities, natural and/or legal persons (legal, administration and tax consultancy firms) if communication is necessary or functional to the proper fulfilment of the contractual obligations undertaken in relation to the services provided via the Website, as well as legal obligations; all those entities (including Public Authorities) that have access to data in by virtue of regulatory or administrative measures; carriers and entities in charge of delivery and/or collection of the products purchased; companies that send, on behalf of North Sails, the newsletters and other communications. All the personal data supplied by the user in relation to registration with the Website and/or purchases through the Website are not disclosed. The updated list of the data supervisors and persons in charge of processing can be viewed at the Data Controller’s address.</p>

            <h3 className="font-semibold text-foreground">User rights</h3>
            <p>The user has the right to: a) obtain confirmation of the existence or otherwise of personal data that regards them and their communication in intelligible form; and withdraw consent at any time without prejudice to the lawfulness of the processing based on the consent granted before withdrawal; b) obtain information: - about the origin of personal data, about processing purposes and methods, about the logic applied in the case of processing carried out using electronic tools; - about the identification details of the Data controller; - about the entities or categories of entity to which the data may be communicated or who may learn of the same as designated representatives in the State’s territory, data supervisors or persons in charge of processing; c) obtain: -the updating, rectification or integration of data concerning them; - the deletion, transformation in anonymous form or blocking of data unlawfully processed, including data whose storage is necessary for the purposes for which they were collected or then processed; - certification that the operations referred to in the previous points have been notified, also with regard to their content, to those to which the data have been communicated or disclosed, unless this requirement proves impossible or involves the use of a manifestly disproportionate method compared to the right to be protected; - the transferability of the data; d) object, wholly or partially: - on legitimate grounds, to the processing of the data that concerns them, even if still relevant to the purpose of the collection; - to the processing of the personal data concerning them for the purposes of commercial information or for sending advertising or direct sales material. The above rights may be exercised by making a request to the Data Controller, at the address listed in art. 1.</p>

            <h3 className="font-semibold text-foreground">Transfer of data to non-EU countries</h3>
            <p>The user’s personal data may be transferred to the USA pursuant to the European Commission’s Adequacy Decision of 10 July 2023, which established that USA law has an adequate level of privacy security. The transfer of data to the USA is necessary for the correct execution of purchase orders made on the Website.</p>

            <h3 className="font-semibold text-foreground">Updating of the privacy policy</h3>
            <p>The user is invited to read this privacy policy each time they make a purchase on the Website. In the event of one or more material changes to this privacy policy, North Sails shall notify the user by email.</p>
        </div>
        <DialogFooter>
            <DialogClose asChild>
            <Button>Close</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
