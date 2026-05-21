import axios from "axios";



export const saveEventDetails = async (data: any) => {
  const API_URL = import.meta.env.VITE_API_URL;
  return axios.post(
    `${API_URL}/event-details`,
    data
  );
};

export const getEventDetailsByLeadId = async (leadId: string) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const res = await axios.get(`${API_URL}/event-details/${leadId}`);
  return res.data;
};