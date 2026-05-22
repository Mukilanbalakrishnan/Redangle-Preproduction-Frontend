import { useState, useEffect, useRef, type ReactNode } from 'react'
import {
  ArrowRight,
  AlertCircle,
  Check,
  ClipboardList,
  Clock,
  FileText,
  ChevronDown,
  GitBranch,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import EmailCompose from './EmailCompose'
import { saveEventDetails, getEventDetailsByLeadId } from "../api/eventDetails.api";
import { updateCurrentStage } from "../api/stageTracking.api";
import { getExternalLeadById } from "../api/externalLead.api";
import InvoicePreviewModal, { type PreviewInvoice } from "./InvoicePreviewModal";
import axios from 'axios';
import CreativeConfirmationSection, { type CreativeConfirmationHandle } from './CreativeConfirmationSection';
import EnhancedSelect from '../components/EnhancedSelect';

const toDateInputValue = (value?: string | Date | null) => {
  if (!value) return "";

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const slashParts = value.split("/");
    if (slashParts.length === 3) {
      const [day, month, year] = slashParts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface Props {
  client: {
    id: string
    rawId?: string
    serialNumber?: string
    name: string
    email: string
    phone: string
    location?: string
    eventDate?: string
    shootType: string
  }
  onBack: () => void
  onNext?: () => void
  expandCreativeSection?: boolean
}

interface EventFormData {
  preferredDate: string;
  preferredTime: string;
  eventLocation: string;
  contactPersonName: string;
  contactPersonNumber: string;
  budgetRange: string;
  services: string[];
  deliverables: string[];
  invoiceAttached: boolean;
  clientRequirements: string;
  priorityLevel: string;
}

type FlowType = '' | 'pre_wedding' | 'post_wedding';

type View = 'form' | 'email'

const getFlowTypeLabel = (selectedFlowType: FlowType) => {
  if (selectedFlowType === 'pre_wedding') return 'Pre-wedding';
  if (selectedFlowType === 'post_wedding') return 'Post-wedding';
  return 'Workflow';
};

const getPhaseHandoffMessage = (phase: string, selectedFlowType: FlowType) => {
  if (phase === 'pre_production') {
    return selectedFlowType === 'pre_wedding'
      ? 'Next stage: Pre-production -> CRM. Continue with Creative Confirmation, then team assignment.'
      : 'Next stage: Pre-production -> CRM. Continue with pre-production planning and team assignment.';
  }

  if (phase === 'event') {
    if (selectedFlowType === 'post_wedding') {
      return 'Next stage: Continue with Creative Confirmation. The Event Coordinator handoff appears after creative confirmation is complete.';
    }
    return 'Next stage: Event -> Event Coordinator. Go to the Event Coordinator module to set event details, assign the event team, and monitor event execution.';
  }

  if (phase === 'post_production') {
    return 'Next stage: Post-production -> Operational Manager. Go to the Operational Manager module for editor assignment and production tracking.';
  }

  return 'Saved. Continue to the next workflow stage.';
};

const getPhaseDestination = (phase: string, phaseStatus: string, selectedFlowType: FlowType) => {
  const flowLabel = getFlowTypeLabel(selectedFlowType);

  if (phase === 'event') {
    return {
      title: 'This client is in Event stage',
      owner: 'Event Coordinator',
      path: 'Event -> Event Coordinator',
      description: 'Pre-production is already complete. Continue this client from the Event Coordinator module for event setup, event team assignment, and live event tracking.',
      target: '/event-coordinator/client',
      completed: false,
    };
  }

  if (phase === 'post_production') {
    if (phaseStatus === 'completed') {
      return {
        title: 'This client flow is complete',
        owner: 'Completed',
        path: `${flowLabel} -> Post-production -> Completed`,
        description: 'All selected post-production roles have uploaded their work and CRM has verified every deliverable. The client work is complete.',
        target: '/crm/client',
        completed: true,
      };
    }

    return {
      title: 'This client is in Post-production stage',
      owner: 'Operational Manager',
      path: 'Post-production -> Operational Manager',
      description: 'This client has moved past CRM pre-production. Continue from Operational Manager for editor assignment and production tracking.',
      target: '/operational-manager/dashboard',
      completed: false,
    };
  }

  return null;
};

const flowOptions: Array<{
  value: Exclude<FlowType, ''>
  label: string
  description: string
  path: string
}> = [
  {
    value: 'pre_wedding',
    label: 'Pre-Wedding',
    description: 'Starts with planning and pre-production work.',
    path: 'Pre-production -> Event -> Post-production',
  },
  {
    value: 'post_wedding',
    label: 'Post-Wedding',
    description: 'Starts directly from event execution.',
    path: 'Event -> Pre-production -> Post-production',
  },
];

const defaultServices = ['Traditional photo', 'Video', 'Candid Photo', 'Candid Video', 'Drone'];
const defaultDeliverables = ['Album', 'Custom Videos', 'Raw Footage', 'Teaser'];

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';
const cardClass = 'overflow-visible rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60';

const priorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Very High', label: 'Very High' },
];

const meetingTypeOptions = [
  { value: 'In Person', label: 'In Person' },
  { value: 'Video Call', label: 'Video Call' },
  { value: 'Phone Call', label: 'Phone Call' },
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

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export default function InitialCallDetails({ client, onBack, onNext, expandCreativeSection }: Props) {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('form')
  const actualId = client.id;
  const [clientId, setClientId] = useState(actualId)
  const [clientName, setClientName] = useState(client.name)
  const [clientPhone, setClientPhone] = useState(client.phone)
  const [clientEmail, setClientEmail] = useState(client.email)
  const [flowType, setFlowType] = useState<FlowType>('')
  const [persistedFlowType, setPersistedFlowType] = useState<FlowType>('')
  const [currentPhase, setCurrentPhase] = useState('')
  const [phaseStatus, setPhaseStatus] = useState('')
  const [currentStage, setCurrentStage] = useState('')
  const [creativeOpen, setCreativeOpen] = useState(Boolean(expandCreativeSection))
  const [creativeSaved, setCreativeSaved] = useState(false)
  const creativeRef = useRef<CreativeConfirmationHandle>(null)

  const [formData, setFormData] = useState<EventFormData>(() => {
    const preferredDate = toDateInputValue(client.eventDate);
    return {
      preferredDate,
      preferredTime: "",
      eventLocation: client.location ?? "",
      contactPersonName: "",
      contactPersonNumber: "",
      budgetRange: "",
      services: [],
      deliverables: [],
      invoiceAttached: false,
      clientRequirements: "",
      priorityLevel: "",
    };
  });
  const [meetingType, setMeetingType] = useState<MeetingType>("");
  const [showToast, setShowToast] = useState(false)
  const [otherServiceText, setOtherServiceText] = useState("")
  const [otherDeliverableText, setOtherDeliverableText] = useState("")
  const [meetingDetails, setMeetingDetails] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const defaultInvoiceData: PreviewInvoice = {
    id: actualId,
    invoiceId: actualId,
    name: client.name,
    contact: client.phone,
    billingDate: new Date().toISOString(),
    eventName: "",
    billNo: `RAS - ${client.serialNumber || client.id || '100'}`,
    location: "",
    totalAmount: 0,
    paid: 0,
    discount: 0,
    itemsByCategory: {},
    qtyOverrides: {},
    engagementDetails: "",
    weddingDetails: "",
    receptionDetails: "",
    ritualsDetails: ""
  };
  const [invoiceData, setInvoiceData] = useState<PreviewInvoice | null>(defaultInvoiceData);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  useEffect(() => {
    async function fetchPhaseInfo() {
      try {
        const [phaseRes, stageRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/crm/leads/${actualId}/phase-info`),
          axios.get(`${import.meta.env.VITE_API_URL}/stage/${actualId}`).catch(() => null),
        ]);
        const phaseInfo = phaseRes.data?.data;
        const nextFlowType = (phaseInfo?.flow_type || '') as FlowType;
        setFlowType(nextFlowType);
        setPersistedFlowType(nextFlowType);
        setCurrentPhase(phaseInfo?.current_phase || '');
        setPhaseStatus(phaseInfo?.phase_status || '');
        const stage = stageRes?.data?.data?.current_stage || '';
        setCurrentStage(stage);
        if (stage === 'creative_confirmation') setCreativeOpen(true);
      } catch (err) {
        console.error("Failed to fetch phase info", err);
      }
    }

    async function fetchEventDetails() {
      try {
        const res = await getEventDetailsByLeadId(actualId);
        const data = res?.data?.data || res?.data || res;
        if (data && data.client_name) {
          setClientName(data.client_name);
          if (data.phone) setClientPhone(data.phone);
          if (data.email) setClientEmail(data.email);
          if (data.meeting_type) setMeetingType(data.meeting_type as MeetingType);
          if (data.meeting_details) setMeetingDetails(data.meeting_details);

          let fetchedServices = data.services || [];
          if (typeof fetchedServices === 'string') {
            try { fetchedServices = JSON.parse(fetchedServices); } catch(e) { }
          }
          let parsedServices: string[] = [];
          for (const s of fetchedServices) {
             if (s.startsWith("Others: ")) {
                 parsedServices.push("Others");
                 setOtherServiceText(s.replace("Others: ", ""));
             } else {
                 parsedServices.push(s);
             }
          }

          let fetchedDeliverables = data.deliverables || [];
          if (typeof fetchedDeliverables === 'string') {
            try { fetchedDeliverables = JSON.parse(fetchedDeliverables); } catch(e) { }
          }
          let parsedDeliverables: string[] = [];
          for (const d of fetchedDeliverables) {
             if (d.startsWith("Others: ")) {
                 parsedDeliverables.push("Others");
                 setOtherDeliverableText(d.replace("Others: ", ""));
             } else {
                 parsedDeliverables.push(d);
             }
          }

          setFormData(prev => ({
            ...prev,
            preferredDate: toDateInputValue(data.preferred_date) || prev.preferredDate,
            preferredTime: data.preferred_time || prev.preferredTime,
            eventLocation: data.event_location || prev.eventLocation,
            contactPersonName: data.contact_person_name || prev.contactPersonName,
            contactPersonNumber: data.contact_person_number || prev.contactPersonNumber,
            budgetRange: data.budget_range || prev.budgetRange,
            services: parsedServices,
            deliverables: parsedDeliverables,
            clientRequirements: data.client_requirements || prev.clientRequirements,
            priorityLevel: data.priority_level || prev.priorityLevel,
            invoiceAttached: data.invoice_attached || prev.invoiceAttached
          }));
        }
      } catch (err) {
        console.error("Failed to fetch existing event details", err);
      }
    }
    fetchPhaseInfo();
    fetchEventDetails();
  }, [actualId]);

  useEffect(() => {
    async function fetchInvoice() {
      if (!actualId) return;
      setIsLoadingInvoice(true);
      try {
        const res = await getExternalLeadById(actualId);
        if (res?.data) {
          const lead = res.data;
          let extInvoice: any = {};
          try {
             extInvoice = typeof lead.invoice_data === 'string' ? JSON.parse(lead.invoice_data) : (lead.invoice_data || {});
          } catch (e) {
             console.error("Failed to parse invoice_data", e);
             extInvoice = {};
          }
          
          const computedTotal = (Number(extInvoice.paid) || 0) + (Number(extInvoice.balance) || 0) + (Number(extInvoice.discount) || 0);

          setInvoiceData({
            id: lead.id?.toString(),
            invoiceId: lead.id || lead.external_id || client.id,
            name: lead.lead_name || client.name,
            contact: lead.phone || client.phone,
            billingDate: Object.keys(extInvoice).length > 0 ? (extInvoice.billingDate || extInvoice.date || lead.created_at) : (lead.created_at || new Date().toISOString()),
            eventName: extInvoice.eventName ?? "",
            billNo: lead.lead_serial_number || extInvoice.billNo || "",
            location: extInvoice.location ?? "",
            totalAmount: Number(extInvoice.totalAmount ?? extInvoice.total ?? lead.invoice_total ?? computedTotal),
            paid: Number(extInvoice.paid ?? lead.invoice_paid ?? 0),
            discount: Number(extInvoice.discount ?? lead.discount ?? 0),
            itemsByCategory: extInvoice.itemsByCategory || {},
            qtyOverrides: extInvoice.qtyOverrides || {},
            engagementDetails: extInvoice.engagement || extInvoice.engagementDetails || "",
            weddingDetails: extInvoice.wedding || extInvoice.weddingDetails || "",
            receptionDetails: extInvoice.reception || extInvoice.receptionDetails || "",
            ritualsDetails: extInvoice.rituals || extInvoice.ritualsDetails || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch invoice data", err);
      } finally {
        setIsLoadingInvoice(false);
      }
    }
    fetchInvoice();
  }, [actualId, client]);

  type MeetingType = "" | "In Person" | "Video Call" | "Phone Call";

  const handleScheduleMeeting = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setView('email')
  }

  useEffect(() => {
    if (!meetingType) return;

    const defaultText: Record<Exclude<MeetingType, "">, string> = {
      "In Person": "Meeting will take place at office location.",
      "Video Call": "A meeting link will be shared via email.",
      "Phone Call": "Client will be contacted via phone call.",
    };

    setMeetingDetails(defaultText[meetingType] ?? "");
  }, [meetingType]);


  if (view === 'email') {
    return <EmailCompose onBack={() => setView('form')} client={client} />
  }

  // For post_wedding flow, the backend sets current_phase='event' immediately
  // when the flow type is chosen, but we still want the user to fill in
  // Creative Confirmation before showing the Event CRM
  // handoff. Treat the event handoff as visible only after creative planning
  // has been completed (current_stage advanced to team_assignment or later).
  const postWeddingCreativeStepsPending =
    persistedFlowType === 'post_wedding' &&
    currentPhase === 'event' &&
    currentStage !== 'team_assignment' &&
    currentStage !== 'completed_assign_team';

  const phaseDestination = persistedFlowType && currentPhase && currentPhase !== 'not_started' && currentPhase !== 'pre_production' && !postWeddingCreativeStepsPending
    ? getPhaseDestination(currentPhase, phaseStatus, persistedFlowType)
    : null;

  if (phaseDestination) {
    return (
      <div className="rounded-[32px] bg-white p-8 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              phaseDestination.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {phaseDestination.completed ? <Check size={22} /> : <AlertCircle size={22} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: '#9CA3AF' }}>
              {phaseDestination.completed ? 'Workflow complete' : 'Workflow handoff'}
            </p>
            <h1 className="mt-1 text-xl font-bold" style={{ color: '#111827' }}>
              {phaseDestination.title}
            </h1>
            <p className="mt-2 text-sm leading-6" style={{ color: '#4B5563' }}>
              {phaseDestination.description}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: '#94A3B8' }}>
                  {phaseDestination.completed ? 'Final status' : 'Current owner'}
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: '#0F172A' }}>
                  {phaseDestination.owner}
                </p>
              </div>
              <div className="rounded-2xl bg-indigo-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: '#818CF8' }}>
                  {phaseDestination.completed ? 'Flow path' : 'Next path'}
                </p>
                <p className="mt-1 text-sm font-semibold text-indigo-700">
                  {phaseDestination.path}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onBack}
                className="rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-gray-50"
                style={{ borderColor: '#E5E7EB', color: '#374151' }}
              >
                Back to CRM Clients
              </button>
              {!phaseDestination.completed && (
                <button
                  onClick={() => {
                    navigate(phaseDestination.target);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  style={{ background: '#5B5FC7' }}
                >
                  Go to {phaseDestination.owner} <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveEventDetails = async () => {
    try {
      if (!flowType) {
        alert("Please select a flow type before saving");
        return;
      }

      const finalServices = formData.services.map(s => s === 'Others' && otherServiceText ? `Others: ${otherServiceText}` : s)
      const finalDeliverables = formData.deliverables.map(d => d === 'Others' && otherDeliverableText ? `Others: ${otherDeliverableText}` : d)
      let nextPhase = currentPhase;

      if (!persistedFlowType || flowType !== persistedFlowType) {
        const flowRes = await axios.patch(
          `${import.meta.env.VITE_API_URL}/crm/leads/${actualId}/flow-type`,
          { flow_type: flowType }
        );

        nextPhase =
          flowRes.data?.data?.current_phase ||
          (flowType === 'pre_wedding' ? 'pre_production' : 'event');
        setPersistedFlowType(flowType);
        setCurrentPhase(nextPhase);
      }

      await saveEventDetails({
        external_lead_id: String(actualId),

        client_name: clientName,
        email: clientEmail,
        phone: clientPhone,
        contact_person_name: formData.contactPersonName,
        contact_person_number: formData.contactPersonNumber,

        event_type: client.shootType,
        event_location: formData.eventLocation,
        services: finalServices,
        deliverables: finalDeliverables,
        invoice_attached: formData.invoiceAttached,

        preferred_date: formData.preferredDate,
        preferred_time: formData.preferredTime,
        budget_range: formData.budgetRange,
        priority_level: formData.priorityLevel,

        meeting_type: meetingType,
        meeting_details: meetingDetails,

        client_requirements: formData.clientRequirements,
      });

      const effectivePhase = nextPhase || currentPhase;
      const shouldContinueToCreative =
        effectivePhase === 'pre_production' || flowType === 'post_wedding';

      if (shouldContinueToCreative) {
        await updateCurrentStage({
          external_lead_id: String(actualId),
          stage_name: "creative_confirmation",
        });

        setCreativeOpen(true);
        const creativeOk = await creativeRef.current?.save();
        if (!creativeOk) {
          alert("Please complete creative confirmation details before continuing.");
          return;
        }

        await updateCurrentStage({
          external_lead_id: String(actualId),
          stage_name: "team_assignment",
        });

        if (flowType === 'post_wedding') {
          alert(
            'Event and creative details saved.\n\nNext stage: Event -> Event Coordinator. Go to the Event Coordinator module to set event details, assign the event team, and monitor event execution.'
          );
          navigate('/event-coordinator/client');
          return;
        }

        const handoffPhase = flowType === 'pre_wedding' ? 'pre_production' : effectivePhase;
        alert(`Event and creative details saved successfully.\n\n${getPhaseHandoffMessage(handoffPhase, flowType)}`);
        if (onNext) onNext();
      } else {
        const destinationMessage = getPhaseHandoffMessage(effectivePhase, flowType);
        alert(`Initial client details and flow type saved successfully.\n\n${destinationMessage}`);
        onBack();
      }

    } catch (error) {
      console.error(error);
      alert("Failed to save event details");
    }
  };

  const selectedFlow = flowOptions.find((option) => option.value === flowType);
  const serviceOptions = [
    ...new Set([
      ...defaultServices,
      ...formData.services.filter((service) => ![...defaultServices, 'Others'].includes(service)),
      'Others',
    ]),
  ];
  const deliverableOptions = [
    ...new Set([
      ...defaultDeliverables,
      ...formData.deliverables.filter((deliverable) => ![...defaultDeliverables, 'Others'].includes(deliverable)),
      'Others',
    ]),
  ];
  const primaryActionLabel =
    currentPhase === 'pre_production' || flowType === 'pre_wedding' || flowType === 'post_wedding'
      ? 'Save & Assign Team'
      : 'Save Details';

  return (
    <div className="relative space-y-6 overflow-visible pb-24">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 shadow-sm">
        <div className="relative px-7 py-7 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.35),transparent_34%),linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.94))]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-100">
                CRM Intake
              </div>
              <h1 className="text-2xl font-black tracking-tight">Initial Client Call Details</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Capture the first conversation, choose the production flow, and lock the details needed before the workflow starts.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Lead</p>
                <p className="mt-1 truncate text-sm font-bold">{clientId || actualId}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Flow</p>
                <p className="mt-1 truncate text-sm font-bold">{selectedFlow?.label || 'Not selected'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Event</p>
                <p className="mt-1 truncate text-sm font-bold">{client.shootType || 'Event'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Priority</p>
                <p className="mt-1 truncate text-sm font-bold">{formData.priorityLevel || 'Unset'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 overflow-visible xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <section className={cardClass}>
          <SectionTitle
            icon={<User size={18} />}
            title="Client Information"
            subtitle="Primary contact details used across CRM, event, and delivery workflows."
          />
          <div className="grid gap-4">
            <Field label="Lead ID">
              <input
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                className={`${inputClass} font-bold`}
              />
            </Field>
            <Field label="Client Name">
              <input value={clientName} onChange={(event) => setClientName(event.target.value)} className={inputClass} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Phone Number">
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} className={`${inputClass} pl-10`} />
                </div>
              </Field>
              <Field label="Email Address">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} className={`${inputClass} pl-10`} />
                </div>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Contact Person Name">
                <input
                  value={formData.contactPersonName}
                  onChange={(event) => setFormData({ ...formData, contactPersonName: event.target.value })}
                  placeholder="Enter name"
                  className={inputClass}
                />
              </Field>
              <Field label="Contact Person Number">
                <input
                  value={formData.contactPersonNumber}
                  onChange={(event) => setFormData({ ...formData, contactPersonNumber: event.target.value })}
                  placeholder="Enter number"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <SectionTitle
            icon={<GitBranch size={18} />}
            title="Flow & Event Details"
            subtitle="Select whether this lead starts with pre-production planning or direct event execution."
          />
          <div className="grid gap-4">
            <Field label="Event Type">
              <input value={client.shootType} readOnly className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-500`} />
            </Field>

            <div>
              <label className={labelClass}>Flow Type</label>
              <div className="grid gap-3 md:grid-cols-2">
                {flowOptions.map((option) => {
                  const isSelected = flowType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFlowType(option.value)}
                      className={`group rounded-[24px] border p-5 text-left transition duration-200 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100'
                          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <GitBranch size={18} />
                        </div>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                          <Check size={13} strokeWidth={3} />
                        </div>
                      </div>
                      <p className="mt-4 text-base font-black text-slate-950">{option.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{option.description}</p>
                      <div className={`mt-4 rounded-2xl px-3 py-2 text-[11px] font-bold ${isSelected ? 'bg-white text-indigo-700' : 'bg-slate-50 text-slate-600'}`}>
                        {option.path}
                      </div>
                    </button>
                  );
                })}
              </div>
              {!flowType && <p className="mt-2 text-xs text-amber-600">Select a flow type before saving.</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Preferred Date">
                <input type="date" value={formData.preferredDate} onChange={(event) => setFormData({ ...formData, preferredDate: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Preferred Time">
                <input type="time" value={formData.preferredTime} onChange={(event) => setFormData({ ...formData, preferredTime: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Event Location">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input value={formData.eventLocation} onChange={(event) => setFormData({ ...formData, eventLocation: event.target.value })} className={`${inputClass} pl-10`} />
                </div>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Budget Range">
                <input
                  value={formData.budgetRange}
                  onChange={(event) => setFormData({ ...formData, budgetRange: event.target.value })}
                  placeholder="Example: 1.5L - 2L"
                  className={inputClass}
                />
              </Field>
              <Field label="Priority Level">
                <EnhancedSelect
                  value={formData.priorityLevel}
                  onChange={(value) => setFormData({ ...formData, priorityLevel: value })}
                  placeholder="Select priority"
                  options={priorityOptions}
                />
              </Field>
            </div>
          </div>
        </section>
      </div>

      <section className={cardClass}>
        <SectionTitle
          icon={<ClipboardList size={18} />}
          title="Scope & Deliverables"
          subtitle="Use quick chips for standard work, or add custom requirements with Others."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className={labelClass}>Service Details</label>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.map((service) => {
                const checked = formData.services.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => {
                      if (checked) {
                        setFormData({ ...formData, services: formData.services.filter((item) => item !== service) });
                        if (service === 'Others') setOtherServiceText('');
                      } else {
                        setFormData({ ...formData, services: [...formData.services, service] });
                      }
                    }}
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                      checked ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm shadow-indigo-100' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                    }`}
                  >
                    {service}
                  </button>
                );
              })}
            </div>
            {formData.services.includes('Others') && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Type custom service"
                  value={otherServiceText}
                  onChange={(event) => setOtherServiceText(event.target.value)}
                  className={inputClass}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (otherServiceText.trim()) {
                      setFormData({ ...formData, services: [...formData.services.filter((item) => item !== 'Others'), otherServiceText.trim()] });
                      setOtherServiceText('');
                    }
                  }}
                  className="rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Deliverable Details</label>
            <div className="flex flex-wrap gap-2">
              {deliverableOptions.map((deliverable) => {
                const checked = formData.deliverables.includes(deliverable);
                return (
                  <button
                    key={deliverable}
                    type="button"
                    onClick={() => {
                      if (checked) {
                        setFormData({ ...formData, deliverables: formData.deliverables.filter((item) => item !== deliverable) });
                        if (deliverable === 'Others') setOtherDeliverableText('');
                      } else {
                        setFormData({ ...formData, deliverables: [...formData.deliverables, deliverable] });
                      }
                    }}
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                      checked ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm shadow-emerald-100' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                    }`}
                  >
                    {deliverable}
                  </button>
                );
              })}
            </div>
            {formData.deliverables.includes('Others') && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Type custom deliverable"
                  value={otherDeliverableText}
                  onChange={(event) => setOtherDeliverableText(event.target.value)}
                  className={inputClass}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (otherDeliverableText.trim()) {
                      setFormData({ ...formData, deliverables: [...formData.deliverables.filter((item) => item !== 'Others'), otherDeliverableText.trim()] });
                      setOtherDeliverableText('');
                    }
                  }}
                  className="rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={`${cardClass} relative z-10`}>
        <Field label="Creative Confirmation">
          <button
            type="button"
            onClick={() => setCreativeOpen((open) => !open)}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 text-left text-sm outline-none transition ${
              creativeOpen
                ? 'border-indigo-400 ring-4 ring-indigo-100'
                : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            <span className={`truncate ${creativeSaved ? 'text-slate-950' : 'text-slate-400'}`}>
              {creativeSaved
                ? 'Creative details saved — click to edit'
                : 'Add costume, palette, concept, references, and location'}
            </span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-slate-400 transition ${creativeOpen ? 'rotate-180 text-indigo-500' : ''}`}
            />
          </button>
        </Field>

        <div
          className={
            creativeOpen
              ? 'relative z-[200] mt-4 overflow-visible rounded-[24px] border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-200/80'
              : 'hidden'
          }
        >
          <CreativeConfirmationSection
            ref={creativeRef}
            leadId={String(actualId)}
            clientName={clientName}
            flowType={flowType}
            onSavedChange={setCreativeSaved}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClass}>
          <SectionTitle
            icon={<Clock size={18} />}
            title="Meeting Preference"
            subtitle="Record the preferred contact mode and next meeting notes."
          />
          <div className="grid gap-4">
            <Field label="Meeting Type">
              <EnhancedSelect
                value={meetingType}
                onChange={(value) => setMeetingType(value as MeetingType)}
                placeholder="Select meeting type"
                options={meetingTypeOptions}
              />
            </Field>
            <textarea
              value={meetingDetails || (meetingType ? `${meetingType} meeting details` : '')}
              onChange={(event) => setMeetingDetails(event.target.value)}
              placeholder="Meeting link, venue, call agenda, or follow-up notes"
              className={`${inputClass} min-h-32 resize-none`}
            />
          </div>
        </section>

        <section className={cardClass}>
          <SectionTitle
            icon={<Mail size={18} />}
            title="Client Requirements"
            subtitle="Capture style preferences, must-have moments, restrictions, and client expectations."
          />
          <textarea
            value={formData.clientRequirements}
            onChange={(event) => setFormData({ ...formData, clientRequirements: event.target.value })}
            placeholder="Example: candid-heavy coverage, groom entry, family portraits, drone only at venue..."
            className={`${inputClass} min-h-36 resize-none`}
          />
          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
          >
            <FileText size={15} /> View Invoice
          </button>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] lg:left-[280px] lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            {flowType ? `Ready to save as ${selectedFlow?.label || 'selected flow'}. Expand Creative Confirmation to add shoot creative details.` : 'Select a flow type before saving.'}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onBack} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" onClick={handleScheduleMeeting} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
              <Clock size={15} /> Schedule Meeting
            </button>
            <button type="button" onClick={handleSaveEventDetails} className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-indigo-700">
              {primaryActionLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white shadow-lg"
          style={{ border: '1px solid #E5E7EB', zIndex: 100 }}>
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 text-xs">✓</span>
          </div>
          <div>
            <div className="text-sm font-semibold">Meeting Scheduled</div>
            <div className="text-xs" style={{ color: '#6B7280' }}>Calender invite will be sent to the client.</div>
          </div>
        </div>
      )}

      {/* Invoice Modal Overlay */}
      {showInvoiceModal && isLoadingInvoice && (
        <div className="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-10 rounded-2xl flex flex-col items-center shadow-xl">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading invoice data...</p>
          </div>
        </div>
      )}
      
      {showInvoiceModal && !isLoadingInvoice && invoiceData && (
        <InvoicePreviewModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          invoice={invoiceData}
          hideActions={true}
        />
      )}
    </div>
  )
}
