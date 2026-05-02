import { FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";

type Props ={
  onLoadDemo: () => void;
}


export default function OperatorEmptyState({ onLoadDemo }: Props) {
  return (
    <section className="max-w-3xl mx-auto mt-16 text-center">
      <h1 className="text-4xl font-bold text-[#0A52D6]">Welcome, Operator</h1>
      <p className="mt-2 text-slate-500 text-sm">
        What would you like to do today? Select an action below to begin
        diagnostic service
      </p>

      <div className="mt-8 bg-white border border-blue-100 rounded-xl p-6 text-left shadow-sm">
        <div className="w-10 h-10 rounded bg-[#0A52D6] text-white flex items-center justify-center">
          <FlaskConical size={18} />
        </div>
        <h2 className="mt-4 text-[#0A52D6] font-semibold text-lg">
          New Ticket &amp; Imaging
        </h2>
        <p className="mt-1 text-sm text-slate-500 max-w-md">
          Register patient metadata and perform real-time quality control on diagnostic imagery.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link 
            to="/operator/patient-form"
            className="inline-flex items-center px-4 py-2 bg-[#0A52D6] text-white hover:bg-[#0A52D6] hover:text-white text-white rounded text-xs uppercase tracking-wider font-semibold"
          >
            Start New Workflow
          </Link>
          <button
            type="button"
            onClick={onLoadDemo}
            className="inline-flex items-center px-4 py-2 border border-[#0A52D6] text-[#0A52D6] rounded text-xs uppercase tracking-wider font-semibold hover:bg-[#0A52D6] hover:text-white"
          >
            Load Sample History
          </button>
        </div>
      </div>
    </section>
  );
}
