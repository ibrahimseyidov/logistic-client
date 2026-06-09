import axios from "axios";
import { buildApiUrl } from "../../common/utils/fetch.utils";

export const fetchCompaniesAction = async () => {
  try {
    const res = await axios.get(buildApiUrl("/api/company"), { headers: getAuthHeaders() });
    return res.data;
  } catch (error) {
    console.error("Failed to fetch companies", error);
    throw error;
  }
};

export const createCompanyAction = async (payload: {
  name: string;
  manager?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}) => {
  try {
    const res = await axios.post(buildApiUrl("/api/company"), payload, { headers: getAuthHeaders() });
    return res.data;
  } catch (error) {
    console.error("Failed to create company", error);
    throw error;
  }
};

function getAuthHeaders() {
  let token = "";
  try {
    token = localStorage.getItem("token") || "";
  } catch {}
  if (!token && typeof document !== "undefined") {
    const cookieToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (cookieToken) token = cookieToken;
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}
