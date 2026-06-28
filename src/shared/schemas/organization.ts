import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(200),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  primaryLanguage: z.enum(["en", "nl"]),
  timezone: z.string().min(1, "Timezone is required"),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export const organizationSettingsSchema = z.object({
  dateFormat: z.string().min(1),
  timeFormat: z.enum(["12h", "24h"]),
  currency: z.string().length(3),
  workWeekStart: z.number().min(0).max(6),
  defaultVisitDuration: z.number().min(15).max(480),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;
