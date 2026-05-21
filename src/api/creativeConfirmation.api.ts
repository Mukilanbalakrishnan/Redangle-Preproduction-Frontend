import axios from 'axios';
export const saveCreativeConfirmation = async (data: FormData) => {
  const API_URL = import.meta.env.VITE_API_URL;

  return axios.post(
    `${API_URL}/creative-confirmation`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const getCreativeConfirmation = async (leadId: string) => {
  const API_URL = import.meta.env.VITE_API_URL;
  return axios.get(`${API_URL}/creative-confirmation/${leadId}`);
};