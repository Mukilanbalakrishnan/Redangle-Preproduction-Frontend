import { Check, ChevronDown, Search, MapPin, Plus, Trash2 } from "lucide-react";
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
  const [time, setTime] = useState("");
  const [concept, setConcept] = useState("");

  const handleAdd = () => {
    const name = label.trim();
    const url = link.trim();
    const shootTime = time.trim();
    const shootConcept = concept.trim();
    if (!name && !url && !shootTime && !shootConcept) return;

    let formattedLink = url;
    if (url && !/^https?:\/\//i.test(url)) {
      formattedLink = `https://${url}`;
    }

    onAdd({
      label: name || `Location ${locations.length + 1}`,
      link: formattedLink,
      time: shootTime,
      concept: shootConcept,
    });
    setLabel("");
    setLink("");
    setTime("");
    setConcept("");
  };

  return (
    <div className="rounded-2xl p-6 bg-white" style={{ border: "1px solid #E5E7EB" }}>
      <div className="mb-5 flex items-center gap-2">
        <MapPin size={18} className="text-purple-600" />
        <h3 className="text-sm font-bold" style={{ color: "#111827" }}>
          Shoot Locations
        </h3>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Location Name (e.g. Kalpakkam Beach)"
            className="rounded-xl border px-3 py-2 text-sm outline-none focus:border-purple-400"
          />
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Google Map Link (URL)"
            className="rounded-xl border px-3 py-2 text-sm outline-none focus:border-purple-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_minmax(0,1fr)_auto]">
          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Shooting Time (e.g. 5:30 AM - 7:00 AM)"
            className="rounded-xl border px-3 py-2 text-sm outline-none focus:border-purple-400"
          />
          <textarea
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Concept (e.g. Soft sunrise lighting, candid movement...)"
            rows={2}
            className="min-h-[42px] resize-y rounded-xl border px-3 py-2 text-sm outline-none focus:border-purple-400"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-[42px] shrink-0 items-center justify-center gap-1 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {locations.length > 0 && (
        <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
          {locations.map((loc, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 rounded-xl px-3 py-3 text-xs font-medium"
              style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
            >
              <div className="min-w-0 flex-1">
                <span className="block font-bold text-gray-700">
                  Location {idx + 1}: {loc.label}
                </span>
                {loc.link && (
                  <a
                    href={loc.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-purple-600 hover:underline"
                  >
                    {loc.link}
                  </a>
                )}
                {loc.time && (
                  <span className="mt-1 block text-gray-600">Time: {loc.time}</span>
                )}
                {loc.concept && (
                  <span className="mt-1 block whitespace-pre-wrap text-gray-600">
                    Concept: {loc.concept}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 shrink-0"
                title="Remove location"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
