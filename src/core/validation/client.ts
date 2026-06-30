import { z } from "zod";

export const caseStatusEnum = z.enum(["active", "inactive", "discharged"]);
export const riskLevelEnum = z.enum(["low", "medium", "high"]);

export const createClientSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  date_of_birth: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date of birth")
    .refine((date) => new Date(date) < new Date(), "Date of birth cannot be in the future")
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^[\d\s\-+()]*$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  branch_id: z
    .string()
    .min(1, "Branch is required")
    .uuid("Invalid branch ID"),
  case_status: caseStatusEnum,
  risk_level: riskLevelEnum.optional(),
  emergency_contact_name: z
    .string()
    .max(150, "Emergency contact name must be less than 150 characters")
    .optional()
    .or(z.literal("")),
  emergency_contact_phone: z
    .string()
    .regex(/^[\d\s\-+()]*$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(5000, "Notes must be less than 5000 characters")
    .optional()
    .or(z.literal("")),
  address_line_1: z
    .string()
    .max(255, "Address line 1 must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  address_line_2: z
    .string()
    .max(255, "Address line 2 must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  postal_code: z
    .string()
    .max(20, "Postal code must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .max(100, "City must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  country: z
    .string()
    .max(100, "Country must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  insurance_provider: z
    .string()
    .max(200, "Insurance provider must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  policy_number: z
    .string()
    .max(100, "Policy number must be less than 100 characters")
    .optional()
    .or(z.literal("")),
});

export const updateClientSchema = createClientSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
