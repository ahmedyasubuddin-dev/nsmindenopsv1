
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

function SmsNotificationDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary">SMS Notification Policy</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>SMS Notification and Privacy Policy</DialogTitle>
                </DialogHeader>
                <div className="prose prose-sm dark:prose-invert max-h-[70vh] overflow-y-auto pr-4 text-sm text-muted-foreground space-y-4">
                    <p>North Sails LLC. ("we," "our," or "us") is committed to protecting the privacy of our employees and ensuring compliance with applicable laws. As part of our operations, we utilize SMS notifications through our Computerized Maintenance Management System (CMMS), powered by Afisol (Pvt) Ltd., to communicate maintenance-related updates, requests, and other operational alerts to our maintenance employees.</p>
                    <p>By consenting to receive SMS notifications, you acknowledge and agree to the following terms:</p>
                    
                    <h3 className="font-semibold text-foreground">Purpose of SMS Notifications:</h3>
                    <p>We will send SMS messages to notify you about maintenance tasks, updates, or operational alerts related to your role. These SMS messages are transactional in nature and are crucial to the timely and efficient execution of maintenance operations within the company.</p>
                    
                    <h3 className="font-semibold text-foreground">Data Collection:</h3>
                    <p>We collect and store your mobile phone number exclusively for the purpose of sending SMS notifications. We do not share this information with third parties unless required by law or for the operational purposes stated above. Your data will not be sold.</p>
                    
                    <h3 className="font-semibold text-foreground">Opt-In and Opt-Out:</h3>
                    <p>By providing your mobile phone number, you explicitly consent to receive SMS notifications related to your maintenance responsibilities. You may opt out of receiving these SMS notifications at any time by replying "STOP" to any message or by contacting us directly at [contact details]. Please note that opting out may affect your ability to receive important maintenance updates.</p>

                    <h3 className="font-semibold text-foreground">Data Security:</h3>
                    <p>We employ industry-standard encryption and security measures to protect your contact information and ensure it remains confidential. Your personal information will only be accessible to authorized personnel who are responsible for maintenance operations.</p>

                    <h3 className="font-semibold text-foreground">Data Retention and Deletion:</h3>
                    <p>We retain your contact information for as long as necessary to send SMS notifications related to maintenance operations. Upon termination of your employment or upon request, we will securely delete your personal information in compliance with our retention policy.</p>

                    <h3 className="font-semibold text-foreground">Compliance with Laws:</h3>
                    <p>We comply with the Telephone Consumer Protection Act (TCPA), applicable Nevada Telemarketing Laws (NRS 228.500-228.515), and any other relevant federal and state laws concerning SMS notifications. You have the right to request access to, correct, or request the deletion of your personal data at any time. Please contact us at it@3dl.northsails.com for further assistance.</p>
                    
                    <h3 className="font-semibold text-foreground">Third-Party Services:</h3>
                    <p>Our CMMS software is provided by Afisol (Pvt) Ltd.. Afisol acts as a data processor and is bound by strict data protection agreements. Any data shared with Afisol will only be used for the sole purpose of delivering SMS notifications and maintaining the CMMS system. Afisol will not use your personal data for any other purpose.</p>
                    
                    <h3 className="font-semibold text-foreground">Right to Opt-Out:</h3>
                    <p>In compliance with Nevada state law, you may opt out of receiving SMS notifications at any time. To unsubscribe from SMS communications, reply "STOP" to any message, or contact us at brian.loshbough@northsails.com. We will promptly stop sending notifications upon your request.</p>

                    <p>If you have any questions or concerns about our SMS notification system or how we handle your personal information, please contact us at it@3dl.northsails.com.</p>
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

export function PrivacyPolicy() {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
        <p>By signing in, you acknowledge and agree to our</p>
        <div className="flex gap-4 justify-center">
            <SmsNotificationDialog />
            <a href="https://www.northsails.com/en-us/pages/faq-privacy-policy" target="_blank" rel="noopener noreferrer" className="p-0 h-auto text-muted-foreground hover:text-primary underline">
                Privacy Policy
            </a>
            <a href="https://www.northsails.com/en-us/pages/faq-general-terms-conditions" target="_blank" rel="noopener noreferrer" className="p-0 h-auto text-muted-foreground hover:text-primary underline">
                Terms & Conditions
            </a>
        </div>
    </div>
  )
}
