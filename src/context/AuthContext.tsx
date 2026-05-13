import React, { createContext, useState, useContext } from "react";

interface User {
    id: string;
    name: string;
    role: string;
    is_first_login: boolean;
    email?: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User, token: string, remember?: boolean) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStorage = (remember?: boolean) => (remember ? localStorage : sessionStorage);

const getStoredToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

const getStoredUser = () => {
    const raw =
        localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
    if (!raw) return null;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const token = getStoredToken();
        const storedUser = getStoredUser();
        return token && storedUser ? storedUser : null;
    });

    const login = (userData: User, token: string, remember = true) => {
        setUser(userData);
        const storage = getStorage(remember);
        storage.setItem("token", token);
        storage.setItem("auth_user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("auth_user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("auth_user");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider");
    return context;
};
