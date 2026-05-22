import { forwardRef, useEffect, useImperativeHandle, useState, type ReactNode } from "react";
import {
  Check,
  CheckCircle2,
  MapPin,
  Palette,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { saveCreativeConfirmation } from "../api/creativeConfirmation.api";
import EnhancedSelect from "../components/EnhancedSelect";
import axios from "axios";

const defaultColors = ["Red", "Blue", "White", "Black", "Gold", "Pastel", "Green"];

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const cardClass = "overflow-visible rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60";

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

export type CreativeConfirmationHandle = {
  save: () => Promise<boolean>;
  isSaved: boolean;
  colorCount: number;
  clientApproved: boolean;
};

type CreativeConfirmationSectionProps = {
  leadId: string;
  clientName?: string;
  flowType?: string;
  onSavedChange?: (saved: boolean) => void;
};

const CreativeConfirmationSection = forwardRef<CreativeConfirmationHandle, CreativeConfirmationSectionProps>(
function CreativeConfirmationSection({ leadId, clientName: _clientName = "Client", flowType: _flowType = "", onSavedChange }, ref) {
  const actualId = leadId;

  const [, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [customColor, setCustomColor] = useState("");
  const [availableColors, setAvailableColors] = useState<string[]>(defaultColors);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    costume_type: "",
    color_preferences: [] as string[],
    costume_requirements: "",
    event_theme: "",
    mood_description: "",
    location_name: "",
    location_type: "",
    google_map_link: "",
    client_approved: false,
    existing_reference_images: [] as string[],
    reference_images: [] as File[],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/creative-confirmation/${String(actualId)}`
        );
        const data = res.data?.data;
        if (!data) return;

        setIsSaved(true);
      onSavedChange?.(true);

        const colors =
          typeof data.color_preferences === "string"
            ? JSON.parse(data.color_preferences)
            : data.color_preferences || [];

        setFormData({
          costume_type: data.costume_type || "",
          color_preferences: colors,
          costume_requirements: data.costume_requirements || "",
          event_theme: data.event_theme || "",
          mood_description: data.mood_description || "",
          location_name: data.location_name || "",
          location_type: data.location_type || "",
          google_map_link: data.google_map_link || "",
          client_approved: data.client_approved || false,
          existing_reference_images: data.reference_images || [],
          reference_images: [],
        });

        const extraColors = (colors as string[]).filter((color) => !defaultColors.includes(color));
        if (extraColors.length > 0) {
          setAvailableColors([...defaultColors, ...extraColors]);
        }
      } catch (error) {
        console.error("LOAD ERROR:", error);
      }
    };

    loadData();
  }, [actualId]);


  const buildFormPayload = () => {
    const data = new FormData();
    data.append("external_lead_id", String(actualId));
    data.append("costume_type", formData.costume_type);
    data.append("costume_requirements", formData.costume_requirements);
    data.append("event_theme", formData.event_theme);
    data.append("mood_description", formData.mood_description);
    data.append("location_name", formData.location_name);
    data.append("location_type", formData.location_type);
    data.append("google_map_link", formData.google_map_link);
    data.append("client_approved", String(formData.client_approved));
    data.append("color_preferences", JSON.stringify(formData.color_preferences));
    data.append("existing_reference_images", JSON.stringify(formData.existing_reference_images));
    formData.reference_images.forEach((file) => data.append("reference_images", file));
    return data;
  };

  const handleSaveConcept = async (): Promise<boolean> => {
    try {
      setLoading(true);
      await saveCreativeConfirmation(buildFormPayload());
      setIsSaved(true);
      onSavedChange?.(true);
      return true;
    } catch (error) {
      console.error(error);
      alert("Failed to save concept");
      return false;
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSaveConcept,
    isSaved,
    colorCount: formData.color_preferences.length,
    clientApproved: formData.client_approved,
  }), [isSaved, formData.color_preferences.length, formData.client_approved]);

  const addCustomColor = () => {
    const trimmed = customColor.trim();
    if (!trimmed || availableColors.some((color) => color.toLowerCase() === trimmed.toLowerCase())) return;

    setAvailableColors([...availableColors, trimmed]);
    setFormData({
      ...formData,
      color_preferences: [...formData.color_preferences, trimmed],
    });
    setCustomColor("");
    setIsSaved(false);
      onSavedChange?.(false);
  };

  const uploadBase = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className={cardClass}>
          <SectionTitle
            icon={<Palette size={18} />}
            title="Costume Details"
            subtitle="Lock outfit style, preferred colors, and costume-specific instructions."
          />
          <div className="grid gap-5">
            <Field label="Costume Type">
              <EnhancedSelect
                value={formData.costume_type}
                onChange={(value) => {
                  setIsSaved(false);
      onSavedChange?.(false);
                  setFormData({ ...formData, costume_type: value });
                }}
                placeholder="Select costume type"
                options={[
                  { value: "Traditional", label: "Traditional" },
                  { value: "Western", label: "Western" },
                  { value: "Indo-Western", label: "Indo-Western" },
                  { value: "Casual", label: "Casual" },
                ]}
              />
            </Field>

            <div>
              <label className={labelClass}>Color Preferences</label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => {
                  const checked = formData.color_preferences.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setIsSaved(false);
      onSavedChange?.(false);
                        setFormData({
                          ...formData,
                          color_preferences: checked
                            ? formData.color_preferences.filter((item) => item !== color)
                            : [...formData.color_preferences, color],
                        });
                      }}
                      className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                        checked
                          ? "border-indigo-500 bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={customColor}
                  onChange={(event) => setCustomColor(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomColor();
                    }
                  }}
                  placeholder="Add custom color"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addCustomColor}
                  className="rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Add
                </button>
              </div>
            </div>

            <Field label="Special Requirements">
              <textarea
                className={`${inputClass} min-h-32 resize-none`}
                value={formData.costume_requirements}
                onChange={(event) => {
                  setIsSaved(false);
      onSavedChange?.(false);
                  setFormData({ ...formData, costume_requirements: event.target.value });
                }}
                placeholder="Accessories, dress code, backup outfit, restrictions..."
              />
            </Field>
          </div>
        </section>

        <section className={cardClass}>
          <SectionTitle
            icon={<Sparkles size={18} />}
            title="Concept Details"
            subtitle="Capture the creative direction, visual references, and mood notes."
          />
          <div className="grid gap-5">
            <Field label="Event Theme">
              <EnhancedSelect
                value={formData.event_theme}
                onChange={(value) => {
                  setIsSaved(false);
      onSavedChange?.(false);
                  setFormData({ ...formData, event_theme: value });
                }}
                placeholder="Select theme"
                options={[
                  { value: "Royal", label: "Royal" },
                  { value: "Vintage", label: "Vintage" },
                  { value: "Minimalist", label: "Minimalist" },
                  { value: "Cinematic", label: "Cinematic" },
                ]}
              />
            </Field>

            <div>
              <label className={labelClass}>Reference Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(event) => {
                  const files = event.target.files;
                  if (!files) return;
                  const fileArray = Array.from(files);
                  setIsSaved(false);
      onSavedChange?.(false);
                  setFormData({
                    ...formData,
                    reference_images: [...formData.reference_images, ...fileArray],
                  });
                  setImagePreview([...imagePreview, ...fileArray.map((file) => URL.createObjectURL(file))]);
                }}
                className="hidden"
                id="referenceUpload"
              />

              <label
                htmlFor="referenceUpload"
                className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-indigo-300 hover:bg-indigo-50/50"
              >
                <Upload size={24} className="mb-2 text-slate-400" />
                <p className="text-sm font-bold text-slate-800">Click to upload images</p>
                <p className="mt-1 text-xs text-slate-400">PNG, JPG up to 10MB</p>
              </label>

              {(formData.existing_reference_images.length > 0 || imagePreview.length > 0) && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {formData.existing_reference_images.map((img, index) => (
                    <div key={`existing-${index}`} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <img
                        src={`${uploadBase}/uploads/${img}`}
                        alt="existing preview"
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsSaved(false);
      onSavedChange?.(false);
                          setFormData({
                            ...formData,
                            existing_reference_images: formData.existing_reference_images.filter((_, idx) => idx !== index),
                          });
                        }}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 opacity-0 shadow transition group-hover:opacity-100"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {imagePreview.map((img, index) => (
                    <div key={`new-${index}`} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <img src={img} alt="new preview" className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsSaved(false);
      onSavedChange?.(false);
                          setImagePreview(imagePreview.filter((_, idx) => idx !== index));
                          setFormData({
                            ...formData,
                            reference_images: formData.reference_images.filter((_, idx) => idx !== index),
                          });
                        }}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 opacity-0 shadow transition group-hover:opacity-100"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Field label="Mood Description">
              <textarea
                className={`${inputClass} min-h-32 resize-none`}
                value={formData.mood_description}
                onChange={(event) => {
                  setIsSaved(false);
      onSavedChange?.(false);
                  setFormData({ ...formData, mood_description: event.target.value });
                }}
                placeholder="Example: warm, romantic, editorial, high contrast, playful..."
              />
            </Field>
          </div>
        </section>
      </div>

      <section className={`${cardClass} mt-6`}>
        <SectionTitle
          icon={<MapPin size={18} />}
          title="Location Details"
          subtitle="Record the selected location and map reference for the creative team."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Location Name">
            <input
              className={inputClass}
              type="text"
              value={formData.location_name}
              onChange={(event) => {
                setIsSaved(false);
      onSavedChange?.(false);
                setFormData({ ...formData, location_name: event.target.value });
              }}
              placeholder="Venue or shoot location"
            />
          </Field>
          <Field label="Location Type">
            <EnhancedSelect
              value={formData.location_type}
              onChange={(value) => {
                setIsSaved(false);
      onSavedChange?.(false);
                setFormData({ ...formData, location_type: value });
              }}
              placeholder="Indoor/Outdoor"
              options={[
                { value: "Indoor", label: "Indoor" },
                { value: "Outdoor", label: "Outdoor" },
              ]}
            />
          </Field>
          <Field label="Google Map Link">
            <input
              className={inputClass}
              type="url"
              value={formData.google_map_link}
              onChange={(event) => {
                setIsSaved(false);
      onSavedChange?.(false);
                setFormData({ ...formData, google_map_link: event.target.value });
              }}
              placeholder="https://maps.google.com/..."
            />
          </Field>
        </div>
        <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
          <span className="font-bold">Note:</span> For outdoor locations, check weather conditions and keep a backup plan ready.
        </div>
      </section>

      <section className={`${cardClass} mt-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle
            icon={<CheckCircle2 size={18} />}
            title="Client Approval"
            subtitle="Confirm this only after the client has approved the creative direction."
          />
          <button
            type="button"
            onClick={() => {
              setIsSaved(false);
      onSavedChange?.(false);
              setFormData({ ...formData, client_approved: !formData.client_approved });
            }}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold transition ${
              formData.client_approved
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${formData.client_approved ? "bg-emerald-600 text-white" : "bg-slate-100 text-transparent"}`}>
              <Check size={12} strokeWidth={3} />
            </span>
            {formData.client_approved ? "Approved" : "Mark Approved"}
          </button>
        </div>
      </section>

    </div>
  );
});

export default CreativeConfirmationSection;

