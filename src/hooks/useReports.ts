import { useEffect, useState, useCallback } from "react";

interface ReportFilters {
  startDate?: string | undefined;
  endDate?: string | undefined;
  branchId?: string | undefined;
  employeeId?: string | undefined;
  clientId?: string | undefined;
  visitType?: string | undefined;
  status?: string | undefined;
  riskLevel?: string | undefined;
}

interface OperationalReport {
  totalScheduled: number;
  completionRate: number;
  completed: number;
  cancelled: number;
  noShows: number;
  avgDuration: number;
  uniqueEmployees: number;
  uniqueClients: number;
  assignmentCount: number;
  visitsByDay: Record<string, number>;
  visitsByBranch: Record<string, number>;
  visitsByEmployee: Record<string, number>;
}

interface FinancialReport {
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  invoiceCount: number;
  avgInvoiceValue: number;
  invoiceAging: Record<string, number>;
  paymentsByMethod: Record<string, number>;
  revenueByBranch: Record<string, number>;
  topClients: [string, number][];
  revenueTrend: Record<string, number>;
  statusDistribution: Record<string, number>;
}

interface EmployeeReport {
  employeeMetrics: Record<string, unknown>;
  summary: {
    activeEmployees: number;
    totalEmployees: number;
    totalBillableHours: number;
    totalCompletedVisits: number;
    totalCancelledVisits: number;
    avgUtilizationPercent: number;
  };
}

interface ClientReport {
  clientMetrics: Record<string, unknown>;
  summary: {
    activeClients: number;
    totalClients: number;
    completedVisits: number;
    missedVisits: number;
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    activePlans: number;
    riskDistribution: Record<string, number>;
  };
}

interface BranchReport {
  branchMetrics: Record<string, unknown>;
  summary: {
    totalBranches: number;
    totalRevenue: number;
    totalEmployees: number;
    totalClients: number;
    totalVisits: number;
  };
}

interface CarePlanReport {
  carePlanMetrics: Record<string, unknown>;
  summary: {
    totalPlans: number;
    activePlans: number;
    completedPlans: number;
    draftPlans: number;
    statusDistribution: Record<string, number>;
    totalGoals: number;
    completedGoals: number;
    outstandingGoals: number;
    totalTasks: number;
    completedTasks: number;
    skippedTasks: number;
    totalReviews: number;
    completedReviews: number;
    overdueReviews: number;
    reviewCompliancePercent: number;
  };
}

export function useOperationalReport(filters?: ReportFilters, enabled = true) {
  const [data, setData] = useState<OperationalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (filters?.startDate) query.append("startDate", filters.startDate);
      if (filters?.endDate) query.append("endDate", filters.endDate);
      if (filters?.branchId) query.append("branchId", filters.branchId);
      if (filters?.employeeId) query.append("employeeId", filters.employeeId);
      if (filters?.clientId) query.append("clientId", filters.clientId);
      if (filters?.visitType) query.append("visitType", filters.visitType);
      if (filters?.status) query.append("status", filters.status);

      const response = await globalThis.fetch(`/api/reports/operational?${query}`);
      if (!response.ok) throw new Error("Failed to fetch report");

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!enabled) return;
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetch();
    });
  }, [fetch, enabled]);

  return { data, loading, error, refetch: fetch };
}

export function useFinancialReport(filters?: ReportFilters, enabled = true) {
  const [data, setData] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (filters?.startDate) query.append("startDate", filters.startDate);
      if (filters?.endDate) query.append("endDate", filters.endDate);
      if (filters?.branchId) query.append("branchId", filters.branchId);
      if (filters?.clientId) query.append("clientId", filters.clientId);

      const response = await globalThis.fetch(`/api/reports/financial?${query}`);
      if (!response.ok) throw new Error("Failed to fetch report");

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!enabled) return;
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetch();
    });
  }, [fetch, enabled]);

  return { data, loading, error, refetch: fetch };
}

export function useEmployeeReport(filters?: ReportFilters, enabled = true) {
  const [data, setData] = useState<EmployeeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (filters?.startDate) query.append("startDate", filters.startDate);
      if (filters?.endDate) query.append("endDate", filters.endDate);
      if (filters?.employeeId) query.append("employeeId", filters.employeeId);
      if (filters?.branchId) query.append("branchId", filters.branchId);

      const response = await globalThis.fetch(`/api/reports/employees?${query}`);
      if (!response.ok) throw new Error("Failed to fetch report");

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!enabled) return;
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetch();
    });
  }, [fetch, enabled]);

  return { data, loading, error, refetch: fetch };
}

export function useClientReport(filters?: ReportFilters, enabled = true) {
  const [data, setData] = useState<ClientReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (filters?.startDate) query.append("startDate", filters.startDate);
      if (filters?.endDate) query.append("endDate", filters.endDate);
      if (filters?.clientId) query.append("clientId", filters.clientId);
      if (filters?.branchId) query.append("branchId", filters.branchId);
      if (filters?.riskLevel) query.append("riskLevel", filters.riskLevel);

      const response = await globalThis.fetch(`/api/reports/clients?${query}`);
      if (!response.ok) throw new Error("Failed to fetch report");

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!enabled) return;
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetch();
    });
  }, [fetch, enabled]);

  return { data, loading, error, refetch: fetch };
}

export function useBranchReport(filters?: ReportFilters, enabled = true) {
  const [data, setData] = useState<BranchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (filters?.startDate) query.append("startDate", filters.startDate);
      if (filters?.endDate) query.append("endDate", filters.endDate);
      if (filters?.branchId) query.append("branchId", filters.branchId);

      const response = await globalThis.fetch(`/api/reports/branch?${query}`);
      if (!response.ok) throw new Error("Failed to fetch report");

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!enabled) return;
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetch();
    });
  }, [fetch, enabled]);

  return { data, loading, error, refetch: fetch };
}

export function useCarePlanReport(filters?: ReportFilters, enabled = true) {
  const [data, setData] = useState<CarePlanReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (filters?.startDate) query.append("startDate", filters.startDate);
      if (filters?.endDate) query.append("endDate", filters.endDate);
      if (filters?.clientId) query.append("clientId", filters.clientId);
      if (filters?.status) query.append("status", filters.status);

      const response = await globalThis.fetch(`/api/reports/careplans?${query}`);
      if (!response.ok) throw new Error("Failed to fetch report");

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!enabled) return;
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetch();
    });
  }, [fetch, enabled]);

  return { data, loading, error, refetch: fetch };
}
