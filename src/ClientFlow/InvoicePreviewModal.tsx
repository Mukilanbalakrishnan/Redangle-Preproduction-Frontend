import React from "react";
import { X, Download, Plus } from "lucide-react";
import html2pdf from "html2pdf.js";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: API_URL });

export type CreatedItem = any;

export interface AddonItem {
  id: string | number;
  quantity: number;
  addonService: {
    name: string;
  };
}

export interface PreviewInvoice {
  id?: string;
  name?: string;
  contact?: string;
  invoiceId?: string | number;
  token?: string;
  billingDate?: string;
  eventName?: string;
  billNo?: string;
  location?: string;
  description?: string;
  items?: CreatedItem[];
  totalAmount?: number;
  paid?: number;
  discount?: number;
  engagementDetails?: string;
  weddingDetails?: string;
  receptionDetails?: string;
  ritualsDetails?: string;
  addons?: AddonItem[];
  itemsByCategory?: Record<
    string,
    {
      id?: number;
      name: string;
      quantity: number;
      price?: number;
    }[]
  >;
  status?: string;
  qtyOverrides?: Record<string, number>;
}

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: PreviewInvoice | null;
  onEditInvoice?: (invoiceId: string) => void;
  onSaveInvoice?: (
    invoiceId: string,
    discount: number,
    paid: number,
    events: { title: string; value: string }[],
    qtyOverrides: Record<string, number>
  ) => void;
  onSendInvoice?: (
    invoiceId: string,
    discount: number,
    paid: number,
    events?: { title: string; value: string }[]
  ) => Promise<void> | void;
  onSendInvoiceWhatsApp?: (token: string) => Promise<void> | void;
  onAddAddon?: () => void;
  hideActions?: boolean;
}

// ── Plain Indian-format number (no ₹ symbol) — matches the reference image ──
const formatCurrency = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSaveInvoice,
  onSendInvoice,
  onSendInvoiceWhatsApp,
  onAddAddon,
  hideActions,
}) => {
  if (!isOpen || !invoice) return null;

  const [discountValue, setDiscountValue] = React.useState<number>(
    invoice.discount ?? 0
  );
  const [paidValue, setPaidValue] = React.useState<number>(
    invoice.paid ?? 0
  );
  const [eventDetails, setEventDetails] = React.useState({
    eventName: invoice.eventName ?? "",
    engagement: invoice.engagementDetails ?? "",
    wedding: invoice.weddingDetails ?? "",
    reception: invoice.receptionDetails ?? "",
    rituals: invoice.ritualsDetails ?? "",
    location: invoice.location ?? "",
  });
  const [showAddEvent, setShowAddEvent] = React.useState(false);

  // Initialize from saved state or empty
  const [qtyOverrides, setQtyOverrides] = React.useState<Record<string, number>>(invoice.qtyOverrides ?? {});
  const [discountFocused, setDiscountFocused] = React.useState(false);
  const [paidFocused, setPaidFocused] = React.useState(false);

  const [showAddAddon, setShowAddAddon] = React.useState(false);
  const [availableAddons, setAvailableAddons] = React.useState<any[]>([]);
  const [selectedAddonId, setSelectedAddonId] = React.useState<string>("");
  const [addonQty, setAddonQty] = React.useState<number>(1);
  const [addonCategory, setAddonCategory] = React.useState<string>("");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setQtyOverrides(invoice?.qtyOverrides ?? {});
      setDiscountValue(invoice?.discount ?? 0);
      setPaidValue(invoice?.paid ?? 0);
      setEventDetails({
        eventName: invoice.eventName ?? "",
        engagement: invoice.engagementDetails ?? "",
        wedding: invoice.weddingDetails ?? "",
        reception: invoice.receptionDetails ?? "",
        rituals: invoice.ritualsDetails ?? "",
        location: invoice.location ?? "",
      });

      api.get("/invoices/addons")
        .then(res => setAvailableAddons(res.data?.data || []))
        .catch(err => console.error("Could not fetch addons", err));
    }
  }, [isOpen, invoice]);

  const updateQty = (key: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    setQtyOverrides((prev) => ({ ...prev, [key]: newQty }));
  };

  const getQty = (key: string, originalQty: number): number => {
    return qtyOverrides[key] !== undefined ? qtyOverrides[key] : originalQty;
  };

  // Calculate dynamic subtotal based on qty overrides
  const subtotal = React.useMemo(() => {
    const baseTotal = invoice.totalAmount ?? 0;
    // If no overrides, return original total
    if (Object.keys(qtyOverrides).length === 0) return baseTotal;
    // Compute delta from overrides
    let delta = 0;
    const raw = (invoice as any).itemsByCategory as Record<string, any[]> | undefined;
    if (raw) {
      for (const [cat, items] of Object.entries(raw)) {
        items.forEach((item: any, idx: number) => {
          const key = `${cat}-${idx}`;
          if (qtyOverrides[key] !== undefined) {
            const originalQty = Number(item.quantity || 1);
            const newQty = qtyOverrides[key];
            const price = Number(item.price || 0);
            delta += (newQty - originalQty) * price;
          }
        });
      }
    }
    return baseTotal + delta;
  }, [invoice.totalAmount, qtyOverrides, (invoice as any).itemsByCategory, refreshKey]);

  const overall = subtotal - discountValue;
  const balance = overall - paidValue;

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const [events, setEvents] = React.useState<{ title: string; value: string }[]>([
    { title: "Event Name", value: invoice.eventName ?? "" },
    { title: "DATE", value: formatDate(invoice.billingDate) },
  ]);

  // Load markings from API when the Add Event modal opens
  React.useEffect(() => {
    if (showAddEvent && invoice.invoiceId) {
      api.get(`/invoices/${invoice.invoiceId}/markings`)
        .then(res => {
          const data = res.data?.data || [];
          if (data.length > 0) {
            setEvents(data.map((m: any) => ({ title: m.label, value: m.value })));
          } else {
            setEvents([
              { title: "Event Name", value: invoice.eventName ?? "" },
              { title: "DATE", value: formatDate(invoice.billingDate) },
            ]);
          }
        })
        .catch(err => {
          console.error("Could not fetch markings", err);
          setEvents([
            { title: "Event Name", value: invoice.eventName ?? "" },
            { title: "DATE", value: formatDate(invoice.billingDate) },
          ]);
        });
    }
  }, [showAddEvent]);


  const handleDownloadPDF = () => {
    const element = document.getElementById("invoice-content");
    if (!element) return;
    (html2pdf as any)()
      .set({
        margin: [5, 5, 5, 5],
        filename: `Invoice-${invoice.invoiceId}.pdf`,
        html2canvas: { scale: 2, width: element.scrollWidth, windowWidth: element.scrollWidth },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  const MERGE_INTO: Record<string, string> = {
    wedding: "SERVICE",
    shoot: "SERVICE",
    ritual: "SERVICE",
    rituals: "SERVICE",
    engagement: "SERVICE",
    reception: "SERVICE",
  };

  const CATEGORY_ORDER: Record<string, number> = {
    "add on services": 0,
    "add-on services": 0,
    "add on service": 0,
    "add-on service": 0,
    "add-ons": 0,
    "add-on": 0,
    addons: 0,
    addon: 0,
    service: 10,
    services: 10,
    packages: 15,
    deliverable: 50,
    deliverables: 50,
    complementary: 70,
    complimentary: 70,
  };

  const buildSortedEntries = (): [string, any[]][] => {
    const raw = { ...(invoice as any).itemsByCategory } as Record<string, any[]>;
    const merged: Record<string, any[]> = {};

    for (const [cat, items] of Object.entries(raw)) {
      const key = cat.toLowerCase();
      if (key === "service" || key === "services" || key === "packages" || key === "package") continue;

      const parent = MERGE_INTO[key];
      if (parent) {
        if (!merged[parent]) merged[parent] = [];
        merged[parent].push(...items);
      } else {
        const existing = Object.keys(merged).find(
          (k) => k.toLowerCase() === key
        );
        const dest = existing ?? cat;
        if (!merged[dest]) merged[dest] = [];
        merged[dest].push(...items);
      }
    }

    return Object.entries(merged).sort(([a], [b]) => {
      const aOrd = CATEGORY_ORDER[a.toLowerCase()] ?? 40;
      const bOrd = CATEGORY_ORDER[b.toLowerCase()] ?? 40;
      return aOrd - bOrd;
    });
  };

  const getFormattedEvents = () => [
    { title: "EVENT NAME", value: eventDetails.eventName },
    { title: "ENGAGEMENT", value: eventDetails.engagement },
    { title: "WEDDING", value: eventDetails.wedding },
    { title: "RECEPTION", value: eventDetails.reception },
    { title: "RITUALS", value: eventDetails.rituals },
    { title: "LOCATION", value: eventDetails.location },
  ];

  const handleSave = () => {
    if (onSaveInvoice) {
      onSaveInvoice(
        String(invoice?.invoiceId),
        discountValue,
        paidValue,
        getFormattedEvents(),
        qtyOverrides
      );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[840px] rounded shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10 rounded-t">
          <h2 className="font-semibold text-lg">Proforma Invoice Outline</h2>
          <div className="flex gap-3">
            <button onClick={handleDownloadPDF} title="Download" className="p-2 hover:bg-gray-100 rounded-lg"><Download size={18} /></button>
            {!hideActions && (
              <button
                onClick={() => setShowAddAddon(true)}
                title="Add Add-on"
                className="flex items-center gap-1 text-sm bg-blue-50 px-2 py-1 rounded text-blue-600 font-medium border border-blue-200"
              >
                <Plus size={14} /> Add-on
              </button>
            )}
            <button onClick={onClose} title="Close" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">  <X size={18} /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 bg-gray-200 print:bg-white py-6 pb-12" style={{ display: 'flex', justifyContent: 'center' }}>
          <div id="invoice-content" style={{ width: 780, minWidth: 780, flexShrink: 0, background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
            <style>{`
              .inv {
                background: #fff;
                width: 100%;
                min-width: 730px;
                border: 2px solid #000;
                font-size: 11.5px;
                color: #000;
                font-family: Arial, Helvetica, sans-serif;
              }
              .inv-top {
                border-bottom: 1px solid #000;
                padding: 6px 14px 5px;
                font-weight: 700;
                font-size: 11.5px;
              }
              .inv-top table { width: 100%; border-collapse: collapse; }
              .inv-top td   { vertical-align: top; line-height: 1.65; }
              .inv-top .mid { text-align: center; font-size: 13px; font-weight: 900; text-decoration: underline; letter-spacing: 2px; }
              .inv-top .right { text-align: right; }
              .inv-logo { border-bottom: 1px solid #000; padding: 10px 16px 8px; text-align: center; }
              .inv-logo-row { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 5px; }
              .inv-address { font-size: 12.5px; font-weight: 700; margin-top: 2px; }
              .inv-client-table { width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; }
              .inv-client-cell { width: 170px; border-right: 1px solid #000; padding: 8px 10px; vertical-align: top; font-weight: 700; font-size: 11.5px; line-height: 1.6; }
              .inv-client-name { font-size: 12px; font-weight: 900; margin-top: 14px; text-transform: uppercase; }
              .inv-event-inner { width: 100%; border-collapse: collapse; }
              .inv-event-inner tr { border-bottom: 1px solid #000; }
              .inv-event-inner tr:last-child { border-bottom: none; }
              .inv-ev-label { width: 140px; padding: 5px 8px; font-weight: 700; border-right: 1px solid #000; white-space: nowrap; vertical-align: middle; font-size: 11.5px; }
              .inv-ev-value { padding: 5px 8px; vertical-align: middle; position: relative; font-size: 11.5px; font-weight: 600; }
              .inv-items { width: 100%; border-collapse: collapse; border-top: 1.5px solid #000; border-bottom: 1px solid #000; font-size: 11.5px; table-layout: fixed; }
              .inv-items thead tr { border-bottom: 1.5px solid #000; }
              .inv-items th { padding: 7px 8px; font-weight: 700; font-size: 11.5px; border-right: 1px solid #000; text-align: center; }
              .inv-items th:last-child { border-right: none; }
              .inv-items th.th-sl  { width: 58px; }
              .inv-items th.th-qty { width: 88px; }
              .inv-items td { padding: 3.5px 8px; border-right: 1px solid #000; vertical-align: middle; }
              .inv-items td:last-child { border-right: none; }
              .inv-items .td-sl  { text-align: center; width: 58px; border-right: 1px solid #000; }
              .inv-items .td-qty { text-align: center; width: 88px; }
              .qty-wrap { display: flex; align-items: center; justify-content: center; gap: 2px; }
              .qty-btn { width: 18px; height: 18px; border: 1px solid #ccc; border-radius: 3px; background: #f5f5f5; cursor: pointer; font-size: 12px; line-height: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 0; opacity: 0; transition: opacity 0.15s; }
              .qty-wrap:hover .qty-btn { opacity: 1; }
              .inv-cat-row td { padding: 6px 8px 4px; border-right: 1px solid #000; }
              .inv-cat-row td:last-child { border-right: none; }
              .inv-cat-label { font-weight: 700; font-size: 11.5px; text-transform: uppercase; text-decoration: underline; letter-spacing: 0.3px; }
              .inv-totals-row td { padding: 5px 10px; border-bottom: 1px solid #000; }
              .inv-totals-row:last-child td { border-bottom: none; }
              .inv-totals-row .t-label { text-align: right; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
              .inv-totals-row .t-amount { text-align: center; font-weight: 700; position: relative; white-space: nowrap; }
              .inv-overall td { font-weight: 900; font-size: 12.5px; }
              .inv-notes { border-top: 1px solid #000; padding: 10px 14px 14px; font-size: 10.5px; line-height: 1.48; }
              .inv-notes-title { font-weight: 700; font-size: 11px; margin-bottom: 5px; text-transform: uppercase; }
              .inv-note-item { display: flex; gap: 5px; margin-bottom: 3px; align-items: flex-start; text-transform: uppercase; }
              .inv-note-bullet { flex-shrink: 0; font-size: 13px; line-height: 1.25; }
            `}</style>
            <div className="inv">
              <div className="inv-top">
                <table>
                  <tbody>
                    <tr>
                      <td style={{ width: "34%" }}>
                        GSTIN : 33ABIFR7594P1Z8
                        <div style={{ marginTop: 2 }}>DATE : {formatDate(invoice.billingDate)}</div>
                      </td>
                      <td className="mid" style={{ width: "32%" }}>PROFORMA INVOICE</td>
                      <td className="right" style={{ width: "34%" }}>
                        BILL NO : {invoice.billNo ?? invoice.invoiceId}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="inv-logo">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>
                  <img src="/red_angle_logo.png" alt="Red Angle Studio" style={{ height: 70, objectFit: 'contain' }} />
                </div>
                <div className="inv-address">
                  AP 742, G-Block, 2nd Street, 11th Main Rd, Anna Nagar, Chennai, Tamil Nadu 600040.
                </div>
              </div>
              <table className="inv-client-table">
                <tbody>
                  <tr>
                    <td className="inv-client-cell">
                      TO
                      <div className="inv-client-name">{invoice.name}</div>
                      <div style={{ marginTop: 4, fontWeight: 600 }}>{invoice.contact}</div>
                    </td>
                    <td style={{ padding: 0, verticalAlign: "top" }}>
                      <table className="inv-event-inner">
                        <tbody>
                          {[
                            { label: "EVENT NAME", key: "eventName" },
                            { label: "ENGAGEMENT", key: "engagement" },
                            { label: "WEDDING", key: "wedding" },
                            { label: "RECEPTION", key: "reception" },
                            { label: "RITUALS", key: "rituals" },
                            { label: "LOCATION", key: "location" },
                          ].map((row) => (
                            <tr key={row.key}>
                              <td className="inv-ev-label">{row.label} :</td>
                              <td className="inv-ev-value" style={{ textTransform: "uppercase" }}>
                                <div style={{ minHeight: 18 }}>
                                  {(eventDetails as any)[row.key]}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="inv-items">
                <thead>
                  <tr>
                    <th className="th-sl">SL.NO</th>
                    <th style={{ textAlign: "center" }}>
                      {(() => {
                        const raw = { ...(invoice as any).itemsByCategory } as Record<string, any[]>;
                        for (const [cat, items] of Object.entries(raw)) {
                          const key = cat.toLowerCase();
                          if (key === "service" || key === "services" || key === "packages" || key === "package") {
                            if (items && items.length > 0 && items[0].name) {
                              const pkgName = items[0].name.toUpperCase();
                              return pkgName.includes("PACKAGE")
                                ? `${pkgName} DESCRIPTION`
                                : `${pkgName} PACKAGE DESCRIPTION`;
                            }
                          }
                        }
                        return "RED ANGLE REGULAR PREMIUM PACKAGE DESCRIPTION";
                      })()}
                    </th>
                    <th className="th-qty">QTY./Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {buildSortedEntries().map(([category, items]: any) => {
                    let slNo = 1;
                    const rawCats = (invoice as any).itemsByCategory as Record<string, any[]> | undefined;
                    const findRawKey = (item: any): string | null => {
                      if (!rawCats) return null;
                      for (const [cat, catItems] of Object.entries(rawCats)) {
                        const foundIdx = catItems.findIndex((i: any) => i.name === item.name);
                        if (foundIdx !== -1) return `${cat}-${foundIdx}`;
                      }
                      return null;
                    };
                    return (
                      <React.Fragment key={category}>
                        <tr className="inv-cat-row">
                          <td className="td-sl">&nbsp;</td>
                          <td>
                            <span className="inv-cat-label">{category} :</span>
                          </td>
                          <td className="td-qty">&nbsp;</td>
                        </tr>
                        {items.map((item: any, idx: number) => {
                          const rawKey = findRawKey(item) ?? `${category}-${idx}`;
                          const qty = getQty(rawKey, item.quantity);
                          return (
                            <tr key={`${category}-${idx}`}>
                              <td className="td-sl">{slNo++}.</td>
                              <td style={{ textTransform: "uppercase" }}>
                                {item.name}
                              </td>
                              <td className="td-qty">
                                <div className="qty-wrap">
                                  {!hideActions && (
                                    <button className="qty-btn" data-html2canvas-ignore="true" onClick={() => updateQty(rawKey, qty, -1)}>−</button>
                                  )}
                                  <span style={{ minWidth: 22, textAlign: "center" }}>{String(qty).padStart(2, "0")}</span>
                                  {!hideActions && (
                                    <button className="qty-btn" data-html2canvas-ignore="true" onClick={() => updateQty(rawKey, qty, 1)}>+</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  <tr className="inv-totals-row" style={{ borderTop: "1.5px solid #000" }}>
                    <td></td>
                    <td className="t-label">TOTAL</td>
                    <td className="t-amount">{formatCurrency(subtotal)}</td>
                  </tr>
                  <tr className="inv-totals-row">
                    <td></td>
                    <td className="t-label">DISCOUNT</td>
                    <td className="t-amount">
                      <span style={{ visibility: discountFocused ? "hidden" : "visible" }}>
                        {formatCurrency(discountValue)}
                      </span>
                      <input
                        type="text"
                        data-html2canvas-ignore="true"
                        value={discountFocused ? discountValue || "" : formatCurrency(discountValue)}
                        onFocus={(e) => {
                          setDiscountFocused(true);
                          const raw = String(discountValue || "");
                          e.target.value = raw;
                          setTimeout(() => e.target.select(), 0);
                        }}
                        onBlur={() => setDiscountFocused(false)}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, "");
                          setDiscountValue(Number(val || 0));
                        }}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: discountFocused ? "white" : "transparent", border: "none", outline: "none", textAlign: "center", padding: "5px 10px", fontWeight: 700, fontSize: "11.5px", fontFamily: "inherit", color: discountFocused ? "#000" : "transparent", caretColor: "#000", }}
                      />
                    </td>
                  </tr>
                  <tr className="inv-totals-row inv-overall">
                    <td></td>
                    <td className="t-label">OVERALL BUDGET</td>
                    <td className="t-amount">{formatCurrency(overall)}</td>
                  </tr>
                  <tr className="inv-totals-row">
                    <td></td>
                    <td className="t-label">PAID</td>
                    <td className="t-amount">
                      <span style={{ visibility: paidFocused ? "hidden" : "visible" }}>
                        {formatCurrency(paidValue)}
                      </span>
                      <input
                        type="text"
                        data-html2canvas-ignore="true"
                        value={paidFocused ? paidValue || "" : formatCurrency(paidValue)}
                        onFocus={(e) => {
                          setPaidFocused(true);
                          const raw = String(paidValue || "");
                          e.target.value = raw;
                          setTimeout(() => e.target.select(), 0);
                        }}
                        onBlur={() => setPaidFocused(false)}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, "");
                          setPaidValue(Number(val || 0));
                        }}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: paidFocused ? "white" : "transparent", border: "none", outline: "none", textAlign: "center", padding: "5px 10px", fontWeight: 700, fontSize: "11.5px", fontFamily: "inherit", color: paidFocused ? "#000" : "transparent", caretColor: "#000", }}
                      />
                    </td>
                  </tr>
                  <tr className="inv-totals-row">
                    <td></td>
                    <td className="t-label">BALANCE</td>
                    <td className="t-amount">{formatCurrency(balance)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="inv-notes">
                <div className="inv-notes-title">IMPORTANT NOTES :</div>
                {[
                  "5 HOURS PER SESSION (INCLUDING PRE OR POST WEDDING), IN CASE ADDITIONAL DURATION OF TIME HAPPENS IN THE EVENTS, THEN THE COVERAGE COST MAY DIFFER.",
                  "TOKEN ADVANCE IS NON REFUNDABLE.",
                  "IN DELIVERABLES LIKE ALBUMS & VIDEOS, IF ANY CORRECTIONS ARISES REG ALBUM PDF AND VIDEOS THEN ALL THE CORRECTIONS SHOULD BE CONVEYED ONCE OR TWICE BEYOND THAT THIRD OR FOURTH CORRECTIONS OR MORE THAN THAT, EXTRA PAYMENT WILL BE CHARGED ACCORDING TO THE SERVICES.",
                  "YOU WILL RECEIVE ALL YOUR DELIVERABLES AS PER INVOICE, IF INCASE ANY OTHER SERVICES YOU ARE EXPECTING FROM RED ANGLE WHICH IS NOT MENTIONED IN YOUR INVOICE WILL BE CHARGED AS EXTRA PAYMENT.",
                  "IN INVOICE PRE OR POST WEDDING SHOOT WILL BE PLANNED ACCORDING TO YOU IN SHOOTERS AVAILABLE DATES AND IN MUHURTHAM DATES & IF MUHURTHAM DATES ARE COMING IN WEEKENDS, THEN TEAM WILL NOT BE ABLE TO SHOOT AT THAT TIME.",
                  "IF ADD-ON SESSIONS TAKEN BEFORE YOUR EVENTS, THEN THE PAYMENT OF 80% IN YOUR QUOTATION (EXCLUDING TOKEN ADVANCE) AND ADD ON SESSIONS AMOUNT SHOULD BE PAID AT THE END OF THE SESSION ON THE SAME DAY.",
                  "INCASE YOU ARE OPTING FOR POST WEDDING SHOOT, THEN VALIDITY OF THE COMPLIMENTARY SHOOT WILL BE ONLY FOR 90 DAYS AFTER YOUR WEDDING OR ELSE PAYMENT SHOULD BE MADE FOR POST WEDDING SHOOT, IF THE DURATION OF TIME (5 HOURS) EXCEEDS THEN YOU NEED TO PAY FOR POST WEDDING SHOOT.",
                  "FOR YOUR ALBUM, YOU NEED TO SELECT THE PHOTOS FIRST THEN ONLY WE CAN ABLE TO START YOUR FURTHER DELIVERABLE WORKS (NOTE: PRIORITIZE PHOTO SELECTION). WE HAVE PIX OFFCE SUPPORT FOR PHOTO SELECTION WHICH WILL BE EXPIRED WITHIN 150 DAYS. IF YOU ARE DELAYING, THEN PHOTO SELECTION WILL BE DONE BY YOU MANUALLY.",
                  "IF YOU ARE FINNALIZING THE ALBUM PDF LAYOUT, AT THAT TIME THE REMAINING 20% OF PENDING PAYMENT WILL BE PAID ONCE YOU ARE GIVING APPROVAL FOR ALBUM PRINTING.",
                  "MODES OF PAYMENT WILL BE ACCOUNT TRANSFER OR GPAY/PHONEPE OR CASH. CREDIT/DEBIT CARD PAYMENTS WILL NOT BE ACCEPTABLE.",
                  "TRAVEL, FOOD AND ACCOMMODATION SHOULD BE TAKEN CARE BY THE CLIENT (PRE OR POST SHOOT, WEDDING, RECEPTION AND ANY OTHER EVENTS).",
                  "IF INCASE ANY HUMAN ERROR OR TECHNICAL ERROR HAPPENS IN FUTURE WHICH AFFECTS ANY OF THE FOOTAGES, THEN FOR THAT PARTICULAR SERVICE, THE CHARGED AMOUNT WILL BE REFUNDED.",
                  "WE WILL KEEP YOUR CONTENT FOR 6 MONTHS ONLY FROM YOUR EVENT DATE SO BEFORE THAT KINDLY BRING YOUR PENDRIVE OR HARDISK AND COPY ALL YOUR RAW FOOTAGES. WE WILL NOT HAVE BACKUP OF YOUR RAW FOOTAGES ONCE THE TIME PERIOD AS EXPIRED.",
                  "ONCE THE ENTIRE CONTENT COPIED FROM US THROUGH HARD DISK OR PENDRIVE, WHICH EXCEEDS THE TIME PERIOD OF 6 MONTHS, AFTER THAT YOU HAVE TO BRING THE COPIED CONTENT FOR THE COMPLETION OF DELIVERABLES. (INCLUDES BOTH PHOTOS AND VIDEOS).",
                ].map((note, idx) => (
                  <div className="inv-note-item" key={idx}>
                    <span className="inv-note-bullet">•</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ── Bottom action bar ── */}
        {!hideActions && (
          <div className="flex justify-end items-center gap-3 p-4 border-t sticky bottom-0 bg-white rounded-b z-10">
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#5B5FC7' }}
            >
              Save
            </button>
            {onSendInvoice && (
              <button
                disabled={isSendingEmail}
                onClick={async () => {
                  setIsSendingEmail(true);
                  try {
                    await onSendInvoice(
                      String(invoice.invoiceId),
                      discountValue,
                      paidValue,
                      getFormattedEvents()
                    );
                  } finally {
                    setIsSendingEmail(false);
                  }
                }}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: '#22c55e' }}
              >
                {isSendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            )}
            {onSendInvoiceWhatsApp && invoice.token && (
              <button
                disabled={isSendingWhatsApp}
                onClick={async () => {
                  setIsSendingWhatsApp(true);
                  try {
                    await onSendInvoiceWhatsApp(invoice.token!);
                  } finally {
                    setIsSendingWhatsApp(false);
                  }
                }}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: '#25D366' }}
              >
                {isSendingWhatsApp ? 'Sending...' : 'Send WhatsApp'}
              </button>
            )}
          </div>
        )}

      </div>

      {/* ── Add Event Sub-Modal ── */}
      {showAddEvent && (
        <div
          className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowAddEvent(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-base">Edit Invoice Markings</h3>
              <button onClick={() => setShowAddEvent(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {events.map((ev, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    className="border rounded-lg px-3 py-2 text-sm w-[140px] font-semibold outline-none"
                    value={ev.title}
                    onChange={(e) => {
                      const updated = [...events];
                      updated[idx] = { ...updated[idx], title: e.target.value };
                      setEvents(updated);
                    }}
                  />
                  <span className="text-gray-400 font-bold">:</span>
                  <input
                    className="border rounded-lg px-3 py-2 text-sm flex-1 outline-none"
                    value={ev.value}
                    onChange={(e) => {
                      const updated = [...events];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      setEvents(updated);
                    }}
                  />
                  <button
                    onClick={() => setEvents(events.filter((_, i) => i !== idx))}
                    className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setEvents([...events, { title: "", value: "" }])}
              className="mt-3 flex items-center gap-1 text-sm text-blue-600 font-medium"
            >
              <Plus size={14} /> Add Row
            </button>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t">
              <button
                onClick={() => setShowAddEvent(false)}
                className="px-4 py-2 text-sm rounded-lg border"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onSaveInvoice) {
                    onSaveInvoice(
                      String(invoice?.invoiceId),
                      discountValue,
                      paidValue,
                      events,
                      qtyOverrides
                    );
                  }
                  setShowAddEvent(false);
                }}
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold"
                style={{ background: '#5B5FC7' }}
              >
                Save Markings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Addon Sub-Modal ── */}
      {showAddAddon && (
        <div
          className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowAddAddon(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-base">Add Add-on Service</h3>
              <button onClick={() => setShowAddAddon(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium block mb-1 text-gray-600">Select Add-on</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                  value={selectedAddonId}
                  onChange={(e) => setSelectedAddonId(e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {availableAddons.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1 text-gray-600">Category</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                  value={addonCategory}
                  onChange={(e) => setAddonCategory(e.target.value)}
                >
                  <option value="">-- Select Category --</option>
                  <option value="ADD ON SERVICES">ADD ON SERVICES</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Reception">Reception</option>
                  <option value="Engagement">Engagement</option>
                  <option value="SERVICE">SERVICE</option>
                  <option value="DELIVERABLES">DELIVERABLES</option>
                  <option value="COMPLIMENTARY">COMPLIMENTARY</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1 text-gray-600">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={addonQty}
                  onChange={(e) => setAddonQty(Math.max(1, Number(e.target.value)))}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t">
              <button
                onClick={() => setShowAddAddon(false)}
                className="px-4 py-2 text-sm rounded-lg border"
              >
                Cancel
              </button>
              <button
                disabled={!selectedAddonId}
                onClick={async () => {
                  if (!selectedAddonId || !invoice.invoiceId) return;
                  try {
                    await api.post(`/invoices/${invoice.invoiceId}/addons`, {
                      addonServiceId: selectedAddonId,
                      quantity: addonQty,
                      category: addonCategory || undefined,
                    });
                    toast.success("Add-on added successfully");
                    setShowAddAddon(false);
                    setSelectedAddonId("");
                    setAddonQty(1);
                    setAddonCategory("");
                    setRefreshKey((k) => k + 1);
                    if (onAddAddon) onAddAddon();
                  } catch (err) {
                    console.error("Failed to add addon", err);
                    toast.error("Failed to add add-on");
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold disabled:opacity-50"
                style={{ background: '#5B5FC7' }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicePreviewModal;
