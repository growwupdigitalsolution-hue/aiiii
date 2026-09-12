// src/components/sidebar/KycStatusCard.jsx
import { ShieldCheck, ShieldAlert, ArrowRight } from "lucide-react";
import "./kycStatusCard.css";

/**
 * status: "pending" | "in_review" | "verified" | "rejected"
 * onStart: called when user clicks the CTA to begin/continue KYC
 */
export default function KycStatusCard({ status = "pending", onStart }) {
    if (status === "verified") return null; // once verified, card disappears entirely

    const copy = {
        pending: {
            label: "Verify your business",
            body: "Complete KYC to send WhatsApp campaigns and connect your number.",
            cta: "Start verification",
        },
        in_review: {
            label: "Verification in review",
            body: "We're checking your documents. This usually takes under 24 hours.",
            cta: "View status",
        },
        rejected: {
            label: "Verification needs attention",
            body: "Something didn't match. Update your documents to continue.",
            cta: "Fix and resubmit",
        },
    }[status];

    return (
        <div className="kyc-card" data-status={status}>
            <div className="kyc-card__icon">
                {status === "rejected" ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
            </div>

            <div className="kyc-card__text">
                <p className="kyc-card__label">{copy.label}</p>
                <p className="kyc-card__body">{copy.body}</p>
            </div>

            <button className="kyc-card__cta" onClick={onStart}>
                {copy.cta}
                <ArrowRight size={14} />
            </button>
        </div>
    );
}