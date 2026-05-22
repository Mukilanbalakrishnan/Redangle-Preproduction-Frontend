import { useEffect, useState, type ReactNode } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Boxes,
    Camera,
    Check,
    ClipboardList,
    Lightbulb,
    PenLine,
    Plus,
    Sparkles,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { updateCurrentStage } from "../api/stageTracking.api";
import { saveCreativePlanning, getCreativePlanning } from "../api/creativePlanning.api";

const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const cardClass = "rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60";

const equipmentItems = [
    "DSLR Camera",
    "Mirrorless Camera",
    "Drone",
    "Gimbal Stabilizer",
    "Tripod",
    "Wide Angle Lens",
    "Telephoto Lens",
    "Prime Lens",
];

const lightingItems = ["Softbox", "Ring Light", "LED Panel", "Studio Strobe", "Reflector", "Diffuser"];

const propItems = [
    "Backdrops",
    "Flower Arrangements",
    "Furniture Props",
    "Custom Signage",
    "Fabrics/Drapes",
    "Decorative Items",
];

function SectionTitle({
    icon,
    title,
    subtitle,
}: {
    icon: ReactNode;
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                {icon}
            </div>
            <div>
                <h2 className="text-sm font-bold text-slate-950">{title}</h2>
                {subtitle && <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            {children}
        </div>
    );
}

function CheckboxGroup({
    items,
    selected,
    customItems,
    onToggle,
    onAddCustom,
    onRemoveCustom,
    onDirty,
}: {
    items: string[];
    selected: string[];
    customItems: string[];
    onToggle: (item: string) => void;
    onAddCustom: (val: string) => void;
    onRemoveCustom: (val: string) => void;
    onDirty: () => void;
}) {
    const [input, setInput] = useState("");

    const handleAdd = () => {
        const trimmed = input.trim();
        if (trimmed && !customItems.includes(trimmed) && !items.includes(trimmed)) {
            onDirty();
            onAddCustom(trimmed);
            setInput("");
        }
    };

    return (
        <div>
            <div className="grid gap-3 sm:grid-cols-2">
                {[...items, ...customItems].map((item) => {
                    const checked = selected.includes(item);
                    const isCustom = customItems.includes(item);
                    return (
                        <button
                            key={item}
                            type="button"
                            onClick={() => {
                                onDirty();
                                onToggle(item);
                            }}
                            className={`group flex min-h-[48px] items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                                checked
                                    ? "border-indigo-500 bg-indigo-50 shadow-sm shadow-indigo-100"
                                    : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                            }`}
                        >
                            <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                    checked ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-transparent"
                                }`}
                            >
                                <Check size={12} strokeWidth={3} />
                            </span>
                            <span className={`min-w-0 flex-1 text-xs font-semibold ${checked ? "text-indigo-700" : "text-slate-600"}`}>
                                {item}
                            </span>
                            {isCustom && (
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onDirty();
                                        onRemoveCustom(item);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            onDirty();
                                            onRemoveCustom(item);
                                        }
                                    }}
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                    title="Remove custom item"
                                >
                                    <X size={13} />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                <input
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            handleAdd();
                        }
                    }}
                    placeholder="Type custom item..."
                    className={inputClass}
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex h-[46px] items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                    <Plus size={15} /> Add
                </button>
            </div>
        </div>
    );
}

export default function CreativePlanning({
    client,
    onNext,
    onBack,
}: {
    client: any;
    onNext: () => void;
    onBack: () => void;
}) {
    const actualId = client.id;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [flowType, setFlowType] = useState<string>("");

    useEffect(() => {
        const fetchFlow = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/crm/leads/${actualId}/phase-info`
                );
                setFlowType(res.data?.data?.flow_type || "");
            } catch (err) {
                console.error("Failed to fetch phase info", err);
            }
        };
        fetchFlow();
    }, [actualId]);

    const [planData, setPlanData] = useState({
        event_list: "",
        equipment_required: [] as string[],
        lighting_setup: [] as string[],
        props_required: [] as string[],
        special_notes: "",
    });

    const [customEquipment, setCustomEquipment] = useState<string[]>([]);
    const [customLighting, setCustomLighting] = useState<string[]>([]);
    const [customProps, setCustomProps] = useState<string[]>([]);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const res = await getCreativePlanning(String(actualId));
                const data = res?.data?.data || res?.data || res;
                if (!data || Object.keys(data).length === 0 || !data.external_lead_id) return;

                setIsSaved(true);

                const getArr = (val: any) => {
                    if (Array.isArray(val)) return val;
                    if (typeof val === "string") {
                        try {
                            return JSON.parse(val);
                        } catch {
                            return [];
                        }
                    }
                    return [];
                };

                const equipment = getArr(data.equipment_required);
                const lighting = getArr(data.lighting_setup);
                const props = getArr(data.props_required);

                setPlanData({
                    event_list: data.event_list || "",
                    equipment_required: equipment,
                    lighting_setup: lighting,
                    props_required: props,
                    special_notes: data.special_notes || "",
                });

                setCustomEquipment(equipment.filter((item: string) => !equipmentItems.includes(item)));
                setCustomLighting(lighting.filter((item: string) => !lightingItems.includes(item)));
                setCustomProps(props.filter((item: string) => !propItems.includes(item)));
            } catch (err) {
                console.error("Failed to fetch creative planning", err);
            }
        };

        fetchPlan();
    }, [actualId]);

    const markDirty = () => setIsSaved(false);

    const toggle = (field: "equipment_required" | "lighting_setup" | "props_required", item: string) => {
        const current = planData[field];
        setPlanData({
            ...planData,
            [field]: current.includes(item) ? current.filter((i) => i !== item) : [...current, item],
        });
    };

    const addCustom = (
        field: "equipment_required" | "lighting_setup" | "props_required",
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        val: string
    ) => {
        setter((prev) => [...prev, val]);
        setPlanData((prev) => ({ ...prev, [field]: [...prev[field], val] }));
    };

    const removeCustom = (
        field: "equipment_required" | "lighting_setup" | "props_required",
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        val: string
    ) => {
        setter((prev) => prev.filter((i) => i !== val));
        setPlanData((prev) => ({ ...prev, [field]: prev[field].filter((i) => i !== val) }));
    };

    const handleSavePlan = async () => {
        try {
            setLoading(true);
            await saveCreativePlanning({
                external_lead_id: String(actualId),
                ...planData,
            });
            setIsSaved(true);
        } catch (error) {
            console.error(error);
            alert("Failed to save planning");
        } finally {
            setLoading(false);
        }
    };

    const handleProceed = async () => {
        try {
            setLoading(true);
            await updateCurrentStage({
                external_lead_id: String(actualId),
                stage_name: "team_assignment",
            });
            if (flowType === "post_wedding") {
                alert(
                    "Creative planning saved.\n\nNext stage: Event -> Event Coordinator. Go to the Event Coordinator module to set event details, assign the event team, and monitor event execution."
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

    const selectedCount =
        planData.equipment_required.length + planData.lighting_setup.length + planData.props_required.length;

    return (
        <div className="pb-28">
            <div className="mb-6 overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-sm">
                <div className="relative p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.28),transparent_34%),linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.94))]" />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <button
                                type="button"
                                onClick={onBack}
                                className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                                title="Go back"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-100">
                                CRM Planning
                            </div>
                            <h1 className="text-2xl font-black tracking-tight">Creative Planning</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                                Convert the approved creative direction into an internal equipment, lighting, props, and execution plan.
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
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Selected</p>
                                <p className="mt-1 truncate text-sm font-bold">{selectedCount || "None"}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Status</p>
                                <p className="mt-1 truncate text-sm font-bold">{isSaved ? "Saved" : "Draft"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <section className={cardClass}>
                <SectionTitle
                    icon={<ClipboardList size={18} />}
                    title="Event List"
                    subtitle="Break down the event sequence, rituals, and must-cover moments for the team."
                />
                <Field label="Event Plan">
                    <textarea
                        className={`${inputClass} min-h-44 resize-none`}
                        value={planData.event_list}
                        onChange={(event) => {
                            markDirty();
                            setPlanData({ ...planData, event_list: event.target.value });
                        }}
                        placeholder="Example: bride entry, groom entry, family portraits, couple shoot, candid ceremony moments..."
                    />
                </Field>
            </section>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <section className={cardClass}>
                    <SectionTitle
                        icon={<Camera size={18} />}
                        title="Equipment Required"
                        subtitle="Select camera bodies, lenses, stabilizers, and other production gear."
                    />
                    <CheckboxGroup
                        items={equipmentItems}
                        selected={planData.equipment_required}
                        customItems={customEquipment}
                        onDirty={markDirty}
                        onToggle={(item) => toggle("equipment_required", item)}
                        onAddCustom={(val) => addCustom("equipment_required", setCustomEquipment, val)}
                        onRemoveCustom={(val) => removeCustom("equipment_required", setCustomEquipment, val)}
                    />
                </section>

                <section className={cardClass}>
                    <SectionTitle
                        icon={<Lightbulb size={18} />}
                        title="Lighting Setup"
                        subtitle="Plan key lights, modifiers, panels, and backup lighting requirements."
                    />
                    <CheckboxGroup
                        items={lightingItems}
                        selected={planData.lighting_setup}
                        customItems={customLighting}
                        onDirty={markDirty}
                        onToggle={(item) => toggle("lighting_setup", item)}
                        onAddCustom={(val) => addCustom("lighting_setup", setCustomLighting, val)}
                        onRemoveCustom={(val) => removeCustom("lighting_setup", setCustomLighting, val)}
                    />
                </section>

                <section className={cardClass}>
                    <SectionTitle
                        icon={<Boxes size={18} />}
                        title="Props Required"
                        subtitle="Confirm creative props, backdrops, fabrics, signage, and decor elements."
                    />
                    <CheckboxGroup
                        items={propItems}
                        selected={planData.props_required}
                        customItems={customProps}
                        onDirty={markDirty}
                        onToggle={(item) => toggle("props_required", item)}
                        onAddCustom={(val) => addCustom("props_required", setCustomProps, val)}
                        onRemoveCustom={(val) => removeCustom("props_required", setCustomProps, val)}
                    />
                </section>

                <section className={cardClass}>
                    <SectionTitle
                        icon={<PenLine size={18} />}
                        title="Special Notes"
                        subtitle="Add internal instructions, risks, reminders, and client-specific sensitivities."
                    />
                    <Field label="Notes">
                        <textarea
                            className={`${inputClass} min-h-[260px] resize-none`}
                            value={planData.special_notes}
                            onChange={(event) => {
                                markDirty();
                                setPlanData({ ...planData, special_notes: event.target.value });
                            }}
                            placeholder="Example: avoid flash during rituals, keep backup batteries ready, confirm location permissions..."
                        />
                    </Field>
                </section>
            </div>

            <section className={`${cardClass} mt-6`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <SectionTitle
                        icon={<Sparkles size={18} />}
                        title="Planning Readiness"
                        subtitle="Save this plan before handing the lead to team assignment."
                    />
                    <div className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold ${
                        isSaved
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${
                            isSaved ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                        }`}>
                            <Check size={12} strokeWidth={3} />
                        </span>
                        {isSaved ? "Ready for team assignment" : "Draft changes pending"}
                    </div>
                </div>
            </section>

            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] lg:left-[280px] lg:px-8">
                <div className="mx-auto flex max-w-[1500px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-500">
                        {isSaved ? "Planning saved. You can assign the team now." : "Save the plan before assigning the team."}
                    </div>
                    <div className="flex flex-wrap justify-end gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSavePlan}
                            disabled={loading}
                            className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 disabled:shadow-none"
                        >
                            {loading ? "Saving..." : "Save Plan"}
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

