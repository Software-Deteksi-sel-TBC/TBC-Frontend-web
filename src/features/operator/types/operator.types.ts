export interface PatientRecord {
  id: string;
  caseId: string;
  patientId: string;
  patientNoInduk?: string;
  patientName: string;
  received: string;
  createdAt: string;
  caseUuid?: string;
}

export interface CaseImageSummary {
  id: string;
  original_filename: string;
  magnification: string;
  qc_status: string;
  qc_failure_reason: string | null;
  uploaded_at: string;
}
