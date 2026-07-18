/** Shape returned by GET /api/visits/dashboard (summary portion). */
export interface VisitsDashboardSummary {
  total_visits: number;
  completed_visits: number;
  in_progress_visits: number;
  pending_visits: number;
  overdue_visits: number;
  average_visit_duration_minutes: number;
  completion_rate: number;
}
