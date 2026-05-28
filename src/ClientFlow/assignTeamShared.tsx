import { Check, ChevronDown, Search, MapPin, Plus, Trash2, X, UserPlus } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import axios from "axios";
import { getAssignTeam } from "../api/assignTeam.api";
import { getCurrentUserDisplayName, getCurrentUserRole } from "../utils/currentUser";

export interface ShootLocation {
  label: string;
  link: string;
  time?: string;
  concept?: string;
}

export interface TeamData {
  photographer: string;
  videographer: string;
  drone: string;
  save_the_date: string;
  save_the_video: string;
  retouch: string;
  event_date: string;
  event_time: string;
  location: string;
}

export interface Employee {
  employee_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  roles?: string | string[] | null;
  phone?: string | number;
}

interface SavedTeamData extends Partial<TeamData> {
  secondary_photographer?: string[] | string | null;
  secondary_videographer?: string[] | string | null;
  secondary_drone?: string[] | string | null;
  additional_staff?: string[] | string | null;
  shoot_locations?: ShootLocation[] | string | null;
}

export interface AssignTeamContext {
  actualId: string;
  isLoading: boolean;
  currentPhase: string;
  preProductionStep: string;
  refreshPhaseInfo: () => Promise<void>;
  teamData: TeamData;
  setTeamData: Dispatch<SetStateAction<TeamData>>;
  secondaryPhotographers: string[];
  setSecondaryPhotographers: Dispatch<SetStateAction<string[]>>;
  secondaryVideographers: string[];
  setSecondaryVideographers: Dispatch<SetStateAction<string[]>>;
  secondaryDrones: string[];
  setSecondaryDrones: Dispatch<SetStateAction<string[]>>;
  additionalStaff: string[];
  setAdditionalStaff: Dispatch<SetStateAction<string[]>>;
  shootLocations: ShootLocation[];
  setShootLocations: Dispatch<SetStateAction<ShootLocation[]>>;
  employees: Employee[];
  photographers: Employee[];
  videographers: Employee[];
  drones: Employee[];
  saveTheDateEditors: Employee[];
  saveTheVideoEditors: Employee[];
  retouchEditors: Employee[];
}

export const toDateInputValue = (value?: string | Date | null) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeStringArray = (value: string[] | string | null | undefined) => {
  if (!value) return [] as string[];
  if (Array.isArray(value)) return value.map(String);

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const hasRole = (employee: Employee, expectedRoles: string[]) => {
  const rolesStr = Array.isArray(employee.roles)
    ? employee.roles.join(" ")
    : employee.roles || "";
  const normalizedRoles = `${rolesStr} ${employee.role || ""}`.toLowerCase();

  return expectedRoles.some((expectedRole) =>
    normalizedRoles.includes(expectedRole.toLowerCase())
  );
};

export const buildAssignTeamPayload = (context: AssignTeamContext) => ({
  external_lead_id: context.actualId,
  assigned_by_name: getCurrentUserDisplayName(),
  assigned_by_role: getCurrentUserRole(context.currentPhase === "event" ? "event-coordinator" : "crm"),
  ...context.teamData,
  secondary_photographer: context.secondaryPhotographers,
  secondary_videographer: context.secondaryVideographers,
  secondary_drone: context.secondaryDrones,
  additional_staff: context.additionalStaff,
  shoot_locations: context.shootLocations,
});

export const getEmployeeDisplayName = (employees: Employee[], value: string) => {
  if (!value) return "Unassigned";

  const employee = employees.find(
    (item) => String(item.employee_id) === String(value)
  );

  if (!employee) return value;

  const fullName = [employee.first_name, employee.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || String(employee.employee_id);
};

export function TagInput({
  label,
  icon,
  tags,
  onAdd,
  onRemove,
}: {
  label: string;
  icon: ReactNode;
  tags: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const value = input.trim();
    if (value && !tags.includes(value)) {
      onAdd(value);
      setInput("");
    }
  };

  return (
    <div className="rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
      <div className="mb-5 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold" style={{ color: "#111827" }}>
          {label}
        </h3>
      </div>

      <div className="mb-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleAdd()}
          placeholder={`Type ${label.toLowerCase()} name...`}
          className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:border-purple-400"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          Add
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "#EDE9FE", color: "#5B21B6" }}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="font-bold hover:text-red-500"
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── helper: parse a stored additional-staff entry ─────────────── */
const parseStaffEntry = (entry: string, employees: Employee[]) => {
  // New format: "employeeId::roleName"
  if (entry.includes("::")) {
    const [empId, role] = entry.split("::");

    // Handle Freelancer custom IDs: FREELANCE_{Name}_{Phone}
    if (empId.startsWith("FREELANCE_")) {
      const parts = empId.split("_");
      const namePart = parts[1] || "Freelancer";
      const phonePart = parts[2] || "";
      const displayName = phonePart ? `${namePart} (${phonePart})` : namePart;
      return { id: empId, name: displayName, role: role || "Freelancer" };
    }

    const emp = employees.find((e) => String(e.employee_id) === empId);
    const name = emp
      ? [emp.first_name, emp.last_name].filter(Boolean).join(" ")
      : empId;
    return { id: empId, name, role: role || "Staff" };
  }
  // Legacy format: plain text
  return { id: entry, name: entry, role: "" };
};

export function AdditionalStaffPicker({
  icon,
  tags,
  employees,
  availableRoles,
  onAdd,
  onRemove,
}: {
  icon: ReactNode;
  tags: string[];
  employees: Employee[];
  availableRoles: { key: string; label: string }[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  
  // Freelancer Modal State
  const [showFreelancerModal, setShowFreelancerModal] = useState(false);
  const [freelancerName, setFreelancerName] = useState("");
  const [freelancerPhone, setFreelancerPhone] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const roleRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) setSearch("");
  }, [dropdownOpen]);

  // IDs already added
  const addedIds = new Set(
    tags.map((t) => (t.includes("::") ? t.split("::")[0] : t))
  );

  const filteredEmployees = employees.filter((emp) => {
    if (addedIds.has(String(emp.employee_id))) return false;
    const query = search.toLowerCase().trim();
    if (!query) return true;
    const name = [emp.first_name, emp.last_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const id = String(emp.employee_id || "").toLowerCase();
    const role = String(emp.role || "").toLowerCase();
    return name.includes(query) || id.includes(query) || role.includes(query);
  });

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setDropdownOpen(false);
    setSelectedRole("");
    // If only one role available, auto-select it
    if (availableRoles.length === 1) {
      setSelectedRole(availableRoles[0].label);
    }
  };

  const handleConfirmAdd = () => {
    if (!selectedEmployee || !selectedRole) return;
    const entry = `${selectedEmployee.employee_id}::${selectedRole}`;
    if (!tags.includes(entry)) {
      onAdd(entry);
    }
    setSelectedEmployee(null);
    setSelectedRole("");
    setSearch("");
    setRoleDropdownOpen(false);
  };

  const handleCancelSelection = () => {
    setSelectedEmployee(null);
    setSelectedRole("");
    setRoleDropdownOpen(false);
  };

  const handleSaveFreelancer = () => {
    const name = freelancerName.trim() || "Freelancer";
    const phone = freelancerPhone.trim();
    const pseudoId = `FREELANCE_${name}_${phone}`;
    
    const pseudoEmployee: Employee = {
      employee_id: pseudoId,
      first_name: name,
      role: "Freelancer",
    };
    
    handleSelectEmployee(pseudoEmployee);
    setShowFreelancerModal(false);
    setFreelancerName("");
    setFreelancerPhone("");
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl p-6"
      style={{ border: "1px solid #E5E7EB" }}
    >
      <div className="mb-5 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold" style={{ color: "#111827" }}>
          Additional Staff
        </h3>
      </div>

      {/* ── Employee selection flow ──────────────────────────── */}
      {!selectedEmployee ? (
        /* Step 1: Employee dropdown trigger */
        <div className="relative mb-3">
          <button
            type="button"
            onClick={() => setDropdownOpen((p) => !p)}
            className="w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-all"
            style={{
              borderColor: dropdownOpen ? "#6366F1" : "#E5E7EB",
              boxShadow: dropdownOpen
                ? "0 0 0 3px rgba(99,102,241,0.10)"
                : "none",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserPlus size={15} style={{ color: "#94A3B8" }} />
                <span style={{ color: "#94A3B8" }}>Select employee to add...</span>
              </div>
              <ChevronDown
                size={15}
                style={{
                  color: "#94A3B8",
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </div>
          </button>

          {/* Employee dropdown */}
          {dropdownOpen && (
            <div
              className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-2xl border bg-white"
              style={{
                borderColor: "#E2E8F0",
                boxShadow: "0 20px 40px rgba(15,23,42,0.16)",
              }}
            >
              <div
                className="border-b px-3 py-3"
                style={{ borderColor: "#EEF2F7" }}
              >
                <div
                  className="flex items-center gap-2 rounded-xl border px-3 py-2"
                  style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}
                >
                  <Search size={14} style={{ color: "#94A3B8" }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search employees..."
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: "#0F172A" }}
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto p-1.5">
                {filteredEmployees.length === 0 ? (
                  <div
                    className="px-3 py-6 text-center text-sm"
                    style={{ color: "#94A3B8" }}
                  >
                    No matching employees found
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const name =
                      [emp.first_name, emp.last_name]
                        .filter(Boolean)
                        .join(" ") || String(emp.employee_id);
                    const initials = name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join("");

                    return (
                      <button
                        key={emp.employee_id}
                        type="button"
                        onClick={() => handleSelectEmployee(emp)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                          style={{ background: "#F1F5F9", color: "#64748B" }}
                        >
                          {initials || "NA"}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-semibold"
                            style={{ color: "#0F172A" }}
                          >
                            {name}
                          </p>
                          <p
                            className="text-[11px]"
                            style={{ color: "#64748B" }}
                          >
                            {emp.role || "Employee"}
                            {emp.employee_id
                              ? ` • ${emp.employee_id}`
                              : ""}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}

                {/* + Add Freelancer Button */}
                <div className="mt-1 border-t px-1.5 pt-1.5" style={{ borderColor: "#F1F5F9" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowFreelancerModal(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-slate-50"
                    style={{ color: "#4F46E5" }}
                  >
                    <Plus size={16} />
                    Add Freelancer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Step 2: Employee selected → choose role */
        <div className="mb-3 rounded-xl border p-3" style={{ borderColor: "#E0E7FF", background: "#F5F3FF" }}>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold"
                style={{ background: "#E0E7FF", color: "#4338CA" }}
              >
                {[selectedEmployee.first_name, selectedEmployee.last_name]
                  .filter(Boolean)
                  .join(" ")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join("") || "NA"}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                  {[selectedEmployee.first_name, selectedEmployee.last_name]
                    .filter(Boolean)
                    .join(" ") || selectedEmployee.employee_id}
                </p>
                <p className="text-[11px]" style={{ color: "#64748B" }}>
                  {selectedEmployee.role || "Employee"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelSelection}
              className="rounded-lg p-1 transition-colors hover:bg-red-50"
              title="Cancel"
            >
              <X size={14} style={{ color: "#94A3B8" }} />
            </button>
          </div>

          {/* Role selector */}
          <div className="relative" ref={roleRef}>
            <button
              type="button"
              onClick={() => setRoleDropdownOpen((p) => !p)}
              className="w-full rounded-lg border bg-white px-3 py-2 text-left text-sm transition-all"
              style={{
                borderColor: roleDropdownOpen ? "#6366F1" : "#E5E7EB",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  style={{
                    color: selectedRole ? "#0F172A" : "#94A3B8",
                    fontWeight: selectedRole ? 600 : 400,
                  }}
                >
                  {selectedRole || "Select role to assist with..."}
                </span>
                <ChevronDown
                  size={14}
                  style={{
                    color: "#94A3B8",
                    transform: roleDropdownOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </div>
            </button>

            {roleDropdownOpen && (
              <div
                className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-xl border bg-white"
                style={{
                  borderColor: "#E2E8F0",
                  boxShadow: "0 12px 24px rgba(15,23,42,0.12)",
                }}
              >
                <div className="p-1.5">
                  {availableRoles.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r.label);
                        setRoleDropdownOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors hover:bg-slate-50"
                      style={{
                        background:
                          selectedRole === r.label
                            ? "rgba(99,102,241,0.08)"
                            : "#FFFFFF",
                      }}
                    >
                      <span
                        className="font-medium"
                        style={{ color: "#0F172A" }}
                      >
                        {r.label}
                      </span>
                      {selectedRole === r.label && (
                        <Check size={14} style={{ color: "#4338CA" }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={handleConfirmAdd}
            disabled={!selectedRole}
            className="mt-2.5 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: "#5B5FC7" }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Plus size={14} />
              Add as {selectedRole || "..."}
            </div>
          </button>
        </div>
      )}

      {/* ── Added staff tags ───────────────────────────────── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const parsed = parseStaffEntry(tag, employees);
            return (
              <span
                key={tag}
                className="flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-xs font-medium"
                style={{ background: "#EDE9FE", color: "#5B21B6" }}
              >
                {parsed.name}
                {parsed.role && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ background: "#DDD6FE", color: "#6D28D9" }}
                  >
                    {parsed.role}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(tag)}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-red-100 hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Freelancer Details Modal ───────────────────────── */}
      {showFreelancerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            style={{ border: "1px solid #E5E7EB" }}
          >
            <h3 className="mb-4 text-lg font-bold" style={{ color: "#0F172A" }}>
              Add Freelancer
            </h3>
            
            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Name
                </label>
                <input
                  type="text"
                  value={freelancerName}
                  onChange={(e) => setFreelancerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400"
                  style={{ borderColor: "#E2E8F0" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Mobile No (Optional)
                </label>
                <input
                  type="text"
                  value={freelancerPhone}
                  onChange={(e) => setFreelancerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400"
                  style={{ borderColor: "#E2E8F0" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowFreelancerModal(false);
                  setFreelancerName("");
                  setFreelancerPhone("");
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-100"
                style={{ color: "#64748B" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFreelancer}
                disabled={!freelancerName.trim()}
                className="rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
                style={{ background: "#4F46E5" }}
              >
                Save & Select Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EmployeePicker({
  label,
  icon,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  placeholder: string;
  options: Employee[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const selectedEmployee = options.find(
    (employee) => String(employee.employee_id) === value
  );
  const selectedName = selectedEmployee
    ? [selectedEmployee.first_name, selectedEmployee.last_name]
        .filter(Boolean)
        .join(" ")
    : "";

  const filteredOptions = options.filter((employee) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;

    const name = [employee.first_name, employee.last_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const employeeId = String(employee.employee_id || "").toLowerCase();
    const role = String(employee.role || "").toLowerCase();

    return (
      name.includes(query) ||
      employeeId.includes(query) ||
      role.includes(query)
    );
  });

  const initials = selectedName
    ? selectedName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : label.charAt(0).toUpperCase();

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl bg-white p-6"
      style={{ border: "1px solid #E5E7EB" }}
    >
      <div className="mb-5 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold" style={{ color: "#111827" }}>
          {label}
        </h3>
      </div>

      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="w-full rounded-2xl border px-4 py-3.5 text-left transition-all"
        style={{
          borderColor: open ? "#6366F1" : "#DCE1EA",
          background: "#FFFFFF",
          boxShadow: open
            ? "0 0 0 4px rgba(99,102,241,0.10), 0 10px 28px rgba(15,23,42,0.08)"
            : "0 1px 2px rgba(15,23,42,0.04)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
              style={{
                background: selectedName ? "#EEF2FF" : "#F8FAFC",
                color: selectedName ? "#4338CA" : "#64748B",
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: "#94A3B8" }}
              >
                {selectedName ? "Assigned Member" : "Choose Team Member"}
              </p>
              <p
                className="mt-0.5 truncate text-sm font-semibold"
                style={{ color: selectedName ? "#0F172A" : "#94A3B8" }}
              >
                {selectedName || placeholder}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className="hidden items-center rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex"
              style={{ background: "#F8FAFC", color: "#64748B" }}
            >
              {options.length} available
            </span>

            {selectedName && !open && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
                style={{ background: "#ECFDF3", color: "#047857" }}
              >
                <Check size={12} />
                Assigned
              </span>
            )}

            <ChevronDown
              size={16}
              style={{
                color: "#64748B",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </div>
        </div>
      </button>

      {open && (
        <div
          className="absolute left-6 right-6 top-[calc(100%-6px)] z-20 overflow-hidden rounded-2xl border bg-white"
          style={{
            borderColor: "#E2E8F0",
            boxShadow: "0 24px 48px rgba(15,23,42,0.16)",
          }}
        >
          <div className="border-b px-3 py-3" style={{ borderColor: "#EEF2F7" }}>
            <div
              className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
              style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}
            >
              <Search size={14} style={{ color: "#94A3B8" }} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: "#0F172A" }}
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                  style={{ background: "#F8FAFC", color: "#64748B" }}
                >
                  --
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                    {placeholder}
                  </p>
                  <p className="text-[11px]" style={{ color: "#94A3B8" }}>
                    Leave unassigned for now
                  </p>
                </div>
              </div>
              {!value && <Check size={14} style={{ color: "#4338CA" }} />}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>
                No matching team members found
              </div>
            ) : (
              filteredOptions.map((employee) => {
                const name =
                  [employee.first_name, employee.last_name]
                    .filter(Boolean)
                    .join(" ") || employee.employee_id;
                const isSelected = String(employee.employee_id) === value;
                const optionInitials = name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join("");

                return (
                  <button
                    key={employee.employee_id}
                    type="button"
                    onClick={() => {
                      onChange(String(employee.employee_id));
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50"
                    style={{
                      background: isSelected ? "rgba(99,102,241,0.08)" : "#FFFFFF",
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                        style={{
                          background: isSelected ? "#E0E7FF" : "#F8FAFC",
                          color: isSelected ? "#4338CA" : "#64748B",
                        }}
                      >
                        {optionInitials || "NA"}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="truncate text-sm font-semibold"
                          style={{ color: "#0F172A" }}
                        >
                          {name}
                        </p>
                        <p className="text-[11px]" style={{ color: "#64748B" }}>
                          {employee.role || label}
                          {employee.employee_id ? ` • ${employee.employee_id}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {isSelected && (
                        <span
                          className="hidden rounded-full px-2 py-1 text-[10px] font-bold sm:inline-flex"
                          style={{ background: "#EEF2FF", color: "#4338CA" }}
                        >
                          Current
                        </span>
                      )}
                      {isSelected && <Check size={14} style={{ color: "#4338CA" }} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const useAssignTeamContext = (actualId: string): AssignTeamContext => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState("");
  const [preProductionStep, setPreProductionStep] = useState("shoot");
  const [teamData, setTeamData] = useState<TeamData>({
    photographer: "",
    videographer: "",
    drone: "",
    save_the_date: "",
    save_the_video: "",
    retouch: "",
    event_date: "",
    event_time: "",
    location: "",
  });
  const [secondaryPhotographers, setSecondaryPhotographers] = useState<string[]>([]);
  const [secondaryVideographers, setSecondaryVideographers] = useState<string[]>([]);
  const [secondaryDrones, setSecondaryDrones] = useState<string[]>([]);
  const [additionalStaff, setAdditionalStaff] = useState<string[]>([]);
  const [shootLocations, setShootLocations] = useState<ShootLocation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const normalizeShootLocationsArray = (value: any) => {
    if (!value) return [] as ShootLocation[];
    const normalizeLocation = (item: any, index: number): ShootLocation | null => {
      if (!item || typeof item !== "object") return null;

      const label = String(item.label || item.name || "").trim();
      const link = String(item.link || item.url || item.map_link || "").trim();
      const time = String(item.time || item.shooting_time || "").trim();
      const concept = String(item.concept || "").trim();

      if (!label && !link && !time && !concept) return null;

      return {
        label: label || `Location ${index + 1}`,
        link,
        time,
        concept,
      };
    };

    if (Array.isArray(value)) {
      return value
        .map(normalizeLocation)
        .filter(Boolean) as ShootLocation[];
    }

    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      return Array.isArray(parsed)
        ? (parsed.map(normalizeLocation).filter(Boolean) as ShootLocation[])
        : [];
    } catch {
      return [];
    }
  };

  const refreshPhaseInfo = async () => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/crm/leads/${actualId}/phase-info`
    );

    setCurrentPhase(response.data?.data?.current_phase || "");
    setPreProductionStep(response.data?.data?.pre_production_step || "shoot");
  };

  useEffect(() => {
    let isMounted = true;

    const loadContext = async () => {
      setIsLoading(true);

      try {
        const [employeesResponse, savedTeamResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/employees`),
          getAssignTeam(String(actualId)),
          refreshPhaseInfo(),
        ]);

        if (!isMounted) return;

        setEmployees((employeesResponse.data?.data || []) as Employee[]);

        const saved = (savedTeamResponse.data?.data || null) as SavedTeamData | null;
        if (!saved) return;

        setTeamData((previous) => ({
          ...previous,
          photographer: saved.photographer || "",
          videographer: saved.videographer || "",
          drone: saved.drone || "",
          save_the_date: saved.save_the_date || "",
          save_the_video: saved.save_the_video || "",
          retouch: saved.retouch || "",
          event_date: toDateInputValue(saved.event_date),
          event_time: saved.event_time || "",
          location: saved.location || "",
        }));
        setSecondaryPhotographers(normalizeStringArray(saved.secondary_photographer));
        setSecondaryVideographers(normalizeStringArray(saved.secondary_videographer));
        setSecondaryDrones(normalizeStringArray(saved.secondary_drone));
        setAdditionalStaff(normalizeStringArray(saved.additional_staff));
        setShootLocations(normalizeShootLocationsArray(saved.shoot_locations));
      } catch (error) {
        console.error("Assign team context load failed", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadContext();

    return () => {
      isMounted = false;
    };
  }, [actualId]);

  const photographers = employees.filter((employee) =>
    hasRole(employee, ["photographer"])
  );
  const videographers = employees.filter((employee) =>
    hasRole(employee, ["videographer"])
  );
  const drones = employees.filter((employee) => hasRole(employee, ["drone"]));
  const saveTheDateEditors = employees.filter((employee) =>
    hasRole(employee, ["save the date post"])
  );
  const saveTheVideoEditors = employees.filter((employee) =>
    hasRole(employee, ["save the date video"])
  );
  const retouchEditors = employees.filter((employee) =>
    hasRole(employee, ["retouch photo", "retouch"])
  );

  return {
    actualId,
    isLoading,
    currentPhase,
    preProductionStep,
    refreshPhaseInfo,
    teamData,
    setTeamData,
    secondaryPhotographers,
    setSecondaryPhotographers,
    secondaryVideographers,
    setSecondaryVideographers,
    secondaryDrones,
    setSecondaryDrones,
    additionalStaff,
    setAdditionalStaff,
    shootLocations,
    setShootLocations,
    employees,
    photographers,
    videographers,
    drones,
    saveTheDateEditors,
    saveTheVideoEditors,
    retouchEditors,
  };
};

/* ── 12-hour time formatter ────────────────────────── */
const formatTime12h = (time24: string): string => {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
};

export function ShootLocationInput({
  locations,
  onAdd,
  onRemove,
}: {
  locations: ShootLocation[];
  onAdd: (loc: ShootLocation) => void;
  onRemove: (index: number) => void;
}) {
  const [label, setLabel] = useState("");
  const [link, setLink] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [concept, setConcept] = useState("");

  const handleAdd = () => {
    const name = label.trim();
    const url = link.trim();
    const shootConcept = concept.trim();
    const hasTime = startTime || endTime;
    if (!name && !url && !hasTime && !shootConcept) return;

    let formattedLink = url;
    if (url && !/^https?:\/\//i.test(url)) {
      formattedLink = `https://${url}`;
    }

    // Build time string from pickers
    let timeStr = "";
    if (startTime && endTime) {
      timeStr = `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
    } else if (startTime) {
      timeStr = formatTime12h(startTime);
    } else if (endTime) {
      timeStr = formatTime12h(endTime);
    }

    onAdd({
      label: name || `Location ${locations.length + 1}`,
      link: formattedLink,
      time: timeStr,
      concept: shootConcept,
    });
    setLabel("");
    setLink("");
    setStartTime("");
    setEndTime("");
    setConcept("");
  };

  return (
    <div className="rounded-2xl p-6 bg-white" style={{ border: "1px solid #E5E7EB" }}>
      {/* ── Header ── */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-purple-600" />
          <h3 className="text-sm font-bold" style={{ color: "#111827" }}>
            Shoot Locations
          </h3>
        </div>
        {locations.length > 0 && (
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: "#F3F4F6", color: "#6B7280" }}
          >
            {locations.length} {locations.length === 1 ? "location" : "locations"}
          </span>
        )}
      </div>

      {/* ── Input form ── */}
      <div className="mb-5 flex flex-col gap-3">
        {/* Row 1: Name + Map Link */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: "#6B7280" }}
            >
              Location Name
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Kalpakkam Beach"
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:border-purple-400"
              style={{ borderColor: "#E5E7EB" }}
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: "#6B7280" }}
            >
              Google Map Link
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste Google Maps URL"
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:border-purple-400"
              style={{ borderColor: "#E5E7EB" }}
            />
          </div>
        </div>

        {/* Row 2: Start Time + End Time + Concept + Add button */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
          {/* Start Time */}
          <div>
            <label
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: "#6B7280" }}
            >
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-purple-400"
              style={{ borderColor: "#E5E7EB", color: "#0F172A" }}
            />
          </div>

          {/* End Time */}
          <div>
            <label
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: "#6B7280" }}
            >
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-purple-400"
              style={{ borderColor: "#E5E7EB", color: "#0F172A" }}
            />
          </div>

          {/* Concept */}
          <div>
            <label
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: "#6B7280" }}
            >
              Concept
            </label>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g. Soft sunrise lighting, candid movement..."
              rows={1}
              className="w-full min-h-[42px] resize-y rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:border-purple-400"
              style={{ borderColor: "#E5E7EB" }}
            />
          </div>

          {/* Add button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAdd}
              className="flex h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700"
            >
              <Plus size={15} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* ── Location cards ── */}
      {locations.length > 0 && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {locations.map((loc, idx) => (
            <div
              key={idx}
              className="group relative rounded-xl p-4 transition-all hover:shadow-sm"
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
            >
              <div className="flex items-start gap-3">
                {/* Numbered pin */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{ background: "#EDE9FE", color: "#7C3AED" }}
                >
                  {idx + 1}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  {/* Location name + map link */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: "#1E293B" }}>
                      {loc.label}
                    </span>
                    {loc.link && (
                      <a
                        href={loc.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors hover:bg-purple-100"
                        style={{ color: "#7C3AED", background: "#F5F3FF" }}
                        title={loc.link}
                      >
                        <MapPin size={10} />
                        View Map
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>

                  {/* Time + Concept */}
                  <div className="mt-2 flex flex-col gap-1.5">
                    {loc.time && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "#475569" }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="10" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                        </svg>
                        <span className="font-medium">{loc.time}</span>
                      </div>
                    )}
                    {loc.concept && (
                      <div className="flex items-start gap-1.5 text-xs" style={{ color: "#475569" }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="mt-0.5 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485" />
                        </svg>
                        <span className="whitespace-pre-wrap">{loc.concept}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                  title="Remove location"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
