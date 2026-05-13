import type { PatientRecord } from "../types/operator.types";

export const mockPatientHistory: PatientRecord[] = [
  { id: "patient-1", patientId: "patient-1", caseId: "LAB - 0121", patientName: "Felice", received: "2h ago", createdAt: "2026-04-26T08:00:00Z" },
  { id: "patient-2", patientId: "patient-2", caseId: "LAB - 0121", patientName: "Cakut", received: "17m ago", createdAt: "2026-04-26T09:43:00Z" },
  { id: "patient-3", patientId: "patient-3", caseId: "LAB - 0121", patientName: "Yasir", received: "21h ago", createdAt: "2026-04-25T14:00:00Z" },
  { id: "patient-4", patientId: "patient-4", caseId: "LAB - 0121", patientName: "Yasir", received: "Yesterday", createdAt: "2026-04-25T06:00:00Z" },
  { id: "patient-5", patientId: "patient-5", caseId: "LAB - 0121", patientName: "Walid", received: "Yesterday", createdAt: "2026-04-25T05:00:00Z" },
  { id: "patient-6", patientId: "patient-6", caseId: "LAB - 0121", patientName: "Johana", received: "Yesterday", createdAt: "2026-04-25T04:00:00Z" },
];

export const createNewPatientRecord = (): PatientRecord => ({
  id: `patient-${Math.floor(1000 + Math.random() * 9000)}`,
  patientId: `patient-${Math.floor(1000 + Math.random() * 9000)}`,
  caseId: "-",
  patientName: "New Patient",
  received: "Just now",
  createdAt: new Date().toISOString(),
});
