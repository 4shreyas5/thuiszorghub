import { z } from "zod";

export const createVisitSchema = z.object({
  client_id: z.string().uuid("Client is required"),
  employee_id: z.string().uuid("Employee is required").optional().nullable(),
  branch_id: z.string().uuid("Branch is required"),
  care_plan_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1, "Title is required").max(200, "Title cannot exceed 200 characters"),
  visit_type: z.enum(["personal_care", "medication", "companionship", "nursing", "cleaning", "household", "assessment", "custom"]),
  description: z.string().max(5000, "Description cannot exceed 5000 characters").optional().nullable(),
  scheduled_date: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    "Visit date is required and must be valid"
  ),
  start_time: z.string().refine(
    (time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time),
    "Start time must be in HH:MM format"
  ),
  end_time: z.string().refine(
    (time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time),
    "End time must be in HH:MM format"
  ),
  estimated_duration_minutes: z.number().int().positive().optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
  notes: z.string().max(5000, "Notes cannot exceed 5000 characters").optional().nullable(),
}).refine(
  (data) => {
    const startTime = new Date(`2000-01-01T${data.start_time}`);
    const endTime = new Date(`2000-01-01T${data.end_time}`);
    return endTime > startTime;
  },
  {
    message: "End time must be after start time",
    path: ["end_time"],
  }
);

export const updateVisitSchema = z.object({
  client_id: z.string().uuid().optional(),
  employee_id: z.string().uuid().optional().nullable(),
  branch_id: z.string().uuid().optional(),
  care_plan_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1, "Title is required").max(200).optional(),
  visit_type: z.enum(["personal_care", "medication", "companionship", "nursing", "cleaning", "household", "assessment", "custom"]).optional(),
  description: z.string().max(5000).optional().nullable(),
  scheduled_date: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    "Visit date must be valid"
  ).optional(),
  start_time: z.string().refine(
    (time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time),
    "Start time must be in HH:MM format"
  ).optional(),
  end_time: z.string().refine(
    (time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time),
    "End time must be in HH:MM format"
  ).optional(),
  estimated_duration_minutes: z.number().int().positive().optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  status: z.enum(["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]).optional(),
  notes: z.string().max(5000).optional().nullable(),
}).refine(
  (data) => {
    if (!data.start_time || !data.end_time) return true;
    const startTime = new Date(`2000-01-01T${data.start_time}`);
    const endTime = new Date(`2000-01-01T${data.end_time}`);
    return endTime > startTime;
  },
  {
    message: "End time must be after start time",
    path: ["end_time"],
  }
);

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
