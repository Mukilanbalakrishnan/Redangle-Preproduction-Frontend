import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const saveCreativePlanning = async (data: any) => {
  return axios.post(`${API_URL}/creative-planning`, data);
};

export const getCreativePlanning = async (leadId: string) => {
  return axios.get(`${API_URL}/creative-planning/${leadId}`);
};