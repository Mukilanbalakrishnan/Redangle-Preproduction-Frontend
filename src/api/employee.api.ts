import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL

export const createEmployee = async (data: FormData) => {
  return axios.post(`${API_URL}/employees`, data, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })
}

export const getEmployees = async () => {
  return axios.get(`${API_URL}/employees`)
}

export const deleteEmployee = async (id: string) => {
  return axios.delete(`${API_URL}/employees/${id}`)
}

export const updateEmployee = async (id: string, data: any) => {
  return axios.put(`${API_URL}/employees/${id}`, data)
}

// ── Employee project endpoints (from assign-editor assignments) ──────────────

export const getEmployeeProjects = async (employeeId: string) => {
  return axios.get(`${API_URL}/employee-projects/employee/${employeeId}`)
}

export const getEmployeeProjectsByType = async (
  employeeId: string,
  projectType: string
) => {
  return axios.get(
    `${API_URL}/employee-projects/employee/${employeeId}/type/${encodeURIComponent(projectType)}`
  )
}

export const getReworkProjects = async (employeeId: string) => {
  return axios.get(
    `${API_URL}/employee-projects/employee/${employeeId}/reworks`
  )
}

export const submitProjectLink = async (id: number, uploadLink: string) => {
  return axios.put(`${API_URL}/employee-projects/${id}/submit-link`, {
    upload_link: uploadLink
  })
}