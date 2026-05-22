import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { updateCurrentStage } from "../api/stageTracking.api";
import axios from "axios";
import CreativeConfirmationSection, {
  type CreativeConfirmationHandle,
} from "./CreativeConfirmationSection";

export default function CreativeConfirmation({
  client,
  onNext,
  onBack,
}: {
  client: any;
  onNext: () => void;
  onBack?: () => void;
}) {
  const actualId = client.id;
  const navigate = useNavigate();
  const sectionRef = useRef<CreativeConfirmationHandle>(null);
  const [flowType, setFlowType] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/crm/leads/${actualId}/phase-info`)
      .then((res) => setFlowType(res.data?.data?.flow_type || ""))
      .catch(() => {});
  }, [actualId]);

  const handleProceed = async () => {
    try {
      setLoading(true);
      const ok = await sectionRef.current?.save();
      if (!ok) return;
      await updateCurrentStage({
        external_lead_id: String(actualId),
        stage_name: "team_assignment",
      });
      if (flowType === "post_wedding") {
        alert(
          "Creative confirmation saved.\n\nNext stage: Event -> Event Coordinator. Go to the Event Coordinator module to set event details, assign the event team, and monitor event execution."
        );
        navigate("/event-coordinator/client");
        return;
      }
      onNext();
    } catch (error) {
      console.error(error);
      alert("Failed to proceed");
    } finally {
      setLoading(false);
    }
  };

  const summary = sectionRef.current;
  const colorCount = summary?.colorCount ?? 0;
  const approved = summary?.clientApproved ?? false;

  return (
    <div className="pb-28">
      <div className="mb-6 overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-sm">
        <div className="relative p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.32),transparent_34%),linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.94))]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-100">
                CRM Creative
              </div>
              <h1 className="text-2xl font-black tracking-tight">Creative Confirmation</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Finalize costume, palette, concept, references, and location details before assigning the shooting team.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Lead</p>
                <p className="mt-1 truncate text-sm font-bold">{actualId}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Client</p>
                <p className="mt-1 truncate text-sm font-bold">{client.name || "Client"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Colors</p>
                <p className="mt-1 truncate text-sm font-bold">{colorCount || "Unset"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Approval</p>
                <p className="mt-1 truncate text-sm font-bold">{approved ? "Approved" : "Pending"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreativeConfirmationSection
        ref={sectionRef}
        leadId={String(actualId)}
        clientName={client.name}
        flowType={flowType}
        onSavedChange={setIsSaved}
      />

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] lg:left-[280px] lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            {isSaved ? "Creative details saved." : "Save the concept before assigning the shooting team."}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            {onBack && (
              <button type="button" onClick={onBack} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={async () => { setLoading(true); await sectionRef.current?.save(); setLoading(false); }}
              disabled={loading || isSaved}
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {isSaved ? "Saved" : loading ? "Saving..." : "Save Concept"}
            </button>
            <button
              type="button"
              onClick={handleProceed}
              disabled={!isSaved || loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Assign Team <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
