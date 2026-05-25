import type { ValidationRecord } from "../types/patolog.types";

export const mockValidationQueue: ValidationRecord[] = [
    { id: "1", caseId: "LAB-0121", patientName: "Felicia", received: "2h ago", progress: { current: 3, total: 3 } },
    { id: "2", caseId: "LAB-0121", patientName: "Coksat", received: "17m ago", progress: { current: 1, total: 2 } },
    { id: "3", caseId: "LAB-0121", patientName: "Yasir", received: "2h ago", progress: { current: 0, total: 5 } },
    { id: "4", caseId: "LAB-0121", patientName: "Yasir", received: "Yesterday", progress: { current: 3, total: 4 } },
    { id: "5", caseId: "LAB-0121", patientName: "Walid", received: "Yesterday", progress: { current: 5, total: 5 } },
    { id: "6", caseId: "LAB-0121", patientName: "Johanna", received: "Yesterday", progress: { current: 3, total: 3 } },
];