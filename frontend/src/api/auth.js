import apiClient from "./client";

/* =========================================================
   SIGN IN
   ========================================================= */
export async function signIn(mobileCode, mobileNo, password) {
    const response = await apiClient.post("/sing-in", {
        mobileCode,
        mobileNo,
        password,
    });
    // Backend returns { ErrorMessage, token: { authToken, refreshToken }, data: {...user} }
    return response.data;
}

/* =========================================================
   SIGN UP
   - fixed: was calling /sing-in by mistake
   - added: name is part of payload
   - fixed: correct /sing-up route
   ========================================================= */
export async function signUp(name, mobileCode, mobileNo, password) {
    const response = await apiClient.post("/sing-up", {
        name,
        mobileCode,
        mobileNo,
        password,
        role: 2, // 2 = ADMIN
    });
    return response.data;
}

/* =========================================================
   GET USER DETAILS
   ========================================================= */
export async function getUserDetails() {
    const response = await apiClient.get("/user-details");
    return response.data;
}

/* =========================================================
   SIGN OUT
   Best-effort: revokes refresh token on backend if endpoint
   exists. Never throws — logout is handled locally in AuthContext.
   ========================================================= */
export async function signOut(refreshToken) {
    try {
        const response = await apiClient.post("/sing-out", { refreshToken });
        return response.data;
    } catch (err) {
        console.warn("[auth] signOut request failed (non-blocking):", err?.message);
        return { ErrorMessage: "success", data: {} };
    }
}

/* =========================================================
   EMBEDDED SIGNUP (WhatsApp)
   - fixed: removed duplicate /api prefix
   ========================================================= */
export async function completeEmbeddedSignup(code) {
    const response = await apiClient.post("/whatsapp/embedded-signup", { code });
    return response.data;
}