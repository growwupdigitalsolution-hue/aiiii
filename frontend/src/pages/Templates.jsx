import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Eye, Pencil, Trash2, Plus, Globe, BarChart3, MousePointerClick, Image as ImageIcon, Video, FileText } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import TemplateModal from "../model/Templatemodal";
import TemplateViewModal from "../model/Templateviewmodal";
import { getTemplates, deleteTemplate } from "../api/templates";
import { renderPreviewBody, renderPreviewHeaderText, extractVariables } from "../helper/templateValidation";
import "./templates.css";

const HEADER_MEDIA_ICON = { IMAGE: ImageIcon, VIDEO: Video, DOCUMENT: FileText };

const FILTERS = ["All", "APPROVED", "PENDING", "REJECTED", "MARKETING", "UTILITY", "AUTHENTICATION"];
const MOBILE_BREAKPOINT = 760;

function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== "undefined" && window.innerWidth <= breakpoint
    );

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const handler = (e) => setIsMobile(e.matches);
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, [breakpoint]);

    return isMobile;
}

export default function Templates() {
    const isMobile = useIsMobile();

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [selectedId, setSelectedId] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [viewingTemplate, setViewingTemplate] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { templates: data } = await getTemplates();
            setTemplates(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.ErrorMessage || "Unable to load templates. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const filteredTemplates = useMemo(() => {
        return templates.filter((t) => {
            const matchesFilter =
                filter === "All" || t.status === filter || t.category === filter;
            const q = search.trim().toLowerCase();
            const matchesSearch = !q || t.name?.toLowerCase().includes(q) || t.body?.toLowerCase().includes(q);
            return matchesFilter && matchesSearch;
        });
    }, [templates, filter, search]);

    // pehla filtered template auto-select ho jaye (desktop preview panel ke liye), jab list badle
    useEffect(() => {
        if (filteredTemplates.length > 0 && !filteredTemplates.find((t) => t._id === selectedId)) {
            setSelectedId(filteredTemplates[0]._id);
        }
    }, [filteredTemplates, selectedId]);

    // BUG FIX: pehle poori `templates` list me selectedId dhoondta tha, isliye
    // filter/search lagane par preview panel me ek aisa template dikh sakta tha
    // jo visible list me tha hi nahi. Ab sirf filtered list me se select hota hai.
    const selectedTemplate = filteredTemplates.find((t) => t._id === selectedId) || filteredTemplates[0] || null;

    const openCreateModal = () => {
        setEditingTemplate(null);
        setModalOpen(true);
    };

    const openEditModal = (template) => {
        setEditingTemplate(template);
        setModalOpen(true);
    };

    const handleSaved = async (savedTemplate, mode) => {
        await fetchTemplates();
        if (savedTemplate?._id) setSelectedId(savedTemplate._id);
        setToast({
            type: "success",
            message: mode === "edit" ? "Template updated successfully" : "Template created successfully",
        });
    };

    const handleDelete = async (templateId, templateName) => {
        if (!window.confirm(`Delete "${templateName}"? This cannot be undone.`)) return;
        setDeletingId(templateId);
        setError("");
        try {
            await deleteTemplate(templateId);
            await fetchTemplates();
            setToast({ type: "success", message: `"${templateName}" deleted successfully` });
        } catch (err) {
            const msg = err.response?.data?.ErrorMessage || "Could not delete template. Please try again.";
            setError(msg);
            setToast({ type: "error", message: msg });
        } finally {
            setDeletingId(null);
        }
    };

    // mobile par koi split preview panel nahi hota — card tap karte hi
    // full-screen view sheet khulta hai, jaise ek native app mein hota hai
    const handleCardClick = (t) => {
        setSelectedId(t._id);
        if (isMobile) setViewingTemplate(t);
    };

    return (
        <AppLayout title="Templates">
            <div className="tpl-toolbar">
                <div className="tpl-search">
                    <Search size={15} />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="tpl-filters">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            className={`tpl-filter-chip ${filter === f ? "tpl-filter-chip--active" : ""}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === "All" ? "All" : f}
                        </button>
                    ))}
                </div>

                <button className="tpl-new-btn" onClick={openCreateModal}>
                    <Plus size={16} />
                    <span>New Template</span>
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="tpl-layout">
                <div className="tpl-list">
                    {loading ? (
                        <TemplateListSkeleton />
                    ) : filteredTemplates.length === 0 ? (
                        <div className="empty-state">
                            {search || filter !== "All" ? "No templates match your filters." : "No templates yet — create your first one."}
                        </div>
                    ) : (
                        filteredTemplates.map((t) => (
                            <div
                                key={t._id}
                                className={`tpl-card ${selectedTemplate?._id === t._id ? "tpl-card--selected" : ""}`}
                                onClick={() => handleCardClick(t)}
                            >
                                <div className="tpl-card__top">
                                    <div className="tpl-card__name-row">
                                        <span className="tpl-card__name">{t.name}</span>
                                        <span className={`tpl-badge tpl-badge--category-${t.category?.toLowerCase()}`}>{t.category}</span>
                                        <span className={`tpl-badge tpl-badge--status-${t.status?.toLowerCase()}`}>{t.status}</span>
                                    </div>
                                    <div className="tpl-card__actions">
                                        <button
                                            className="tpl-icon-btn"
                                            aria-label={`View ${t.name}`}
                                            onClick={(e) => { e.stopPropagation(); setViewingTemplate(t); }}
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            className="tpl-icon-btn"
                                            aria-label={`Edit ${t.name}`}
                                            onClick={(e) => { e.stopPropagation(); openEditModal(t); }}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            className="tpl-icon-btn tpl-icon-btn--danger"
                                            aria-label={`Delete ${t.name}`}
                                            onClick={(e) => { e.stopPropagation(); handleDelete(t._id, t.name); }}
                                            disabled={deletingId === t._id}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <p className="tpl-card__body">{t.body}</p>

                                <div className="tpl-card__meta">
                                    <span><Globe size={12} /> {t.language || "en"}</span>
                                    <span><BarChart3 size={12} /> {extractVariables(t.body).length} variables</span>
                                    <span><MousePointerClick size={12} /> {t.buttons?.length || 0} buttons</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop-only live preview panel; mobile users get the full-screen view sheet instead */}
                {selectedTemplate && (
                    <div className="tpl-preview-panel">
                        <p className="tpl-preview-label">Live Preview</p>
                        <div className="tpl-preview-bubble">
                            <div className="tpl-preview-header">{selectedTemplate.name.replace(/_/g, " ")}</div>
                            <div className="tpl-preview-body">
                                {selectedTemplate.headerComponent?.type === "TEXT" && selectedTemplate.headerComponent.text && (
                                    <div className="tpm-preview-header-block">
                                        {renderPreviewHeaderText(selectedTemplate.headerComponent, selectedTemplate.headerComponent.example)}
                                    </div>
                                )}
                                {HEADER_MEDIA_ICON[selectedTemplate.headerComponent?.type] && (
                                    <div className="tpm-preview-media-placeholder">
                                        {(() => {
                                            const Icon = HEADER_MEDIA_ICON[selectedTemplate.headerComponent.type];
                                            return <Icon size={20} />;
                                        })()}
                                        <span>{selectedTemplate.headerComponent.type} header</span>
                                    </div>
                                )}
                                <div>
                                    {renderPreviewBody(
                                        selectedTemplate.body,
                                        extractVariables(selectedTemplate.body).reduce((acc, n) => {
                                            acc[n] = `Sample ${n}`;
                                            return acc;
                                        }, {})
                                    )}
                                </div>
                                {selectedTemplate.footer && <div className="tpm-preview-footer">{selectedTemplate.footer}</div>}
                            </div>
                            {selectedTemplate.buttons?.length > 0 && (
                                <div className="tpl-preview-buttons">
                                    {selectedTemplate.buttons.map((b, i) => (
                                        <div className="tpl-preview-button" key={i}>{b.text}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <button className="tpl-fab" aria-label="New Template" onClick={openCreateModal}>
                <Plus size={22} />
            </button>

            <TemplateModal
                open={modalOpen}
                template={editingTemplate}
                onClose={() => setModalOpen(false)}
                onSaved={handleSaved}
            />

            <TemplateViewModal
                open={Boolean(viewingTemplate)}
                template={viewingTemplate}
                onClose={() => setViewingTemplate(null)}
                onEdit={() => {
                    const t = viewingTemplate;
                    setViewingTemplate(null);
                    openEditModal(t);
                }}
                onDelete={() => {
                    const t = viewingTemplate;
                    setViewingTemplate(null);
                    handleDelete(t._id, t.name);
                }}
            />

            {toast && (
                <div className={`tpl-toast tpl-toast--${toast.type}`} role="status">
                    {toast.message}
                </div>
            )}
        </AppLayout>
    );
}

function TemplateListSkeleton() {
    return (
        <>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="tpl-card">
                    <div className="skeleton" style={{ width: "40%", height: 16, marginBottom: 10 }} />
                    <div className="skeleton" style={{ width: "90%", height: 12, marginBottom: 6 }} />
                    <div className="skeleton" style={{ width: "70%", height: 12 }} />
                </div>
            ))}
        </>
    );
}