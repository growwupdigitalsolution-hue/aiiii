import { createContext, useContext, useEffect, useState, useCallback } from "react";
import apiClient from "../api/client";
import {
    signIn as apiSignIn,
    signUp as apiSignUp,
    getUserDetails,
    signOut as apiSignOut,
} from "../api/auth";
import { connectSocket, disconnectSocket } from "../socket";

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const getUserId = (u) => u?._id || u?.id || null;

const applyAuthHeader = (token) => {
    if (token) {
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common["Authorization"];
    }
};

const persistKycStatus = (userData) => {
    try {
        const kyc = userData?.kycStatus;
        if (kyc) localStorage.setItem("apiStatus", kyc);
        else localStorage.removeItem("apiStatus");
    } catch (_) { }
};

/* Extract user object from any of the common backend response shapes */
const extractUserFromResponse = (res) => {
    if (!res) return null;
    return (
        res?.data?.user ||
        res?.user ||
        res?.data?.data?.user ||
        (res?.data && typeof res.data === "object" && res.data._id ? res.data : null) ||
        null
    );
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState("");

    /* =========================================================
       BOOT
       ========================================================= */
    const loadUser = useCallback(async () => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            setLoading(false);
            return;
        }
        applyAuthHeader(token);

        try {
            const res = await getUserDetails();
            const userData = res?.data || null;
            setUser(userData);
            persistKycStatus(userData);

            const uid = getUserId(userData);
            if (uid) connectSocket(uid);
        } catch (err) {
            console.error("[auth] loadUser failed:", err);
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem("apiStatus");
            applyAuthHeader(null);
            setUser(null);
            disconnectSocket();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    /* =========================================================
       REFRESH USER
       ========================================================= */
    const refreshUser = useCallback(async () => {
        try {
            const res = await getUserDetails();
            const userData = res?.data || null;
            setUser(userData);
            persistKycStatus(userData);
            return userData;
        } catch (err) {
            console.error("[auth] refreshUser failed:", err);
            return null;
        }
    }, []);

    /* =========================================================
       LOGIN
       - Fixed: if backend doesn't include user data in login
         response, fetch it via /user-details so `user` is
         immediately populated (fixes KYC banner on refresh)
       ========================================================= */
    const login = async (mobileCode, mobileNo, password) => {
        try {
            setAuthError("");
            const res = await apiSignIn(mobileCode, mobileNo, password);

            const tokenObj = res?.token || res?.data?.token || {};
            const authToken = tokenObj.authToken;
            const refresh = tokenObj.refreshToken;

            if (!authToken) {
                setAuthError("Login failed: no token received");
                return false;
            }

            // 1) Persist tokens and set auth header BEFORE any follow-up call
            localStorage.setItem(AUTH_TOKEN_KEY, authToken);
            if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
            applyAuthHeader(authToken);

            // 2) Try to get user from the login response
            let userData = extractUserFromResponse(res);

            // 3) If login response didn't include user, fetch it now
            if (!userData) {
                try {
                    const detailsRes = await getUserDetails();
                    userData = detailsRes?.data || null;
                } catch (err) {
                    console.error("[auth] failed to fetch user details after login:", err);
                }
            }

            // 4) Populate state
            if (userData) {
                setUser(userData);
                persistKycStatus(userData);
                const uid = getUserId(userData);
                if (uid) connectSocket(uid);
            }

            return true;
        } catch (err) {
            setAuthError(err?.response?.data?.ErrorMessage || "Login failed");
            return false;
        }
    };

    /* =========================================================
       SIGN UP
       Same pattern: fetch user if login-style response
       ========================================================= */
    const signup = async (name, mobileCode, mobileNo, password) => {
        try {
            setAuthError("");
            const res = await apiSignUp(name, mobileCode, mobileNo, password);

            const tokenObj = res?.token || res?.data?.token || null;
            const authToken = tokenObj?.authToken;

            // Case A: backend auto-logs us in and returns a token
            if (authToken) {
                localStorage.setItem(AUTH_TOKEN_KEY, authToken);
                if (tokenObj.refreshToken) {
                    localStorage.setItem(REFRESH_TOKEN_KEY, tokenObj.refreshToken);
                }
                applyAuthHeader(authToken);

                let userData = extractUserFromResponse(res);
                if (!userData) {
                    try {
                        const detailsRes = await getUserDetails();
                        userData = detailsRes?.data || null;
                    } catch (err) {
                        console.error("[auth] failed to fetch user after signup:", err);
                    }
                }

                if (userData) {
                    setUser(userData);
                    persistKycStatus(userData);
                    const uid = getUserId(userData);
                    if (uid) connectSocket(uid);
                }

                return true;
            }

            // Case B: registration succeeded but no auto-login
            return { registered: true };
        } catch (err) {
            setAuthError(err?.response?.data?.ErrorMessage || "Signup failed");
            return false;
        }
    };

    /* =========================================================
       LOGOUT
       ========================================================= */
    const logout = async () => {
        const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
        try {
            if (refresh && typeof apiSignOut === "function") {
                await apiSignOut(refresh);
            }
        } catch (_) { }

        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem("apiStatus");

        applyAuthHeader(null);
        setUser(null);
        disconnectSocket();
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, signup, logout, authError, refreshUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}