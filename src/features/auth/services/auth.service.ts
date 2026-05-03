import { api } from "../../../services/api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RequestResetPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface UpdateCredentialPayload {
  email: string;
  currentPassword: string;
  newPassword: string;
}

export interface LoginResponse {
  token: string;
  user: {
    is_first_login?: boolean;
    [key: string]: unknown;
  };
}

export const login = async (data: LoginPayload) => {
  const response = await api.post("/auth/login", data);
  const body = response.data as {
    token?: string;
    user?: unknown;
    data?: unknown;
  };

  const token = typeof body.token === "string" ? body.token : "";
  const userSource =
    body.data && typeof body.data === "object"
      ? body.data
      : body.user && typeof body.user === "object"
        ? body.user
        : {};

  return { token, user: userSource } as LoginResponse;
};

export const requestResetPassword = async (
  data: RequestResetPasswordPayload,
) => {
  const response = await api.post("/auth/forgot-password", data);
  return response.data;
};

export const resetPassword = async (data: ResetPasswordPayload) => {
  const response = await api.post("/auth/reset-password", data);
  return response.data;
};

export const updateCredential = async (data: UpdateCredentialPayload) => {
  const response = await api.post("/auth/update-credentials", data);
  return response.data;
};
