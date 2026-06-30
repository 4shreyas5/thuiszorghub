import { z } from "zod";

export const createAssignmentSchema = z.object({
  employee_id: z.string().uuid("Employee is required"),
  client_id: z.string().uuid("Client is required"),
  assigned_from: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    "Start date is required and must be valid"
  ),
  assigned_until: z
    .string()
    .optional()
    .nullable()
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      "End date must be a valid date"
    ),
  is_primary: z.boolean().optional().default(false),
  notes: z
    .string()
    .max(5000, "Notes cannot exceed 5000 characters")
    .optional()
    .nullable(),
}).refine(
  (data) => {
    if (!data.assigned_until) return true;
    const from = new Date(data.assigned_from);
    const until = new Date(data.assigned_until);
    return until >= from;
  },
  {
    message: "End date must be on or after start date",
    path: ["assigned_until"],
  }
);

export const updateAssignmentSchema = z.object({
  employee_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  assigned_from: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Start date must be valid")
    .optional(),
  assigned_until: z
    .string()
    .optional()
    .nullable()
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      "End date must be a valid date"
    ),
  is_primary: z.boolean().optional(),
  notes: z
    .string()
    .max(5000, "Notes cannot exceed 5000 characters")
    .optional()
    .nullable(),
}).refine(
  (data) => {
    if (!data.assigned_from || !data.assigned_until) return true;
    const from = new Date(data.assigned_from);
    const until = new Date(data.assigned_until);
    return until >= from;
  },
  {
    message: "End date must be on or after start date",
    path: ["assigned_until"],
  }
);

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
