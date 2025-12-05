
"use client"

import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { InspectionMetadata } from './inspection-metadata';
import { LaminationVacuumMetrics } from './lamination-vacuum-metrics';
import { DefectScoring } from './defect-scoring';
import { ReinspectionOutcome } from './reinspection-outcome';
import { NewFoundDefects } from './new-found-defects';
import { DefectPictures } from './defect-pictures';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Card } from '../ui/card';
import { defectCategories } from '@/lib/qc-data';
import { FileDown } from 'lucide-react';

const temperatureSchema = z.object({
  head: z.coerce.number().optional(),
  tack: z.coerce.number().optional(),
  clew: z.coerce.number().optional(),
  belly_min: z.coerce.number().optional(),
  belly_max: z.coerce.number().optional(),
});

const laminationDefectSchema = z.object({
    present: z.boolean().default(false),
    description: z.string().optional(),
}).optional();


const severityArrayDefectSchema = z.array(z.object({
  severity: z.coerce.number().min(0).max(10),
})).max(6).optional();


const inspectionFormSchema = z.object({
  inspectionDate: z.date(),
  oeNumber: z.string().min(1, 'OE# is required.'),
  inspectorName: z.string().min(1, 'Inspector name is required.'),
  dpiType: z.enum(['<50000', '>50000']),
  laminationTemp: z.object({
    single: temperatureSchema.optional(),
    port: temperatureSchema.optional(),
    starboard: temperatureSchema.optional(),
  }),
  vacuumReadings: z.object({
    before: z.array(z.coerce.number().optional()).length(10),
    after: z.array(z.coerce.number().optional()).length(10),
  }),
  qcComments: z.string().optional(),
  attachments: z.any().optional(),
  
  defects: z.object({
    lamination: z.object(
        defectCategories.find(c => c.id === 'lamination')!.defects.reduce((acc, defect) => {
            acc[defect.key] = laminationDefectSchema;
            return acc;
        }, {} as Record<string, typeof laminationDefectSchema>)
    ),
    structural: z.object(
        defectCategories.find(c => c.id === 'structural')!.defects.reduce((acc, defect) => {
            acc[defect.key] = severityArrayDefectSchema;
            return acc;
        }, {} as Record<string, typeof severityArrayDefectSchema>)
    ),
    cosmetic: z.object(
         defectCategories.find(c => c.id === 'cosmetic')!.defects.reduce((acc, defect) => {
            acc[defect.key] = severityArrayDefectSchema;
            return acc;
        }, {} as Record<string, typeof severityArrayDefectSchema>)
    ),
  }),

  reinspection: z.object({
    finalOutcome: z.string().optional(),
    comments: z.string().optional(),
  }).optional(),
  
  newFoundDefects: z.array(z.object({
    panelNumber: z.string().optional(),
    scarfJoint: z.string().optional(),
    numberOfDefects: z.coerce.number().optional(),
    defectScore: z.coerce.number().optional(),
    comments: z.string().optional(),
  })).optional(),
  
  defectPictures: z.object({
    port: z.any().optional(),
    starboard: z.any().optional(),
    structural: z.any().optional(),
  }).optional(),
});

export type InspectionFormValues = z.infer<typeof inspectionFormSchema>;


export function ThreeDiInspectionForm() {
  const { toast } = useToast();
  const methods = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      inspectionDate: new Date(),
      oeNumber: '',
      inspectorName: '',
      dpiType: '<50000',
      vacuumReadings: {
        before: Array(10).fill(undefined),
        after: Array(10).fill(undefined),
      },
      defects: {
        lamination: {},
        structural: {},
        cosmetic: {},
      },
      newFoundDefects: [],
    },
  });

  const watchedDefects = useWatch({ control: methods.control, name: 'defects' });

  const totalScore = useMemo(() => {
    let score = 0;
    if (!watchedDefects) return 0;

    // Lamination defects with fixed scores
    const laminationDefects = watchedDefects.lamination;
    if (laminationDefects) {
        for (const defectKey in laminationDefects) {
            const defect = laminationDefects[defectKey as keyof typeof laminationDefects];
            if (defect?.present) {
                if (defectKey === 'pocketInstallation' || defectKey === 'noOverlapScarfJoint') {
                    score += 100;
                } else {
                    score += 61;
                }
            }
        }
    }

    // Structural and cosmetic defects with severity scores
    const otherCategories: ('structural' | 'cosmetic')[] = ['structural', 'cosmetic'];
    for (const categoryKey of otherCategories) {
        const category = watchedDefects[categoryKey];
        if (category) {
            for (const defectKey in category) {
                const entries = category[defectKey as keyof typeof category];
                if (Array.isArray(entries)) {
                    score += entries.reduce((sum, entry) => {
                        return sum + (Number(entry?.severity) || 0);
                    }, 0);
                }
            }
        }
    }

    return score;
  }, [watchedDefects]);


  const inspectionStatus = useMemo(() => {
    if (totalScore >= 100) return { text: 'Fail', color: 'bg-red-500 text-white' };
    if (totalScore >= 61) return { text: 'Reinspection Required', color: 'bg-yellow-400 text-black' };
    return { text: 'Pass', color: 'bg-green-500 text-white' };
  }, [totalScore]);

  const showReinspection = totalScore >= 61 && totalScore < 100;

  async function onSubmit(data: InspectionFormValues) {
    const submissionData = { 
        ...data, 
        inspectionDate: data.inspectionDate.toISOString(),
        totalScore, 
        status: inspectionStatus.text as 'Pass' | 'Reinspection Required' | 'Fail'
    };
    
    try {
      const response = await fetch('/api/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit inspection');
      }

      // Dynamically import the PDF generator only on the client-side
      const { generatePdf } = await import('@/lib/generate-qc-pdf');
      await generatePdf(data, { totalScore, statusText: inspectionStatus.text });
      
      toast({
        title: 'Inspection Submitted & PDF Generated',
        description: `OE# ${data.oeNumber} has been submitted with a score of ${totalScore}.`,
      });
      methods.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit inspection.",
      });
    }
  }

  const handleExportPdf = async () => {
    // Dynamically import the PDF generator only on the client-side
    const { generatePdf } = await import('@/lib/generate-qc-pdf');
    const data = methods.getValues();
    await generatePdf(data, { totalScore, statusText: inspectionStatus.text });
    toast({
        title: "PDF Generated",
        description: "Your QC report has been downloaded.",
    });
  }

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="sticky top-2 z-10 shadow-lg">
                <div className="p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold font-headline">Total Score: {totalScore}</h2>
                        <Badge className={cn("text-lg", inspectionStatus.color)}>{inspectionStatus.text}</Badge>
                    </div>
                     <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleExportPdf}>
                            <FileDown className="mr-2"/>
                            Export as PDF
                        </Button>
                        <Button type="submit" size="lg">Submit Inspection</Button>
                    </div>
                </div>
            </Card>

            <InspectionMetadata />
            <LaminationVacuumMetrics />
            <DefectScoring control={methods.control} />
            {showReinspection && <ReinspectionOutcome />}
            <Separator />
            <NewFoundDefects control={methods.control} />
            <DefectPictures />
        </form>
      </Form>
    </FormProvider>
  );
}
