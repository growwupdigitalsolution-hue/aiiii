// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wifi, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { COUNTRIES, getFlagEmoji } from "../constants/countries";
import { isValidMobileNumber } from "../helper/mobile.validate";
import "./login.css";

export default function Login() {
    const { login, signup, authError } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState("login"); // "login" | "signup"
    const [name, setName] = useState("");
    const [mobileCode, setMobileCode] = useState("+91");
    const [mobileNo, setMobileNo] = useState("");
    const [password, setPassword] = useState("");
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const validate = () => {
        if (!mobileCode) {
            return "Please select your country code";
        }
        if (!isValidMobileNumber(mobileCode, mobileNo)) {
            return "Enter a valid mobile number for the selected country";
        }
        if (!password || password.length < 6) {
            return "Password must be at least 6 characters";
        }
        if (mode === "signup" && name.trim().length < 2) {
            return "Enter a valid name";
        }
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) { setFormError(err); return; }

        setFormError("");
        setSubmitting(true);

        if (mode === "login") {
            const ok = await login(mobileCode, mobileNo, password);
            setSubmitting(false);
            if (ok) navigate("/dashboard");
        } else {
            const result = await signup(name, mobileCode, mobileNo, password);
            setSubmitting(false);

            if (result === true) {
                navigate("/dashboard");          // backend auto-logged us in
            } else if (result?.registered) {
                setMode("login");                // switch to login tab
                setFormError("Account created. Please log in.");
            }
        }
    };

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setFormError("");
    };

    return (
        <div className="login-page">
            <form className="login-card card" onSubmit={handleSubmit}>
                <div className="login-header">
                    <div className="login-brand">
                        <div className="login-logo"><Wifi size={20} /></div>
                        <div>
                            <div className="login-brand-name">WACRM</div>
                            <div className="login-brand-sub">Marketing Suite</div>
                        </div>
                    </div>

                    <h2 className="login-title">
                        {mode === "login" ? "Sign in to your account" : "Create admin account"}
                    </h2>
                    <p className="login-subtitle">
                        {mode === "login"
                            ? "Manage your WhatsApp CRM, campaigns, and support tickets."
                            : "Enter details to create a new admin account."}
                    </p>
                </div>

                <div className="login-body">
                    {(authError || formError) && (
                        <div className="error-banner">{formError || authError}</div>
                    )}

                    {mode === "signup" && (
                        <>
                            <label className="login-label">Name</label>
                            <input
                                className="login-input"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter admin name"
                                required
                            />
                        </>
                    )}

                    <label className="login-label">Mobile Number</label>
                    <div className="login-mobile-row">
                        <select
                            className="login-input login-country-select"
                            value={mobileCode}
                            onChange={(e) => setMobileCode(e.target.value)}
                            required
                        >
                            {COUNTRIES.map((c) => (
                                <option key={c.iso2} value={c.dialCode}>
                                    {getFlagEmoji(c.iso2)} {c.dialCode}
                                </option>
                            ))}
                        </select>
                        <input
                            className="login-input login-mobile-input"
                            type="text"
                            inputMode="numeric"
                            value={mobileNo}
                            onChange={(e) => setMobileNo(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="Enter mobile number"
                            required
                        />
                    </div>

                    <label className="login-label">Password</label>
                    <input
                        className="login-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />

                    <button className="login-submit" type="submit" disabled={submitting}>
                        {submitting ? (
                            <Loader2 size={16} className="spin" />
                        ) : mode === "login" ? (
                            "Sign in"
                        ) : (
                            "Sign up"
                        )}
                    </button>

                    <p className="login-switch">
                        {mode === "login" ? (
                            <>
                                Don't have an account?{" "}
                                <button type="button" className="login-switch-btn" onClick={() => switchMode("signup")}>
                                    Sign up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <button type="button" className="login-switch-btn" onClick={() => switchMode("login")}>
                                    Sign in
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </form>
        </div>
    );
}