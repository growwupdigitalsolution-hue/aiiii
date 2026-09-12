import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createGroup, updateGroup } from "../api/groups";
import "./newGroupModal.css";

const MAX_NAME_LEN = 60;
const MAX_DESC_LEN = 200;

/**
 * open: boolean - controls visibility
 * group: existing group object to edit, or null/undefined to create a new one
 * onClose: () => void
 * onSaved: (group, mode) => void - called with the created/updated group; mode is "create" | "edit"
 */
export default function NewGroupModal({ open, group, onClose, onSaved }) {
    const isEdit = Boolean(group);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const nameInputRef = useRef(null);

    // modal khulte hi fields reset/prefill karo aur name field pe focus le jao
    useEffect(() => {
        if (open) {
            setName(group?.name || "");
            setDescription(group?.description || "");
            setErrors({});
            setSubmitError("");
            setTimeout(() => nameInputRef.current?.focus(), 0);
        }
    }, [open, group]);

    // Escape key se modal band ho jaye
    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    if (!open) return null;

    const validate = () => {
        const next = {};
        const trimmedName = name.trim();

        if (!trimmedName) {
            next.name = "Group name is required";
        } else if (trimmedName.length < 2) {
            next.name = "Group name must be at least 2 characters";
        } else if (trimmedName.length > MAX_NAME_LEN) {
            next.name = `Group name must be under ${MAX_NAME_LEN} characters`;
        }

        if (description.trim().length > MAX_DESC_LEN) {
            next.description = `Description must be under ${MAX_DESC_LEN} characters`;
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");

        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = { name: name.trim(), description: description.trim() };
            const saved = isEdit ? await updateGroup(group._id, payload) : await createGroup(payload);
            onSaved?.(saved, isEdit ? "edit" : "create");
            onClose();
        } catch (err) {
            setSubmitError(
                err.response?.data?.ErrorMessage ||
                `Could not ${isEdit ? "update" : "create"} group. Please try again.`
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="ngm-backdrop" onClick={onClose}>
            <div
                className="ngm-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="group-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="ngm-header">
                    <h2 id="group-modal-title" className="ngm-title">
                        {isEdit ? "Edit Group" : "New Group"}
                    </h2>
                    <button className="ngm-close-btn" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="ngm-body">
                    {submitError && <div className="error-banner">{submitError}</div>}

                    <label className="ngm-label" htmlFor="group-name">Name</label>
                    <input
                        id="group-name"
                        ref={nameInputRef}
                        className={`ngm-input ${errors.name ? "ngm-input--error" : ""}`}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Premium Customers"
                        maxLength={MAX_NAME_LEN}
                        disabled={submitting}
                    />
                    {errors.name && <p className="ngm-field-error">{errors.name}</p>}

                    <label className="ngm-label" htmlFor="group-description">Description</label>
                    <textarea
                        id="group-description"
                        className={`ngm-input ngm-textarea ${errors.description ? "ngm-input--error" : ""}`}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What is this group for? (optional)"
                        maxLength={MAX_DESC_LEN}
                        rows={3}
                        disabled={submitting}
                    />
                    {errors.description && <p className="ngm-field-error">{errors.description}</p>}

                    <div className="ngm-actions">
                        <button type="button" className="ngm-btn ngm-btn--ghost" onClick={onClose} disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" className="ngm-btn ngm-btn--primary" disabled={submitting}>
                            {submitting ? (
                                <Loader2 size={16} className="spin" />
                            ) : isEdit ? (
                                "Save Changes"
                            ) : (
                                "Create Group"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}