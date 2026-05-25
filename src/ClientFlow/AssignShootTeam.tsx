import { Bell } from "lucide-react";
import { useState } from "react";
import { approveShootPhase, updateCurrentStage } from "../api/stageTracking.api";
import { saveAssignTeam } from "../api/assignTeam.api";
import {
  EmployeePicker,
  AdditionalStaffPicker,
  ShootLocationInput,
  buildAssignTeamPayload,
  type AssignTeamContext,
} from "./assignTeamShared";

export default function AssignShootTeam({
  context,
  onBack,
  onNext,
  client,
  forceShootTeamOnly = false,
}: {
  context: AssignTeamContext;
  onBack: () => void;
  onNext?: () => void;
  client?: any;
  forceShootTeamOnly?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleSave = async (isFinalSave: boolean) => {
    try {
      setLoading(true);

      await saveAssignTeam(buildAssignTeamPayload(context));

      if (!isFinalSave) {
        alert("Shoot team saved successfully ✅");
        return;
      }

      await updateCurrentStage({
        external_lead_id: context.actualId,
        stage_name: "completed_assign_team",
      });
      await updateCurrentStage({
        external_lead_id: context.actualId,
        stage_name: "confirmed_shoot_team",
      });

      await approveShootPhase(context.actualId);
      await context.refreshPhaseInfo();
      alert("Shoot team assigned successfully. ✅");
      if (onNext) onNext();
    } catch (error) {
      console.error(error);
      alert("Failed to save shoot team");
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyTeam = () => {
    const { teamData, employees, shootLocations } = context;

    const photogEmp = employees.find(e => String(e.employee_id) === teamData.photographer);
    const photographerName = photogEmp ? [photogEmp.first_name, photogEmp.last_name].filter(Boolean).join(" ") : 'Not Assigned';
    const photogPhone = photogEmp?.phone ? `(+91${photogEmp.phone})` : '';

    const videoEmp = employees.find(e => String(e.employee_id) === teamData.videographer);
    const videographerName = videoEmp ? [videoEmp.first_name, videoEmp.last_name].filter(Boolean).join(" ") : 'Not Assigned';
    const videoPhone = videoEmp?.phone ? `(+91${videoEmp.phone})` : '';

    const dateStr = client?.eventDate || teamData.event_date || 'TBD';

    let message = `Please find your Pre-Wedding Shoot Plan\n\n`;
    message += `${client?.name || 'Client'} 💍(${client?.phone || ''})\n\n`;
    message += `📅 Date: ${dateStr}\n\n`;
    message += `🎬 Shoot Team\n`;
    message += `Candid Photographer 📸: ${photographerName} ${photogPhone}\n`;
    message += `Candid Videographer 📸: ${videographerName} ${videoPhone}\n\n`;

    if (shootLocations && shootLocations.length > 0) {
      shootLocations.forEach((loc, i) => {
        message += `📍 Location ${i + 1}: ${loc.label} 🌊 (${loc.link || ''})\n`;
        if (loc.time) message += `Time: ${loc.time} ⏰\n`;
        if (loc.concept) message += `Concept:\n${loc.concept}\n`;
        message += `\n`;
      });
    }

    message += `📝 Notes\n`;
    message += `Total shoot duration: 5 hours ⏳\n`;
    message += `Extra time will be charged additionally 💰\n`;
    message += `Travel & food allowance to be arranged by client 🍽️🚗\n`;

    navigator.clipboard.writeText(message).then(() => {
      alert("Plan copied to clipboard! You can paste it in WhatsApp.");
    }).catch(err => {
      console.error("Failed to copy text: ", err);
      alert("Failed to copy to clipboard.");
    });
  };

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
              Assign Shoot Team
            </h2>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              {forceShootTeamOnly
                ? "Assign photographer and videographer for the shoot"
                : "Phase 1: Assign photographer and videographer for the shoot"}
            </p>
            {!forceShootTeamOnly && (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700"
                >
                  Step 1 of 2: Shooting
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {!forceShootTeamOnly && (
        <div
          className="mb-6 rounded-2xl px-4 py-3 text-sm"
          style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8" }}
        >
          This page is only for phase-1 capture roles. Phase-2 editors will be assigned
          on the next screen after the shoot team is confirmed.
        </div>
      )}

      {/* ── Event Details ────────────────────────────────── */}
      <div
        className="mb-6 rounded-2xl p-6"
        style={{ border: "1px solid #E5E7EB" }}
      >
        <div className="mb-5 flex items-center gap-2">
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
          <h3 className="text-sm font-bold" style={{ color: "#111827" }}>
            Event Details
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Event Date */}
          <div>
            <label
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: "#6B7280" }}
            >
              Event Date
            </label>
            <input
              type="date"
              value={context.teamData.event_date}
              onChange={(e) =>
                context.setTeamData((prev) => ({ ...prev, event_date: e.target.value }))
              }
              className="w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-purple-400"
              style={{ borderColor: "#E5E7EB", color: "#0F172A" }}
            />
          </div>

          {/* Event Time */}
          <div>
            <label
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: "#6B7280" }}
            >
              Event Time
            </label>
            <input
              type="time"
              value={context.teamData.event_time}
              onChange={(e) =>
                context.setTeamData((prev) => ({ ...prev, event_time: e.target.value }))
              }
              className="w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-purple-400"
              style={{ borderColor: "#E5E7EB", color: "#0F172A" }}
            />
          </div>

          {/* Location */}
          <div>
            <label
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: "#6B7280" }}
            >
              Venue / Location
            </label>
            <input
              type="text"
              value={context.teamData.location}
              onChange={(e) =>
                context.setTeamData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="e.g. Chennai, Mahabalipuram"
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:border-purple-400"
              style={{ borderColor: "#E5E7EB", color: "#0F172A" }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <EmployeePicker
          label="Photographer"
          value={context.teamData.photographer}
          placeholder="Select photographer"
          options={context.photographers}
          onChange={(value) =>
            context.setTeamData((previous) => ({ ...previous, photographer: value }))
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />

        <EmployeePicker
          label="Videographer"
          value={context.teamData.videographer}
          placeholder="Select videographer"
          options={context.videographers}
          onChange={(value) =>
            context.setTeamData((previous) => ({ ...previous, videographer: value }))
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

        <AdditionalStaffPicker
          tags={context.additionalStaff}
          employees={context.employees}
          availableRoles={[
            { key: "photographer", label: "Photographer" },
            { key: "videographer", label: "Videographer" },
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

      {/* ── Shoot Locations ── full-width section below the grid ── */}
      <div className="mb-6">
        <ShootLocationInput
          locations={context.shootLocations}
          onAdd={(loc) => context.setShootLocations((prev) => [...prev, loc])}
          onRemove={(idx) => context.setShootLocations((prev) => prev.filter((_, i) => i !== idx))}
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
          {loading ? "Assigning..." : "Assign Shoot Team"}
        </button>
        <button
          onClick={handleNotifyTeam}
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
