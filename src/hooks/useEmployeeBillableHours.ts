import { useEffect, useState, useCallback } from 'react';

interface TimesheetSummary {
  employeeId: string;
  totalBillableHours: number;
  unbilledHours: number;
  totalRevenue: number;
  unbilledRevenue: number;
  timesheetCount: number;
}

export function useEmployeeBillableHours(employeeId: string, startDate?: string, endDate?: string) {
  const [summary, setSummary] = useState<TimesheetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimesheets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        employeeId,
        limit: '1000',
        offset: '0',
      });

      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);

      const response = await globalThis.fetch(`/api/billing/timesheets?${query}`);

      if (!response.ok) {
        throw new Error('Failed to fetch timesheets');
      }

      const data = await response.json();
      const timesheets = data.data || [];

      let totalBillableHours = 0;
      let unbilledHours = 0;
      let totalRevenue = 0;
      let unbilledRevenue = 0;

      timesheets.forEach((ts: any) => {
        const revenue = ts.billable_hours * ts.hourly_rate;
        totalBillableHours += ts.billable_hours;
        totalRevenue += revenue;

        if (!ts.is_billed) {
          unbilledHours += ts.billable_hours;
          unbilledRevenue += revenue;
        }
      });

      setSummary({
        employeeId,
        totalBillableHours,
        unbilledHours,
        totalRevenue,
        unbilledRevenue,
        timesheetCount: timesheets.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId, startDate, endDate]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  return { summary, loading, error, refetch: fetchTimesheets };
}
