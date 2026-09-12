import apiClient from "./client";

export async function signIn(mobileCode, mobileNo, password) {
    // console.log('apiClient', apiClient)
    const response = await apiClient.post("/sing-in", { mobileCode, mobileNo, password });
    // Backend returns { ErrorMessage, token: { authToken, refreshToken } }
    return response.data;
}
export async function signUp(mobileCode, mobileNo, password) {
    const response = await apiClient.post("/sing-in", { mobileCode, mobileNo, password });
    // Backend returns { ErrorMessage, token: { authToken, refreshToken } }
    return response.data;
}
export async function getUserDetails() {
    const response = await apiClient.get("/user-details");
    return response.data;
}
export async function completeEmbeddedSignup(code) {
    const response = await apiClient.post("/api/whatsapp/embedded-signup", { code });
    return response.data;
}
