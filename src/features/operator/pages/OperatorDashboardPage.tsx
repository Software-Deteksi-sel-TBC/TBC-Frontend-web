import { useMemo, useState } from "react";
import OperatorEmptyState from "../components/OperatorEmptyState";
import PatientHistoryTable from "../components/PatientHistoryTable";
import OperatorTopNav from "../components/OperatorTopNav";
import { createNewPatientRecord, mockPatientHistory } from "../data/mockPatients";
import type { PatientRecord } from "../types/operator.types";

export default function OperatorDashboardPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [query, setQuery] = useState("");

  const filteredPatients = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return patients;

    return patients.filter(
      (item) =>
        item.caseId.toLowerCase().includes(keyword) ||
        item.patientName.toLowerCase().includes(keyword),
    );
  }, [patients, query]);

  const handleLoadDemo = () => setPatients(mockPatientHistory);

  const handleRegisterFast = () =>
    setPatients((prev) => [createNewPatientRecord(), ...prev]);

  const handleBackToEmpty = () => {
    setPatients([]);
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-[#EEF6FF]">
      <OperatorTopNav />
      <main className="max-w-[1260px] mx-auto px-4 py-4 md:px-6 md:py-6">
        {patients.length === 0 ? (
          <OperatorEmptyState onLoadDemo={handleLoadDemo} />
        ) : (
          <PatientHistoryTable
            data={filteredPatients}
            query={query}
            onQueryChange={setQuery}
            onBack={handleBackToEmpty}
          />
        )}

        {patients.length > 0 && (
          <button
            type="button"
            onClick={handleRegisterFast}
            className="mt-3 text-xs text-[#0A52D6] hover:underline"
          >
            + Quick add sample patient
          </button>
        )}
      </main>
    </div>
  );
}
