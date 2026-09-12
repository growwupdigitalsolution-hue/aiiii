// src/lib/embeddedSignup.js

// Meta Business Manager > WhatsApp > Embedded Signup se milenge ye dono
const FB_APP_ID = import.meta.env.VITE_FB_APP_ID;       // e.g. "1234567890123456"
const FB_CONFIG_ID = import.meta.env.VITE_FB_CONFIG_ID; // WhatsApp embedded signup config id

let fbSdkLoadingPromise = null;

// Facebook SDK ko lazy-load karta hai (sirf jab pehli baar chahiye)
function loadFacebookSdk() {
    if (window.FB) return Promise.resolve(window.FB);
    if (fbSdkLoadingPromise) return fbSdkLoadingPromise;

    fbSdkLoadingPromise = new Promise((resolve, reject) => {
        window.fbAsyncInit = function () {
            window.FB.init({
                appId: FB_APP_ID,
                cookie: true,
                xfbml: false,
                version: "v20.0",
            });
            resolve(window.FB);
        };

        const script = document.createElement("script");
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        script.onerror = () => reject(new Error("Failed to load Facebook SDK"));
        document.body.appendChild(script);
    });

    return fbSdkLoadingPromise;
}

/**
 * Embedded signup popup kholta hai.
 * onSuccess(code) -> backend ko ye "code" bhejo, wahan se WABA/phone number id exchange hoga
 * onError(message) -> user ko dikhana
 */
export async function launchEmbeddedSignup({ onSuccess, onError, onCancel }) {
    try {
        const FB = await loadFacebookSdk();

        FB.login(
            (response) => {
                if (response.authResponse && response.authResponse.code) {
                    onSuccess(response.authResponse.code);
                } else {
                    onCancel?.();
                }
            },
            {
                config_id: FB_CONFIG_ID,
                response_type: "code",
                override_default_response_type: true,
                extras: {
                    setup: {},
                    featureType: "",
                    sessionInfoVersion: "3",
                },
            }
        );
    } catch (err) {
        onError?.(err.message || "Could not open verification, please try again");
    }
}

/**
 * Meta embedded signup ke beech me window.postMessage se live events bhejta hai
 * (phone_number_id, waba_id waghera) — optional, agar aapko real-time progress track karna ho
 */
export function listenForEmbeddedSignupEvents(callback) {
    const handler = (event) => {
        if (!event.origin.endsWith("facebook.com")) return;
        try {
            const data = JSON.parse(event.data);
            if (data.type === "WA_EMBEDDED_SIGNUP") callback(data);
        } catch {
            // ignore non-JSON postMessage noise
        }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
}