import { z } from "zod";

export const createCarePlanSchema = z.object({
  client_id: z.string().uuid("Invalid client ID"),
  branch_id: z.string().uuid("Invalid branch ID"),
  primary_caregiver_id: z.string().uuid("Invalid caregiver ID").optional().or(z.literal("")),
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters"),
  description: z.string().max(5000).optional().or(z.literal("")),
  assessment_notes: z.string().max(5000).optional().or(z.literal("")),
  status: z.enum(["draft", "active", "on_hold", "completed", "archived"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  start_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid start date"),
  review_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid review date").optional().or(z.literal("")),
  end_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid end date").optional().or(z.literal("")),
});

export const updateCarePlanSchema = createCarePlanSchema.partial();

export const createGoalSchema = z.object({
  care_plan_id: z.string().uuid("Invalid care plan ID"),
  goal_statement: z.string().min(1, "Goal statement is required").max(500, "Goal statement must be under 500 characters"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  target_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid target date").optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const updateGoalSchema = z.object({
  goal_statement: z.string().min(1).max(500).optional().or(z.literal("")),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  target_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid target date").optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  completion_percentage: z.number().min(0).max(100).optional(),
  status: z.enum(["active", "completed", "archived", "paused"]).optional(),
});

export const createTaskSchema = z.object({
  care_plan_id: z.string().uuid("Invalid care plan ID"),
  task_title: z.string().min(1, "Task title is required").max(200, "Task title must be under 200 characters"),
  task_type: z.enum(["care", "medication", "assessment", "therapy", "social", "other"]),
  time_category: z.enum(["morning", "afternoon", "evening", "night", "prn", "custom"]),
  estimated_duration_minutes: z.number().min(0).optional(),
  instructions: z.string().max(2000).optional().or(z.literal("")),
  is_checklist: z.boolean().optional(),
  checklist_items: z.any().optional(),
  assigned_to_employee_id: z.string().uuid("Invalid employee ID").optional().or(z.literal("")),
  start_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid start date"),
  end_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid end date").optional().or(z.literal("")),
  frequency: z.string().max(100).optional().or(z.literal("")),
});

export const updateTaskSchema = createTaskSchema.partial();

export const createReviewSchema = z.object({
  care_plan_id: z.string().uuid("Invalid care plan ID"),
  scheduled_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid scheduled date"),
  outcome: z.string().max(2000).optional().or(z.literal("")),
  recommendations: z.string().max(2000).optional().or(z.literal("")),
});

export const completeReviewSchema = z.object({
  outcome: z.string().max(2000).optional().or(z.literal("")),
  recommendations: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
});
