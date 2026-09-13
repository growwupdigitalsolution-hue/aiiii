// src/helper/kycStatus.js

const VERIFIED_STATES = new Set([
    "verified",
    "approved",
    "complete",
    "completed",
    "kyc_verified",
    "business_verified",
    "true",
    "1",
]);

export function isKycVerified(status) {
    if (status === null || status === undefined) return false;

    if (typeof status === "boolean") return status === true;
    if (typeof status === "number") return status === 1;

    if (typeof status === "object") {
        return isKycVerified(
            status.status ??
            status.kycStatus ??
            status.businessStatus ??
            status.state
        );
    }

    return VERIFIED_STATES.has(String(status).trim().toLowerCase());
}

export function getKycStatus(user) {
    if (!user) {
        try {
            return localStorage.getItem("apiStatus");
        } catch {
            return null;
        }
    }
    return (
        user.kycStatus ??
        user.businessStatus ??
        user.verificationStatus ??
        user.status ??
        (typeof localStorage !== "undefined"
            ? localStorage.getItem("apiStatus")
            : null)
    );
}

export function shouldShowVerifyBanner(user) {
    return !isKycVerified(getKycStatus(user));
}