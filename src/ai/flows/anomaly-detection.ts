// Anomaly detection flow to analyze storage records and identify anomalies.

'use server';

/**
 * @fileOverview An anomaly detection AI agent for warehouse storage records.
 *
 * - detectStorageAnomalies - A function that detects anomalies in storage records.
 * - AnomalyDetectionInput - The input type for the detectStorageAnomalies function.
 * - AnomalyDetectionOutput - The return type for the detectStorageAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnomalyDetectionInputSchema = z.object({
  storageRecords: z
    .string()
    .describe('A list of storage records in JSON format, including customer ID, commodity ID, bags stored, storage start date, and storage end date.'),
});
export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionInputSchema>;

const AnomalyDetectionOutputSchema = z.object({
  anomalies: z
    .string()
    .describe('A description of any anomalies detected in the storage records, including unusually long storage durations or large quantities.'),
});
export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;

export async function detectStorageAnomalies(
  input: AnomalyDetectionInput
): Promise<AnomalyDetectionOutput> {
  return detectStorageAnomaliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'anomalyDetectionPrompt',
  input: {schema: AnomalyDetectionInputSchema},
  output: {schema: AnomalyDetectionOutputSchema},
  prompt: `You are an expert warehouse manager specializing in identifying anomalies in storage records.

You will analyze the provided storage records and identify any unusual patterns or anomalies, such as unusually long storage durations or large quantities.

Provide a clear and concise description of any anomalies detected.

Storage Records:
{{{storageRecords}}}`,
});

const detectStorageAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectStorageAnomaliesFlow',
    inputSchema: AnomalyDetectionInputSchema,
    outputSchema: AnomalyDetectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
