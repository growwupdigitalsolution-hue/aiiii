import { createContext, useContext, useEffect, useState, useCallback } from "react";
import apiClient from "../api/client";
import { signIn as apiSignIn, getUserDetails } from "../api/auth";
import { connectSocket, disconnectSocket } from "../socket";   // ✅ NEW

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState("");

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await getUserDetails();
            localStorage.setItem('apiStatus', res.data.kycStatus);
            setUser(res.data);

            // ✅ Reconnect socket on app boot (page refresh)
            if (res.data?._id) {
                connectSocket(res.data._id);
            }
        } catch (err) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            setUser(null);
            disconnectSocket();     // ✅ ensure socket closed on auth fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (mobileCode, mobileNo, password) => {
        try {
            const res = await apiSignIn(mobileCode, mobileNo, password);
            console.log('res.data', res.data.token);
            console.log('AUTH_TOKEN_KEY', AUTH_TOKEN_KEY);

            localStorage.setItem(AUTH_TOKEN_KEY, res.token.authToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, res.token.refreshToken);

            setUser(res.data);
            setAuthError("");
            setLoading(false);

            // ✅ Connect socket & join user's room right after login
            if (res.data?._id) {
                connectSocket(res.data._id);
            }

            return true;
        } catch (err) {
            setAuthError(err?.response?.data?.ErrorMessage || "Login failed");
            return false;
        }
    };

    const signup = async (name, mobileCode, mobileNo, password) => {
        try {
            const res = await apiClient.post("/api/sing-up", {
                name,
                mobileCode,
                mobileNo,
                password,
                role: 2, // 2 = ADMIN
            });
            setAuthError("");
            return true;
        } catch (err) {
            setAuthError(err?.response?.data?.ErrorMessage || "Signup failed");
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        setUser(null);

        // ✅ Disconnect socket on logout
        disconnectSocket();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, authError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}