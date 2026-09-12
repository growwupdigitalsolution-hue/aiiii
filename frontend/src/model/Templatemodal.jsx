import { useEffect, useState } from "react";
import { X, Loader2, Plus, Trash2, Image as ImageIcon, Video, FileText } from "lucide-react";
import { createTemplate, updateTemplate } from "../api/templates";
import {
    CATEGORIES,
    BUTTON_TYPES,
    VARIABLE_TYPES,
    HEADER_TYPES,
    validateTemplateName,
    validateBody,
    validateBodyVariables,
    validateHeader,
    validateFooter,
    validateButtons,
    extractUniqueVariables,
    renderPreviewBody,
    renderPreviewHeaderText,
    renderPreviewUrl,
} from "../helper/templateValidation";
import "./templateModal.css";

const emptyButton = () => ({ type: "QUICK_REPLY", text: "", value: "", dynamic: false, example: "" });
const HEADER_MEDIA_ICON = { IMAGE: ImageIcon, VIDEO: Video, DOCUMENT: FileText };

/**
 * open: boolean
 * template: existing template to edit, or null/undefined to create a new one
 * onClose: () => void
 * onSaved: (template, mode) => void
 */
export default function TemplateModal({ open, template, onClose, onSaved }) {
    const isEdit = Boolean(template);

    const [name, setName] = useState("");
    const [category, setCategory] = useState("MARKETING");
    const [language, setLanguage] = useState("en");
    const [header, setHeader] = useState({ type: "NONE", text: "", example: "", mediaUrl: "" });
    const [body, setBody] = useState("");
    const [bodyVariables, setBodyVariables] = useState({}); // { [n]: { name, type, example } }
    const [footer, setFooter] = useState("");
    const [buttons, setButtons] = useState([]);

    const [nameError, setNameError] = useState("");
    const [headerErrors, setHeaderErrors] = useState({});
    const [bodyError, setBodyError] = useState("");
    const [variableErrors, setVariableErrors] = useState({});
    const [footerError, setFooterError] = useState("");
    const [buttonFormErrors, setButtonFormErrors] = useState([]);
    const [buttonFieldErrors, setButtonFieldErrors] = useState([]);
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(template?.name || "");
        setCategory(template?.category || "MARKETING");
        setLanguage(template?.language || "en");
        setHeader({ type: "NONE", text: "", example: "", mediaUrl: "", ...template?.headerComponent });
        setBody(template?.body || "");
        setBodyVariables(template?.variableComponent?.BODY_DETAIL || {});
        setFooter(template?.footer || "");
        setButtons(
            template?.buttons?.length
                ? template.buttons.map((b) => ({ dynamic: false, example: "", ...b }))
                : []
        );
        setNameError("");
        setHeaderErrors({});
        setBodyError("");
        setVariableErrors({});
        setFooterError("");
        setButtonFormErrors([]);
        setButtonFieldErrors([]);
        setSubmitError("");
    }, [open, template]);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === "Escape" && !submitting) onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose, submitting]);

    // body me {{n}} jitne bhi likhe/mite, bodyVariables ko sync rakho —
    // naye numbers ke liye khaali row add, hataye gaye numbers ki row hata do
    useEffect(() => {
        const currentNumbers = extractUniqueVariables(body);
        setBodyVariables((prev) => {
            const next = {};
            currentNumbers.forEach((n) => {
                next[n] = prev[n] || { name: "", type: "TEXT", example: "" };
            });
            return next;
        });
    }, [body]);

    if (!open) return null;

    const variableNumbers = extractUniqueVariables(body);
    const previewValues = variableNumbers.reduce((acc, n) => {
        acc[n] = bodyVariables[n]?.example || `Sample ${n}`;
        return acc;
    }, {});

    const updateHeader = (field, value) => {
        setHeader((prev) => ({ ...prev, [field]: value }));
    };

    const updateBodyVariable = (n, field, value) => {
        setBodyVariables((prev) => ({ ...prev, [n]: { ...prev[n], [field]: value } }));
    };

    const updateButton = (index, field, value) => {
        setButtons((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
    };

    const addButton = () => {
        if (buttons.length >= 3) return;
        setButtons((prev) => [...prev, emptyButton()]);
    };

    const removeButton = (index) => {
        setButtons((prev) => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const nErr = validateTemplateName(name);
        const hErr = validateHeader(header);
        const bErr = validateBody(body);
        const varErrs = validateBodyVariables(variableNumbers, bodyVariables);
        const fErr = validateFooter(footer);
        const { formErrors, buttonErrors } = validateButtons(buttons);

        setNameError(nErr);
        setHeaderErrors(hErr);
        setBodyError(bErr);
        setVariableErrors(varErrs);
        setFooterError(fErr);
        setButtonFormErrors(formErrors);
        setButtonFieldErrors(buttonErrors);

        const hasHeaderErrors = Object.keys(hErr).length > 0;
        const hasButtonFieldErrors = buttonErrors.some((e) => Object.keys(e).length > 0);
        const hasVariableErrors = Object.keys(varErrs).length > 0;
        return !nErr && !hasHeaderErrors && !bErr && !hasVariableErrors && !fErr && formErrors.length === 0 && !hasButtonFieldErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");
        if (!validate()) {
            // scroll the first error into view — helps a lot once the actions
            // bar is pinned to the bottom and errors can be off-screen above
            requestAnimationFrame(() => {
                document.querySelector(".tpm-input--error")?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: name.trim(),
                category,
                language,
                headerComponent:
                    header.type === "NONE"
                        ? { type: "NONE" }
                        : header.type === "TEXT"
                            ? { type: "TEXT", text: header.text.trim(), example: header.example?.trim() }
                            : { type: header.type, mediaUrl: header.mediaUrl.trim() },
                body: body.trim(),
                // BODY_DETAIL: name/type/example per variable — sent as example data for
                // Meta's review, and reused to render the live preview / send-time UI
                variableComponent: { BODY_DETAIL: bodyVariables },
                footer: footer.trim(),
                buttons: buttons.map((b) => ({
                    type: b.type,
                    text: b.text.trim(),
                    value: b.type === "QUICK_REPLY" ? undefined : b.value?.trim(),
                    dynamic: b.type === "URL" ? Boolean(b.dynamic) : undefined,
                    example: b.type === "URL" && b.dynamic ? b.example?.trim() : undefined,
                })),
            };
            const saved = isEdit
                ? await updateTemplate(template._id, payload)
                : await createTemplate(payload);
            onSaved?.(saved, isEdit ? "edit" : "create");
            onClose();
        } catch (err) {
            setSubmitError(
                err.response?.data?.ErrorMessage ||
                `Could not ${isEdit ? "update" : "create"} template. Please try again.`
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
                aria-labelledby="template-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="tpm-drag-handle" aria-hidden="true" />

                <div className="tpm-header">
                    <h2 id="template-modal-title" className="tpm-title">
                        {isEdit ? "Edit Template" : "New Template"}
                    </h2>
                    <button className="tpm-close-btn" onClick={onClose} aria-label="Close" disabled={submitting}>
                        <X size={20} />
                    </button>
                </div>

                <form className="tpm-form-wrap" onSubmit={handleSubmit}>
                    <div className="tpm-body">
                        {submitError && <div className="error-banner">{submitError}</div>}

                        <div className="tpm-layout">
                            <div className="tpm-fields">
                                <div className="tpm-field-row">
                                    <div className="tpm-field">
                                        <label className="tpm-label" htmlFor="tpl-name">Name</label>
                                        <input
                                            id="tpl-name"
                                            className={`tpm-input ${nameError ? "tpm-input--error" : ""}`}
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value.toLowerCase())}
                                            placeholder="e.g. order_confirmation"
                                            disabled={submitting || isEdit}
                                        />
                                        {nameError && <p className="tpm-field-error">{nameError}</p>}
                                        {isEdit && <p className="tpm-hint">Template name can't be changed after creation.</p>}
                                    </div>

                                    <div className="tpm-field">
                                        <label className="tpm-label" htmlFor="tpl-language">Language</label>
                                        <select
                                            id="tpl-language"
                                            className="tpm-input"
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            disabled={submitting}
                                        >
                                            <option value="en">English</option>
                                            <option value="hi">Hindi</option>
                                            <option value="es">Spanish</option>
                                            <option value="ar">Arabic</option>
                                        </select>
                                    </div>
                                </div>

                                <label className="tpm-label">Category</label>
                                <div className="tpm-category-group">
                                    {CATEGORIES.map((c) => (
                                        <button
                                            type="button"
                                            key={c}
                                            className={`tpm-chip ${category === c ? "tpm-chip--active" : ""}`}
                                            onClick={() => setCategory(c)}
                                            disabled={submitting}
                                        >
                                            {c.charAt(0) + c.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>

                                <label className="tpm-label">Header (optional)</label>
                                <div className="tpm-category-group">
                                    {HEADER_TYPES.map((h) => (
                                        <button
                                            type="button"
                                            key={h.value}
                                            className={`tpm-chip ${header.type === h.value ? "tpm-chip--active" : ""}`}
                                            onClick={() => setHeader((prev) => ({ ...prev, type: h.value }))}
                                            disabled={submitting}
                                        >
                                            {h.label}
                                        </button>
                                    ))}
                                </div>

                                {header.type === "TEXT" && (
                                    <div className="tpm-header-fields">
                                        <input
                                            className={`tpm-input ${headerErrors.text ? "tpm-input--error" : ""}`}
                                            type="text"
                                            placeholder="e.g. Order Update for {{1}}"
                                            value={header.text}
                                            maxLength={60}
                                            onChange={(e) => updateHeader("text", e.target.value)}
                                            disabled={submitting}
                                        />
                                        {headerErrors.text && <p className="tpm-field-error">{headerErrors.text}</p>}
                                        <p className="tpm-hint">
                                            Max 60 characters. At most one <code>{"{{1}}"}</code> variable allowed.
                                        </p>

                                        {/\{\{1\}\}/.test(header.text) && (
                                            <div style={{ marginTop: 8 }}>
                                                <input
                                                    className={`tpm-input ${headerErrors.example ? "tpm-input--error" : ""}`}
                                                    type="text"
                                                    placeholder="Example value for {{1}}"
                                                    value={header.example}
                                                    onChange={(e) => updateHeader("example", e.target.value)}
                                                    disabled={submitting}
                                                />
                                                {headerErrors.example && <p className="tpm-field-error">{headerErrors.example}</p>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(header.type === "IMAGE" || header.type === "VIDEO" || header.type === "DOCUMENT") && (
                                    <div className="tpm-header-fields">
                                        <input
                                            className={`tpm-input ${headerErrors.media ? "tpm-input--error" : ""}`}
                                            type="text"
                                            placeholder={`Example ${header.type.toLowerCase()} URL (for Meta's review)`}
                                            value={header.mediaUrl}
                                            onChange={(e) => updateHeader("mediaUrl", e.target.value)}
                                            disabled={submitting}
                                        />
                                        {headerErrors.media && <p className="tpm-field-error">{headerErrors.media}</p>}
                                        <p className="tpm-hint">
                                            A public {header.type.toLowerCase()} URL Meta can fetch as the review sample.
                                        </p>
                                    </div>
                                )}

                                <div className="tpm-body-label-row">
                                    <label className="tpm-label" htmlFor="tpl-body">Message Body</label>
                                    <span className="tpm-char-count">{body.length}/1024</span>
                                </div>
                                <textarea
                                    id="tpl-body"
                                    className={`tpm-input tpm-textarea ${bodyError ? "tpm-input--error" : ""}`}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder={"Hi {{1}}, thank you for joining us! Here's a special discount code: {{2}}"}
                                    rows={6}
                                    maxLength={1024}
                                    disabled={submitting}
                                />
                                {bodyError && <p className="tpm-field-error">{bodyError}</p>}
                                <p className="tpm-hint">
                                    Use <code>{"{{1}}"}</code>, <code>{"{{2}}"}</code>... for variables, numbered in order with no gaps.
                                </p>

                                {/* Har {{n}} ke liye ek naam + type + example set karo — sirf raw number
                                    se kaam nahi chalega, Meta ko bhi approval ke liye example chahiye */}
                                {variableNumbers.length > 0 && (
                                    <div className="tpm-variables-section">
                                        <label className="tpm-label">Variables</label>
                                        {variableNumbers.map((n) => (
                                            <div className="tpm-variable-row" key={n}>
                                                <span className="tpm-variable-tag">{`{{${n}}}`}</span>

                                                <div className="tpm-variable-fields">
                                                    <div>
                                                        <input
                                                            className={`tpm-input ${variableErrors[n]?.name ? "tpm-input--error" : ""}`}
                                                            type="text"
                                                            placeholder="Variable name (e.g. customer_name)"
                                                            value={bodyVariables[n]?.name || ""}
                                                            onChange={(e) => updateBodyVariable(n, "name", e.target.value)}
                                                            disabled={submitting}
                                                        />
                                                        {variableErrors[n]?.name && <p className="tpm-field-error">{variableErrors[n].name}</p>}
                                                    </div>

                                                    <select
                                                        className="tpm-input"
                                                        value={bodyVariables[n]?.type || "TEXT"}
                                                        onChange={(e) => updateBodyVariable(n, "type", e.target.value)}
                                                        disabled={submitting}
                                                    >
                                                        {VARIABLE_TYPES.map((t) => (
                                                            <option key={t.value} value={t.value}>{t.label}</option>
                                                        ))}
                                                    </select>

                                                    <div>
                                                        <input
                                                            className={`tpm-input ${variableErrors[n]?.example ? "tpm-input--error" : ""}`}
                                                            type="text"
                                                            placeholder="Example value"
                                                            value={bodyVariables[n]?.example || ""}
                                                            onChange={(e) => updateBodyVariable(n, "example", e.target.value)}
                                                            disabled={submitting}
                                                        />
                                                        {variableErrors[n]?.example && <p className="tpm-field-error">{variableErrors[n].example}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="tpm-footer-section">
                                    <div className="tpm-body-label-row" style={{ marginTop: 0 }}>
                                        <label className="tpm-label" htmlFor="tpl-footer" style={{ margin: 0 }}>Footer (optional)</label>
                                        <span className="tpm-char-count">{footer.length}/60</span>
                                    </div>
                                    <input
                                        id="tpl-footer"
                                        className={`tpm-input ${footerError ? "tpm-input--error" : ""}`}
                                        type="text"
                                        placeholder="e.g. Reply STOP to unsubscribe"
                                        value={footer}
                                        maxLength={60}
                                        onChange={(e) => setFooter(e.target.value)}
                                        disabled={submitting}
                                    />
                                    {footerError && <p className="tpm-field-error">{footerError}</p>}
                                    <p className="tpm-hint">Small print shown under the message. No variables allowed.</p>
                                </div>

                                <div className="tpm-buttons-section">
                                    <div className="tpm-buttons-header">
                                        <label className="tpm-label" style={{ margin: 0 }}>Buttons (optional)</label>
                                        <button
                                            type="button"
                                            className="tpm-add-btn-link"
                                            onClick={addButton}
                                            disabled={buttons.length >= 3 || submitting}
                                        >
                                            <Plus size={14} /> Add Button
                                        </button>
                                    </div>

                                    {buttonFormErrors.map((msg, i) => (
                                        <p key={i} className="tpm-field-error">{msg}</p>
                                    ))}

                                    {buttons.map((btn, i) => (
                                        <div className="tpm-button-row" key={i}>
                                            <select
                                                className="tpm-input tpm-button-type"
                                                value={btn.type}
                                                onChange={(e) => updateButton(i, "type", e.target.value)}
                                                disabled={submitting}
                                            >
                                                {BUTTON_TYPES.map((t) => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>

                                            <div className="tpm-button-fields">
                                                <input
                                                    className={`tpm-input ${buttonFieldErrors[i]?.text ? "tpm-input--error" : ""}`}
                                                    type="text"
                                                    placeholder="Button text"
                                                    value={btn.text}
                                                    onChange={(e) => updateButton(i, "text", e.target.value)}
                                                    disabled={submitting}
                                                />
                                                {buttonFieldErrors[i]?.text && <p className="tpm-field-error">{buttonFieldErrors[i].text}</p>}

                                                {btn.type === "URL" && (
                                                    <>
                                                        <input
                                                            className={`tpm-input ${buttonFieldErrors[i]?.value ? "tpm-input--error" : ""}`}
                                                            type="text"
                                                            placeholder={btn.dynamic ? "https://example.com/order/{{1}}" : "https://example.com"}
                                                            value={btn.value}
                                                            onChange={(e) => updateButton(i, "value", e.target.value)}
                                                            disabled={submitting}
                                                        />
                                                        {buttonFieldErrors[i]?.value && <p className="tpm-field-error">{buttonFieldErrors[i].value}</p>}

                                                        <label className="tpm-dynamic-toggle">
                                                            <input
                                                                type="checkbox"
                                                                checked={btn.dynamic}
                                                                onChange={(e) => updateButton(i, "dynamic", e.target.checked)}
                                                                disabled={submitting}
                                                            />
                                                            Dynamic URL (ends with a {"{{1}}"} variable)
                                                        </label>

                                                        {btn.dynamic && (
                                                            <div>
                                                                <input
                                                                    className={`tpm-input ${buttonFieldErrors[i]?.example ? "tpm-input--error" : ""}`}
                                                                    type="text"
                                                                    placeholder="Example value for {{1}} (e.g. 48219)"
                                                                    value={btn.example}
                                                                    onChange={(e) => updateButton(i, "example", e.target.value)}
                                                                    disabled={submitting}
                                                                />
                                                                {buttonFieldErrors[i]?.example && <p className="tpm-field-error">{buttonFieldErrors[i].example}</p>}
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {btn.type === "PHONE_NUMBER" && (
                                                    <>
                                                        <input
                                                            className={`tpm-input ${buttonFieldErrors[i]?.value ? "tpm-input--error" : ""}`}
                                                            type="text"
                                                            placeholder="+91XXXXXXXXXX"
                                                            value={btn.value}
                                                            onChange={(e) => updateButton(i, "value", e.target.value)}
                                                            disabled={submitting}
                                                        />
                                                        {buttonFieldErrors[i]?.value && <p className="tpm-field-error">{buttonFieldErrors[i].value}</p>}
                                                    </>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                className="tpm-icon-btn tpm-icon-btn--danger"
                                                onClick={() => removeButton(i)}
                                                aria-label="Remove button"
                                                disabled={submitting}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="tpm-preview">
                                <p className="tpm-preview-label">Live Preview</p>
                                <div className="tpm-preview-bubble">
                                    <div className="tpm-preview-body">
                                        {header.type === "TEXT" && header.text && (
                                            <div className="tpm-preview-header-block">
                                                {renderPreviewHeaderText(header, header.example)}
                                            </div>
                                        )}
                                        {(header.type === "IMAGE" || header.type === "VIDEO" || header.type === "DOCUMENT") && (
                                            <div className="tpm-preview-media-placeholder">
                                                {(() => {
                                                    const Icon = HEADER_MEDIA_ICON[header.type];
                                                    return <Icon size={20} />;
                                                })()}
                                                <span>{header.type.charAt(0) + header.type.slice(1).toLowerCase()} header</span>
                                            </div>
                                        )}
                                        <div>{renderPreviewBody(body, previewValues) || "Your message will appear here..."}</div>
                                        {footer && <div className="tpm-preview-footer">{footer}</div>}
                                    </div>
                                    {buttons.length > 0 && (
                                        <div className="tpm-preview-buttons">
                                            {buttons.map((b, i) => (
                                                <div className="tpm-preview-button" key={i}>
                                                    {b.text || "Button"}
                                                    {b.type === "URL" && b.dynamic && b.value && (
                                                        <div className="tpm-preview-url">{renderPreviewUrl(b)}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* pinned footer — always reachable, even on a long form */}
                    <div className="tpm-footer">
                        <button type="button" className="tpm-btn tpm-btn--ghost" onClick={onClose} disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" className="tpm-btn tpm-btn--primary" disabled={submitting}>
                            {submitting ? <Loader2 size={16} className="spin" /> : isEdit ? "Save Changes" : "Create Template"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}