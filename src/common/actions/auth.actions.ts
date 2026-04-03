"use server";

import { ENDPOINTS } from "../../services/EndpointResources.g";
import { buildApiUrl, handleApiResponse } from "../utils/fetch.utils";

interface LoginResponse {
  token: string;
  refreshToken: string;
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
}
export async function refreshTokenAction(refreshToken: string) {
  const response = await fetch(buildApiUrl(ENDPOINTS.AUTH.REFRESH), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });
  return handleApiResponse<RefreshResponse>(
    response,
    "Token yenileme başarısız",
  );
}

export async function loginAction(formData: FormData) {
  const companyName = formData.get("companyName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const response = await fetch(buildApiUrl(ENDPOINTS.AUTH.LOGIN), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ companyName, email, password }),
  });

  return handleApiResponse<LoginResponse>(response, "Login failed");
}
