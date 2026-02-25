import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions: string[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");
            if (token && storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                } catch (error) {
                    console.error("Auth rehydration failed:", error);
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        delete axios.defaults.headers.common["Authorization"];
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
