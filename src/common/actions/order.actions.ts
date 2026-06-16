import axios from "axios";
import { buildApiUrl } from "../../common/utils/fetch.utils";

function getAuthToken() {
  return localStorage.getItem("token") || "";
}

function getHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchOrdersAction(): Promise<any[]> {
  try {
    const res = await axios.get(buildApiUrl("/api/orders"), {
      headers: getHeaders(),
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Error fetching orders", err);
    return [];
  }
}
