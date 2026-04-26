import { api } from "../../../services/api";

export const login = async (data: { email: string; password: string }) => {
    const res = await api.post("/login", data);
    return res.data;
};

export const requestResetPassword = async (data: { email: string }) => {
    const res = await api.post("/forgot-password", data);
    return res.data;
};

export const resetPassword = async (data: {
    token: string;
    newPassword: string;
}) => {
    const res = await api.post("/reset-password", data);
    return res.data;
};
