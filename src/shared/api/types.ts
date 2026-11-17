export interface CaseImageSummary {
  id: string;
  original_filename: string;
  magnification: string;
  qc_status: string;
  qc_failure_reason: string | null;
  uploaded_at?: string;
  view_url?: string | null;
}
