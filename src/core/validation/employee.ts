import { z } from "zod";

export const employmentTypeEnum = z.enum(["full-time", "part-time", "contract", "casual"]);

export const createEmployeeSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  email: z
    .string()
    .email("Invalid email address"),
  phone: z
    .string()
    .regex(/^[\d\s\-+()]*$/, "Invalid phone number")
    .optional(),
  branch_id: z
    .string()
    .min(1, "Branch is required")
    .uuid("Invalid branch ID"),
  employment_type: employmentTypeEnum,
  start_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  end_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid end date")
    .optional(),
  hourly_rate: z
    .number()
    .optional()
    .refine((val) => !val || val > 0, "Hourly rate must be greater than 0"),
  bio: z
    .string()
    .max(1000, "Bio must be less than 1000 characters")
    .optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
