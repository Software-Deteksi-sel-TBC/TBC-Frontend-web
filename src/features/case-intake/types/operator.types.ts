export interface PatientRecord {
  id: string;
  caseId: string;
  patientId: string;
  patientNoInduk?: string;
  patientName: string;
  received: string;
  createdAt: string;
}
