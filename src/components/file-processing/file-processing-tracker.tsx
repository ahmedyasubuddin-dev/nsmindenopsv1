
"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addOeJob } from '@/lib/data-store';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { useFirestore } from '@/firebase';

const sectionSchema = z.object({
  sectionId: z.string().min(1, 'Sail # is required.').length(3, 'Must be 3 digits.'),
  panelStart: z.coerce.number().min(1, 'Start panel is required.'),
  panelEnd: z.coerce.number().min(1, 'End panel is required.'),
});

const oeTrackerSchema = z.object({
  oeBase: z.string().min(1, 'OE Number is required.'),
  sections: z.array(sectionSchema).min(1, 'At least one sail must be added.'),
}).refine(data => {
    // Check that panelEnd is greater than or equal to panelStart for all sections
    return data.sections.every(section => section.panelEnd >= section.panelStart);
}, {
    message: "End panel must be greater than or equal to start panel.",
    path: ["sections"], // General path, specific pathing is harder here
})
.refine(data => {
    // Check for overlapping panel ranges
    if (data.sections.length < 2) return true;
    const sortedSections = [...data.sections].sort((a, b) => a.panelStart - b.panelStart);
    for (let i = 0; i < sortedSections.length - 1; i++) {
        if (sortedSections[i].panelEnd >= sortedSections[i+1].panelStart) {
            return false; // Overlap detected
        }
    }
    return true;
}, {
    message: "Panel ranges cannot overlap between sails.",
    path: ["sections"],
});


type OeTrackerFormValues = z.infer<typeof oeTrackerSchema>;

export function FileProcessingTracker() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewData, setReviewData] = useState<OeTrackerFormValues | null>(null);

  const form = useForm<OeTrackerFormValues>({
    resolver: zodResolver(oeTrackerSchema),
    defaultValues: {
      oeBase: '',
      sections: [],
    },
     mode: "onBlur",
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'sections',
  });

  const onReview = (data: OeTrackerFormValues) => {
    setReviewData(data);
    setIsReviewing(true);
  };
  
  const onFinalSubmit = async () => {
    if (!reviewData) return;
    
    addOeJob(firestore, {
      oeBase: reviewData.oeBase,
      sections: reviewData.sections.map(s => ({
        sectionId: s.sectionId,
        panelStart: s.panelStart,
        panelEnd: s.panelEnd,
      })),
    });
    
    toast({
      title: 'OE Job Initialized',
      description: `Job for ${reviewData.oeBase} has been created and saved to Firestore.`,
    });
    
    setIsReviewing(false);
    setReviewData(null);
    form.reset();
    replace([]);
  };
  
  const calculateTotalPanels = (sections: OeTrackerFormValues['sections'] = []) => {
      return sections.reduce((total, section) => {
          if (section.panelStart && section.panelEnd && section.panelEnd >= section.panelStart) {
              return total + (section.panelEnd - section.panelStart + 1);
          }
          return total;
      }, 0);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>OE & Sail Initialization</CardTitle>
          <CardDescription>
            Register a new OE and define its sails by specifying panel ranges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onReview)} className="space-y-8">
              <FormField
                  control={form.control}
                  name="oeBase"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>OE Number</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., OAUS32162" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
              />
              
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-medium">Sails for this OE</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => append({ sectionId: '', panelStart: 0, panelEnd: 0 })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Sail
                  </Button>
                </div>
                 {form.formState.errors.sections && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {form.formState.errors.sections.message || form.formState.errors.sections.root?.message}
                      </AlertDescription>
                    </Alert>
                )}
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md bg-muted/30">
                     <div className='flex items-end gap-2 flex-grow'>
                        <div className="font-medium text-muted-foreground text-sm self-center pb-2">
                          {form.getValues('oeBase') || 'OE...'} -
                        </div>
                        <FormField
                            control={form.control}
                            name={`sections.${index}.sectionId`}
                            render={({ field: sectionField }) => (
                            <FormItem className="w-32">
                                <FormLabel>Sail #</FormLabel>
                                <FormControl>
                                <Input placeholder="001" {...sectionField} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                     </div>
                     <FormField
                        control={form.control}
                        name={`sections.${index}.panelStart`}
                        render={({ field: panelField }) => (
                            <FormItem className="w-32">
                                <FormLabel>Panel Start</FormLabel>
                                <FormControl><Input type="number" placeholder="e.g. 1" {...panelField} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                     />
                      <FormField
                        control={form.control}
                        name={`sections.${index}.panelEnd`}
                        render={({ field: panelField }) => (
                            <FormItem className="w-32">
                                <FormLabel>Panel End</FormLabel>
                                <FormControl><Input type="number" placeholder="e.g. 10" {...panelField} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                     />

                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={fields.length === 0}>
                  Initialize OE Job
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog open={isReviewing} onOpenChange={setIsReviewing}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Review OE Initialization</AlertDialogTitle>
                <AlertDialogDescription>
                    Please confirm the details for OE: <span className="font-bold text-primary">{reviewData?.oeBase}</span>
                </AlertDialogDescription>
            </AlertDialogHeader>
            {reviewData && (
                <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                     <Card className="bg-muted/50">
                        <CardHeader className="p-4">
                            <CardDescription>Total Panels</CardDescription>
                            <CardTitle className="text-3xl">{calculateTotalPanels(reviewData.sections)}</CardTitle>
                        </CardHeader>
                     </Card>
                    
                    <div>
                        <h4 className="font-semibold mb-2">Panel Distribution</h4>
                        <div className="space-y-2">
                            {reviewData.sections.map((section, index) => (
                                <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                                    <span className="font-mono font-medium">
                                        {reviewData.oeBase}-{section.sectionId}
                                    </span>
                                    <Badge variant="secondary">
                                        P{section.panelStart} to P{section.panelEnd}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsReviewing(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onFinalSubmit}>Confirm & Initialize</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
