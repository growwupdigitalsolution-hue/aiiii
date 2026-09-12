import { useEffect, useState } from "react";
import { X, Loader2, Send, Clock } from "lucide-react";
import { getTemplates } from "../api/templates";
import { getGroups } from "../api/groups";
import { createBroadcast } from "../api/broadcasts";
import {
    validateBroadcastName,
    validateTemplateSelection,
    validateGroup,
    validateSchedule,
} from "../helper/broadcastValidation";
import { renderPreviewBody, extractVariables } from "../helper/templateValidation";
import "./templateModal.css";

/**
 * open: boolean
 * onClose: () => void
 * onCreated: (broadcast) => void
 */
export default function BroadcastModal({ open, onClose, onCreated }) {
    const [name, setName] = useState("");
    const [group, setGroup] = useState("");
    const [templateId, setTemplateId] = useState("");
    const [mode, setMode] = useState("now"); // "now" | "later"
    const [scheduledAt, setScheduledAt] = useState("");

    const [templates, setTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [templatesError, setTemplatesError] = useState("");

    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [groupsError, setGroupsError] = useState("");

    const [nameError, setNameError] = useState("");
    const [groupError, setGroupError] = useState("");
    const [templateError, setTemplateError] = useState("");
    const [scheduleError, setScheduleError] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName("");
        setGroup("");
        setTemplateId("");
        setMode("now");
        setScheduledAt("");
        setNameError("");
        setGroupError("");
        setTemplateError("");
        setScheduleError("");
        setSubmitError("");

        setTemplatesLoading(true);
        setTemplatesError("");
        getTemplates()
            .then(({ templates: data }) => {
                setTemplates((data || []).filter((t) => t.status === "APPROVED"));
            })
            .catch(() => setTemplatesError("Couldn't load templates. Try again."))
            .finally(() => setTemplatesLoading(false));

        setGroupsLoading(true);
        setGroupsError("");
        getGroups()
            .then(({ groups: data }) => {
                setGroups(data || []);
            })
            .catch(() => setGroupsError("Couldn't load groups. Try again."))
            .finally(() => setGroupsLoading(false));
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === "Escape" && !submitting) onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose, submitting]);

    if (!open) return null;

    const selectedTemplate = templates.find((t) => t._id === templateId) || null;
    const previewValues = selectedTemplate
        ? extractVariables(selectedTemplate.body).reduce((acc, n) => {
            acc[n] = `Sample ${n}`;
            return acc;
        }, {})
        : {};

    const validate = () => {
        const nErr = validateBroadcastName(name);
        const gErr = validateGroup(group);
        const tErr = validateTemplateSelection(templateId);
        const sErr = validateSchedule(mode, scheduledAt);

        setNameError(nErr);
        setGroupError(gErr);
        setTemplateError(tErr);
        setScheduleError(sErr);

        return !nErr && !gErr && !tErr && !sErr;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");
        if (!validate()) {
            requestAnimationFrame(() => {
                document.querySelector(".tpm-input--error")?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: name.trim(),
                group,
                templateId,
                scheduledAt: mode === "later" ? scheduledAt : null,
            };
            const created = await createBroadcast(payload);
            onCreated?.(created);
            onClose();
        } catch (err) {
            setSubmitError(
                err.response?.data?.ErrorMessage || "Could not create broadcast. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="tpm-backdrop" onClick={() => !submitting && onClose()}>
            <div
                className="tpm-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="broadcast-modal-title"
                style={{ maxWidth: 640 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="tpm-drag-handle" aria-hidden="true" />

                <div className="tpm-header">
                    <h2 id="broadcast-modal-title" className="tpm-title">New Broadcast</h2>
                    <button className="tpm-close-btn" onClick={onClose} aria-label="Close" disabled={submitting}>
                        <X size={20} />
                    </button>
                </div>

                <form className="tpm-form-wrap" onSubmit={handleSubmit}>
                    <div className="tpm-body">
                        {submitError && <div className="error-banner">{submitError}</div>}

                        <label className="tpm-label" htmlFor="bc-name">Broadcast Name</label>
                        <input
                            id="bc-name"
                            className={`tpm-input ${nameError ? "tpm-input--error" : ""}`}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Summer Sale 2026"
                            disabled={submitting}
                        />
                        {nameError && <p className="tpm-field-error">{nameError}</p>}

                        <label className="tpm-label" htmlFor="bc-group">Audience / Group</label>
                        {groupsLoading ? (
                            <div className="tpm-input" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)" }}>
                                <Loader2 size={14} className="spin" /> Loading groups...
                            </div>
                        ) : groupsError ? (
                            <p className="tpm-field-error">{groupsError}</p>
                        ) : groups.length === 0 ? (
                            <p className="tpm-hint">No groups yet — create one first in Group Management.</p>
                        ) : (
                            <select
                                id="bc-group"
                                className={`tpm-input ${groupError ? "tpm-input--error" : ""}`}
                                value={group}
                                onChange={(e) => setGroup(e.target.value)}
                                disabled={submitting}
                            >
                                <option value="">Select a group...</option>
                                {groups.map((g) => (
                                    <option key={g._id} value={g._id}>
                                        {g.name} ({g.totalContact} {g.totalContact === 1 ? "customer" : "customers"})
                                    </option>
                                ))}
                            </select>
                        )}
                        {groupError && <p className="tpm-field-error">{groupError}</p>}

                        <label className="tpm-label" htmlFor="bc-template">Template</label>
                        {templatesLoading ? (
                            <div className="tpm-input" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)" }}>
                                <Loader2 size={14} className="spin" /> Loading approved templates...
                            </div>
                        ) : templatesError ? (
                            <p className="tpm-field-error">{templatesError}</p>
                        ) : templates.length === 0 ? (
                            <p className="tpm-hint">No approved templates yet — create and get one approved first.</p>
                        ) : (
                            <select
                                id="bc-template"
                                className={`tpm-input ${templateError ? "tpm-input--error" : ""}`}
                                value={templateId}
                                onChange={(e) => setTemplateId(e.target.value)}
                                disabled={submitting}
                            >
                                <option value="">Select a template...</option>
                                {templates.map((t) => (
                                    <option key={t._id} value={t._id}>{t.name}</option>
                                ))}
                            </select>
                        )}
                        {templateError && <p className="tpm-field-error">{templateError}</p>}

                        {selectedTemplate && (
                            <div className="tpm-preview" style={{ marginTop: 14 }}>
                                <p className="tpm-preview-label">Message Preview</p>
                                <div className="tpm-preview-bubble">
                                    <div className="tpm-preview-body">
                                        {renderPreviewBody(selectedTemplate.body, previewValues)}
                                    </div>
                                </div>
                            </div>
                        )}

                        <label className="tpm-label">When to Send</label>
                        <div className="tpm-category-group">
                            <button
                                type="button"
                                className={`tpm-chip ${mode === "now" ? "tpm-chip--active" : ""}`}
                                onClick={() => setMode("now")}
                                disabled={submitting}
                            >
                                <Send size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Send Now
                            </button>
                            <button
                                type="button"
                                className={`tpm-chip ${mode === "later" ? "tpm-chip--active" : ""}`}
                                onClick={() => setMode("later")}
                                disabled={submitting}
                            >
                                <Clock size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Schedule for Later
                            </button>
                        </div>

                        {mode === "later" && (
                            <div style={{ marginTop: 10 }}>
                                <input
                                    className={`tpm-input ${scheduleError ? "tpm-input--error" : ""}`}
                                    type="datetime-local"
                                    value={scheduledAt}
                                    onChange={(e) => setScheduledAt(e.target.value)}
                                    disabled={submitting}
                                />
                                {scheduleError && <p className="tpm-field-error">{scheduleError}</p>}
                            </div>
                        )}
                    </div>

                    <div className="tpm-footer">
                        <button type="button" className="tpm-btn tpm-btn--ghost" onClick={onClose} disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" className="tpm-btn tpm-btn--primary" disabled={submitting}>
                            {submitting ? (
                                <Loader2 size={16} className="spin" />
                            ) : mode === "later" ? (
                                "Schedule Broadcast"
                            ) : (
                                "Send Broadcast"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}