import { api } from "../../../shared/api/api";

export interface GenerateReportPayload {
  case_id: string;
  diagnosis_summary?: string;
}

export const generateReport = (payload: GenerateReportPayload) => api.post('/reports', payload);
export const getReport = (reportId: string) => api.get(`/reports/${reportId}`);
