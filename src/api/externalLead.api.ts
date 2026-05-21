import axios from "axios";

export const getExternalLeadById = async (id: string | number) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const res = await axios.get(`${API_URL}/externalLeads/${id}`);
  return res.data;
};
