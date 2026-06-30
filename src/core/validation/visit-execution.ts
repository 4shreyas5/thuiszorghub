import { z } from "zod";

export const startVisitSchema = z.object({
  actual_start_time: z.string().refine(
    (time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time),
    "Start time must be in HH:MM format"
  ),
});

export const completeTaskSchema = z.object({
  care_plan_task_id: z.string().uuid("Task ID is required"),
  status: z.enum(["completed", "skipped", "partially_completed"]),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
  skipped_reason: z.string().max(500, "Skipped reason cannot exceed 500 characters").optional(),
});

export const recordMedicationSchema = z.object({
  medication_name: z.string().min(1, "Medication name is required").max(255),
  prescribed_dosage: z.string().max(100).optional(),
  administered_dosage: z.string().max(100).optional(),
  status: z.enum(["given", "not_given", "refused", "unavailable", "late"]),
  not_given_reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const saveVisitNoteSchema = z.object({
  category: z.enum(["observation", "incident", "mood", "pain", "vitals", "recommendation"]),
  content: z.string().min(1, "Content is required").max(5000),
  mood_score: z.number().min(1).max(10).optional(),
  pain_score: z.number().min(0).max(10).optional(),
  vital_signs: z.record(z.string()).optional(),
  recommendations: z.string().max(2000).optional(),
});

export const completeVisitSchema = z.object({
  actual_end_time: z.string().refine(
    (time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time),
    "End time must be in HH:MM format"
  ),
  notes: z.string().min(1, "Completion notes are required").max(2000),
  summary: z.string().max(500).optional(),
});

export type StartVisitInput = z.infer<typeof startVisitSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type RecordMedicationInput = z.infer<typeof recordMedicationSchema>;
export type SaveVisitNoteInput = z.infer<typeof saveVisitNoteSchema>;
export type CompleteVisitInput = z.infer<typeof completeVisitSchema>;
