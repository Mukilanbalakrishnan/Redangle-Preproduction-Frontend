import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const saveAssignTeam = async (data: any) => {
  return axios.post(`${API_URL}/assign-team`, data);
};

export const getAssignTeam = async (leadId: string, phase?: string) => {
  return axios.get(`${API_URL}/assign-team/${leadId}`, {
    params: phase ? { phase } : undefined,
  });
};
