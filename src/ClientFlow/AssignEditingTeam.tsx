import { AlertCircle, ArrowRight, Bell, CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  advancePhase,
  approveEditingPhase,
  getPhase2SubmissionStatus,
  updateCurrentStage,
  type Phase2SubmissionStatus,
} from "../api/stageTracking.api";
import { saveAssignTeam } from "../api/assignTeam.api";
import {
  EmployeePicker,
  AdditionalStaffPicker,
  buildAssignTeamPayload,
  getEmployeeDisplayName,
  type AssignTeamContext,
} from "./assignTeamShared";

const getNextPhaseHandoffMessage = (phase?: string, allPhasesComplete?: boolean) => {
  if (allPhasesComplete) {
    return "All workflow phases are complete.";
  }

  if (phase === "event") {
    return "Next stage: Event -> Event Coordinator. Go to the Event Coordinator module to set event details, assign the event team, and monitor event execution.";
  }

  if (phase === "post_production") {
    return "Next stage: Post-production -> Operational Manager. Go to the Operational Manager module for editor assignment and production tracking.";
  }

  if (phase === "pre_production") {
    return "Next stage: Pre-production -> CRM. Continue the CRM pre-production workflow.";
  }

  return `Moved to ${phase || "the next stage"}.`;
};

export default function AssignEditingTeam({
  context,
  onBack,
  onNext,
}: {
  context: AssignTeamContext;
  onBack: () => void;
  onNext: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [checkingSubmissions, setCheckingSubmissions] = useState(false);
  const [submissionStatus, setSubmissionStatus] =
    useState<Phase2SubmissionStatus | null>(null);

  const refreshSubmissionStatus = async () => {
    try {
      setCheckingSubmissions(true);
      const response = await getPhase2SubmissionStatus(context.actualId);
      setSubmissionStatus(response.data?.data || null);
    } catch (error) {
      console.error("Phase 2 submission status check failed", error);
      setSubmissionStatus(null);
    } finally {
      setCheckingSubmissions(false);
    }
  };

  useEffect(() => {
    void refreshSubmissionStatus();
  }, [context.actualId]);

  const handleSave = async (isFinalSave: boolean) => {
    try {
      setLoading(true);

      await saveAssignTeam(buildAssignTeamPayload(context));
      await refreshSubmissionStatus();

      if (!isFinalSave) {
        alert("Editing team saved successfully ✅");
        return;
      }

      await updateCurrentStage({
        external_lead_id: context.actualId,
        stage_name: "completed_assign_team",
      });

      alert("Phase 2 editors assigned. Submitted for CRM approval. ✅");
      onNext();
    } catch (error) {
      console.error(error);
      alert("Failed to save editing team");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToNextStage = async () => {
    if (!submissionStatus?.allSubmitted || advancing) return;

    try {
      setAdvancing(true);
      await approveEditingPhase(context.actualId);
      const response = await advancePhase(context.actualId);
      const nextPhase = response.data?.data?.current_phase;
      const allPhasesComplete = response.data?.data?.allPhasesComplete;

      await context.refreshPhaseInfo();
      await refreshSubmissionStatus();

      alert(getNextPhaseHandoffMessage(nextPhase, allPhasesComplete));
      onNext();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to move to next stage");
    } finally {
      setAdvancing(false);
    }
  };

  const photographerName = getEmployeeDisplayName(
    context.employees,
    context.teamData.photographer
  );
  const videographerName = getEmployeeDisplayName(
    context.employees,
    context.teamData.videographer
  );

  return (
    <div
      className="rounded-[32px] bg-white p-8 shadow-sm"
      style={{ border: "1px solid #E5E7EB" }}
    >
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-gray-100"
            title="Go back"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#111827" }}>
              Assign Editing Team
            </h2>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Phase 2: Assign editors for post-shoot deliverables
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700"
              >
                Step 2 of 2: Editing
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="mb-6 grid grid-cols-2 gap-4 rounded-2xl p-4"
        style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#94A3B8" }}>
            Locked Shoot Team
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: "#0F172A" }}>
            Photographer: {photographerName}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#94A3B8" }}>
            Shoot Coverage
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: "#0F172A" }}>
            Videographer: {videographerName}
          </p>
        </div>
      </div>

      <div
        className="mb-6 rounded-2xl p-4"
        style={{
          background: submissionStatus?.allSubmitted ? "#ECFDF3" : "#FFF7ED",
          border: `1px solid ${submissionStatus?.allSubmitted ? "#A7F3D0" : "#FED7AA"}`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: submissionStatus?.allSubmitted ? "#D1FAE5" : "#FFEDD5",
                color: submissionStatus?.allSubmitted ? "#047857" : "#C2410C",
              }}
            >
              {submissionStatus?.allSubmitted ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#0F172A" }}>
                Phase 2 submission gate
              </p>
              <p className="mt-1 text-xs" style={{ color: "#64748B" }}>
                {submissionStatus?.allSubmitted
                  ? "All assigned editors submitted their files. You can move this client to the next stage."
                  : `${submissionStatus?.submittedCount || 0}/${submissionStatus?.assignedCount || 0} assigned editor submissions received.`}
              </p>
              {submissionStatus?.roles && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {submissionStatus.roles
                    .filter((role) => role.assigned)
                    .map((role) => (
                      <span
                        key={role.key}
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: role.submitted ? "#D1FAE5" : "#FEF3C7",
                          color: role.submitted ? "#047857" : "#B45309",
                        }}
                      >
                        {role.submitted ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        {role.label}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshSubmissionStatus()}
              disabled={checkingSubmissions}
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50 disabled:opacity-60"
              style={{ borderColor: "#E5E7EB", color: "#374151" }}
            >
              <RefreshCw size={14} className={checkingSubmissions ? "animate-spin" : ""} />
              Refresh
            </button>
            {submissionStatus?.allSubmitted && (
              <button
                type="button"
                onClick={() => void handleGoToNextStage()}
                disabled={advancing}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#059669" }}
              >
                {advancing ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                {advancing ? "Moving..." : "Go to Next Stage"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <EmployeePicker
          label="Save the Date"
          value={context.teamData.save_the_date}
          placeholder="Select save the date editor"
          options={context.saveTheDateEditors}
          onChange={(value) =>
            context.setTeamData((previous) => ({ ...previous, save_the_date: value }))
          }
          icon={
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <EmployeePicker
          label="Save the Video"
          value={context.teamData.save_the_video}
          placeholder="Select save the video editor"
          options={context.saveTheVideoEditors}
          onChange={(value) =>
            context.setTeamData((previous) => ({ ...previous, save_the_video: value }))
          }
          icon={
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
        />

        <EmployeePicker
          label="Retouch"
          value={context.teamData.retouch}
          placeholder="Select retouch editor"
          options={context.retouchEditors}
          onChange={(value) =>
            context.setTeamData((previous) => ({ ...previous, retouch: value }))
          }
          icon={
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-1a5 5 0 100-10 5 5 0 000 10z" />
            </svg>
          }
        />

        <AdditionalStaffPicker
          tags={context.additionalStaff}
          employees={context.employees}
          availableRoles={[
            { key: "save_the_date", label: "Save the Date" },
            { key: "save_the_video", label: "Save the Video" },
            { key: "retouch", label: "Retouch" },
          ]}
          onAdd={(value) =>
            context.setAdditionalStaff((previous) => [...previous, value])
          }
          onRemove={(value) =>
            context.setAdditionalStaff((previous) =>
              previous.filter((item) => item !== value)
            )
          }
          icon={
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <button
          onClick={onBack}
          className="rounded-xl border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: "#E5E7EB", color: "#374151" }}
        >
          Cancel
        </button>
        <button
          onClick={() => void handleSave(true)}
          disabled={loading}
          className="rounded-xl border px-6 py-2.5 text-sm font-medium hover:bg-gray-50"
          style={{ borderColor: "#E5E7EB", color: "#374151" }}
        >
          {loading ? "Assigning..." : "Assign Editors"}
        </button>
        <button
          className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-purple-700 shadow-sm transition-colors hover:bg-purple-100"
          style={{ background: "#EDE9FE" }}
        >
          <Bell size={16} /> Notify Team
        </button>
        <button
          onClick={() => void handleSave(false)}
          className="rounded-xl px-6 py-2.5 text-sm font-medium text-white shadow-md transition-opacity hover:opacity-90"
          style={{ background: "#5B5FC7" }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
