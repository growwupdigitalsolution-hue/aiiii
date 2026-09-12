import { X, Pencil, Trash2, Globe, Layers, Image as ImageIcon, Video, FileText } from "lucide-react";
import {
    renderPreviewBody,
    renderPreviewHeaderText,
    renderPreviewUrl,
    extractUniqueVariables,
} from "../helper/templateValidation";
import "./templateModal.css";

const HEADER_MEDIA_ICON = { IMAGE: ImageIcon, VIDEO: Video, DOCUMENT: FileText };

/**
 * open: boolean
 * template: template being viewed
 * onClose: () => void
 * onEdit: () => void        (optional — shows an Edit action in the footer)
 * onDelete: () => void      (optional — shows a Delete action in the footer)
 */
export default function TemplateViewModal({ open, template, onClose, onEdit, onDelete }) {
    if (!open || !template) return null;

    const variableNumbers = extractUniqueVariables(template.body);
    const bodyDetail = template.variableComponent?.BODY_DETAIL || {};
    const previewValues = variableNumbers.reduce((acc, n) => {
        acc[n] = bodyDetail[n]?.example || `Sample ${n}`;
        return acc;
    }, {});
    const header = template.headerComponent;
    const HeaderIcon = header?.type && HEADER_MEDIA_ICON[header.type];

    return (
        <div className="tpm-backdrop" onClick={onClose}>
            <div
                className="tpm-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="template-view-title"
                style={{ maxWidth: 460 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="tpm-drag-handle" aria-hidden="true" />

                <div className="tpm-header">
                    <h2 id="template-view-title" className="tpm-title">{template.name}</h2>
                    <button className="tpm-close-btn" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="tpm-meta-row">
                    <span className={`tpl-badge tpl-badge--category-${template.category?.toLowerCase()}`}>
                        {template.category}
                    </span>
                    <span className={`tpl-badge tpl-badge--status-${template.status?.toLowerCase()}`}>
                        {template.status}
                    </span>
                    <span className="tpm-meta-chip"><Globe size={12} /> {template.language || "en"}</span>
                    <span className="tpm-meta-chip"><Layers size={12} /> {variableNumbers.length} variables</span>
                    {header?.type && header.type !== "NONE" && (
                        <span className="tpm-meta-chip">
                            {HeaderIcon ? <HeaderIcon size={12} /> : null} {header.type} header
                        </span>
                    )}
                </div>

                <div className="tpm-body">
                    <p className="tpm-preview-label">Preview</p>
                    <div className="tpm-preview-bubble">
                        <div className="tpm-preview-body">
                            {header?.type === "TEXT" && header.text && (
                                <div className="tpm-preview-header-block">
                                    {renderPreviewHeaderText(header, header.example)}
                                </div>
                            )}
                            {HeaderIcon && (
                                <div className="tpm-preview-media-placeholder">
                                    <HeaderIcon size={20} />
                                    <span>{header.type.charAt(0) + header.type.slice(1).toLowerCase()} header</span>
                                </div>
                            )}
                            <div>{renderPreviewBody(template.body, previewValues)}</div>
                            {template.footer && <div className="tpm-preview-footer">{template.footer}</div>}
                        </div>
                        {template.buttons?.length > 0 && (
                            <div className="tpm-preview-buttons">
                                {template.buttons.map((b, i) => (
                                    <div className="tpm-preview-button" key={i}>
                                        {b.text}
                                        {b.type === "URL" && b.dynamic && b.value && (
                                            <div className="tpm-preview-url">{renderPreviewUrl(b)}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {variableNumbers.length > 0 && (
                        <div className="tpm-detail-section">
                            <p className="tpm-detail-title">Variables</p>
                            {variableNumbers.map((n) => (
                                <div className="tpm-detail-row" key={n}>
                                    <span className="tpm-detail-key">{`{{${n}}}`}</span>
                                    <span className="tpm-detail-value">
                                        {bodyDetail[n]?.name || "—"}
                                        <span className="tpm-detail-sub">
                                            {bodyDetail[n]?.type || "TEXT"} · Example: {bodyDetail[n]?.example || "—"}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {template.buttons?.length > 0 && (
                        <div className="tpm-detail-section">
                            <p className="tpm-detail-title">Buttons</p>
                            {template.buttons.map((b, i) => (
                                <div className="tpm-detail-row" key={i}>
                                    <span className="tpm-detail-key">{i + 1}.</span>
                                    <span className="tpm-detail-value">
                                        {b.text}
                                        <span className="tpm-detail-sub">
                                            {b.type}{b.value ? ` · ${b.value}` : ""}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {(onEdit || onDelete) && (
                    <div className="tpm-footer">
                        {onDelete && (
                            <button
                                type="button"
                                className="tpm-btn tpm-btn--ghost"
                                onClick={onDelete}
                                style={{ color: "#dc2626", borderColor: "#fecaca" }}
                            >
                                <Trash2 size={15} /> Delete
                            </button>
                        )}
                        {onEdit && (
                            <button type="button" className="tpm-btn tpm-btn--primary" onClick={onEdit}>
                                <Pencil size={15} /> Edit
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}