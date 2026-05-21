import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const updateCurrentStage = async (data:any) => {
  return axios.post(
    `${API_URL}/stage/update`,
    data
  );
};

export type Phase2SubmissionRole = {
  key: "save_the_date" | "save_the_video" | "retouch";
  label: string;
  employee_id: string | null;
  assigned: boolean;
  submitted: boolean;
  upload_link: string | null;
};

export type Phase2SubmissionStatus = {
  hasAssignedEditors: boolean;
  assignedCount: number;
  submittedCount: number;
  allSubmitted: boolean;
  roles: Phase2SubmissionRole[];
};

export const getPhase2SubmissionStatus = async (leadId: string) => {
  return axios.get<{ success: boolean; data: Phase2SubmissionStatus }>(
    `${API_URL}/crm/leads/${leadId}/phase2-submissions`
  );
};

export const approveEditingPhase = async (leadId: string) => {
  return axios.patch(`${API_URL}/crm/leads/${leadId}/approve-editing-phase`);
};

export const approveShootPhase = async (leadId: string) => {
  return axios.patch(`${API_URL}/crm/leads/${leadId}/approve-shoot-phase`);
};

export const advancePhase = async (leadId: string) => {
  return axios.patch(`${API_URL}/crm/leads/${leadId}/advance-phase`);
};
