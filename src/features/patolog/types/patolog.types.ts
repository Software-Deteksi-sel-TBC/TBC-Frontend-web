export interface ValidationRecord {
    id: string;
    caseId: string;
    patientName: string;
    received: string;
    progress: {
        current: number;
        total: number;
    };
}