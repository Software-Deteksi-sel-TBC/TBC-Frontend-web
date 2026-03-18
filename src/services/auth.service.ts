import { api } from "./api";

export const login = async (data: {
    email: string;
    password: string;
}) => {
    const res = await api.post("/login", data);
    return res.data;
};

export const resetPassword = async (data: {
    token: string;
    newPassword: string;
}) => {
    const res = await api.post("/reset-password", data);
    return res.data;
};