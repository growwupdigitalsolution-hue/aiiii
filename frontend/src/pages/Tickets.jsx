import { useMemo, useRef, useState } from "react";
import {
    Search, Plus, MessageSquare, Paperclip, Clock, User, MoreHorizontal, X,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import "./tickets.css";

const COLUMNS = [
    { key: "new", label: "New", dot: "#2563eb" },
    { key: "open", label: "Open", dot: "#f97316" },
    { key: "assigned", label: "Assigned", dot: "#7c3aed" },
    { key: "in_progress", label: "In Progress", dot: "#0d9488" },
    { key: "follow_up", label: "Follow Up", dot: "#db2777" },
    { key: "waiting", label: "Waiting", dot: "#6b7280" },
];

const PRIORITIES = ["All", "Urgent", "High", "Medium", "Low"];

const AVATAR_COLORS = ["#16a34a", "#2563eb", "#7c3aed", "#db2777", "#f97316", "#0d9488"];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// --- dummy data, matching the screenshot's tickets ---
const INITIAL_TICKETS = [
    { id: "T-2041", status: "new", priority: "Urgent", subject: "Order not delivered after 5 days", customer: "Priya Mehta", tags: ["delivery", "urgent"], comments: 8, attachments: 2, time: "2m ago", assignee: "Rahul K." },
    { id: "T-2040", status: "new", priority: "High", subject: "Payment deducted but no order", customer: "Vikram Singh", tags: ["payment"], comments: 3, attachments: 1, time: "15m ago", assignee: "Ananya S." },
    { id: "T-2039", status: "open", priority: "High", subject: "Wrong product received", customer: "Neha Gupta", tags: ["product", "return"], comments: 5, attachments: 3, time: "1h ago", assignee: "Rahul K." },
    { id: "T-2038", status: "open", priority: "Medium", subject: "Refund not processed", customer: "Amit Sharma", tags: ["refund"], comments: 12, attachments: 0, time: "3h ago", assignee: "Team A" },
    { id: "T-2037", status: "assigned", priority: "Medium", subject: "App login issue", customer: "Sunita Patel", tags: ["tech"], comments: 2, attachments: 1, time: "5h ago", assignee: "Dev Team" },
    { id: "T-2036", status: "in_progress", priority: "Low", subject: "Bulk order discount not applied", customer: "Rajesh Kumar", tags: ["billing"], comments: 6, attachments: 0, time: "1d ago", assignee: "Priya M." },
    { id: "T-2035", status: "follow_up", priority: "Medium", subject: "Product size exchange request", customer: "Kavya Nair", tags: ["exchange"], comments: 9, attachments: 2, time: "1d ago", assignee: "Ananya S." },
    { id: "T-2034", status: "waiting", priority: "Low", subject: "Delivery partner not responding", customer: "Arun J.", tags: ["delivery"], comments: 4, attachments: 0, time: "2d ago", assignee: "Rahul K." },
];

export default function Tickets() {
    const [tickets, setTickets] = useState(INITIAL_TICKETS);
    const [search, setSearch] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalStatus, setModalStatus] = useState("new");

    const [dragId, setDragId] = useState(null);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [hoverColumn, setHoverColumn] = useState(null);

    const columnRefs = useRef({});
    const cardSize = useRef({ w: 0, h: 0 });

    const filteredTickets = useMemo(() => {
        const q = search.trim().toLowerCase();
        return tickets.filter((t) => {
            const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter;
            const matchesSearch =
                !q ||
                t.id.toLowerCase().includes(q) ||
                t.subject.toLowerCase().includes(q) ||
                t.customer.toLowerCase().includes(q);
            return matchesPriority && matchesSearch;
        });
    }, [tickets, search, priorityFilter]);

    const ticketsByColumn = (key) => filteredTickets.filter((t) => t.status === key);

    // --- drag and drop, via Pointer Events so it works with mouse, touch, and pen alike ---
    const handlePointerDown = (e, ticket) => {
        if (e.target.closest(".tkt-card__menu-btn")) return; // don't start a drag from the "..." button
        const rect = e.currentTarget.getBoundingClientRect();
        cardSize.current = { w: rect.width, h: rect.height };
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setDragPos({ x: rect.left, y: rect.top });
        setDragId(ticket.id);
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!dragId) return;
        setDragPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });

        let hovered = null;
        Object.entries(columnRefs.current).forEach(([key, el]) => {
            if (!el) return;
            const r = el.getBoundingClientRect();
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
                hovered = key;
            }
        });
        setHoverColumn(hovered);
    };

    const handlePointerUp = () => {
        if (dragId && hoverColumn) {
            setTickets((prev) => prev.map((t) => (t.id === dragId ? { ...t, status: hoverColumn } : t)));
        }
        setDragId(null);
        setHoverColumn(null);
    };

    const openAddModal = (status) => {
        setModalStatus(status);
        setModalOpen(true);
    };

    const handleCreateTicket = (newTicket) => {
        setTickets((prev) => [
            { ...newTicket, id: `T-${2000 + prev.length + 42}`, comments: 0, attachments: 0, time: "just now" },
            ...prev,
        ]);
        setModalOpen(false);
    };

    const draggedTicket = tickets.find((t) => t.id === dragId);

    return (
        <AppLayout title="Ticket Management">
            <div
                className="tkt-page"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div className="tkt-toolbar">
                    <div className="tkt-search">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="tkt-filters">
                        {PRIORITIES.map((p) => (
                            <button
                                key={p}
                                className={`tkt-filter-chip ${priorityFilter === p ? "tkt-filter-chip--active" : ""}`}
                                onClick={() => setPriorityFilter(p)}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <button className="tkt-new-btn" onClick={() => openAddModal("new")}>
                        <Plus size={16} />
                        <span>New Ticket</span>
                    </button>
                </div>

                {/* Mobile: a horizontal strip of column tabs to jump between lists,
                    since all six columns can't sit side by side on a small screen */}
                <div className="tkt-column-tabs">
                    {COLUMNS.map((col) => (
                        <button
                            key={col.key}
                            className="tkt-column-tab"
                            onClick={() => columnRefs.current[col.key]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })}
                        >
                            <span className="tkt-dot" style={{ background: col.dot }} />
                            {col.label}
                            <span className="tkt-count">{ticketsByColumn(col.key).length}</span>
                        </button>
                    ))}
                </div>

                <div className="tkt-board">
                    {COLUMNS.map((col) => {
                        const colTickets = ticketsByColumn(col.key);
                        return (
                            <div
                                key={col.key}
                                className={`tkt-column ${hoverColumn === col.key ? "tkt-column--hover" : ""}`}
                                ref={(el) => (columnRefs.current[col.key] = el)}
                            >
                                <div className="tkt-column__header">
                                    <span className="tkt-dot" style={{ background: col.dot }} />
                                    <span className="tkt-column__title">{col.label}</span>
                                    <span className="tkt-count">{colTickets.length}</span>
                                    <button
                                        className="tkt-column__add"
                                        aria-label={`Add ticket to ${col.label}`}
                                        onClick={() => openAddModal(col.key)}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <div className="tkt-column__cards">
                                    {colTickets.map((t) => (
                                        <TicketCard
                                            key={t.id}
                                            ticket={t}
                                            dragging={dragId === t.id}
                                            onPointerDown={(e) => handlePointerDown(e, t)}
                                        />
                                    ))}
                                    {colTickets.length === 0 && <div className="tkt-empty-column">No tickets</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Floating drag preview, follows the pointer while dragging */}
                {dragId && draggedTicket && (
                    <div
                        className="tkt-drag-ghost"
                        style={{
                            left: dragPos.x,
                            top: dragPos.y,
                            width: cardSize.current.w,
                        }}
                    >
                        <TicketCardContent ticket={draggedTicket} />
                    </div>
                )}
            </div>

            <NewTicketModal
                open={modalOpen}
                defaultStatus={modalStatus}
                onClose={() => setModalOpen(false)}
                onCreate={handleCreateTicket}
            />

            <button className="tkt-fab" aria-label="New Ticket" onClick={() => openAddModal("new")}>
                <Plus size={22} />
            </button>
        </AppLayout>
    );
}

function TicketCard({ ticket, dragging, onPointerDown }) {
    return (
        <div
            className={`tkt-card ${dragging ? "tkt-card--dragging" : ""}`}
            onPointerDown={onPointerDown}
        >
            <TicketCardContent ticket={ticket} />
        </div>
    );
}

function TicketCardContent({ ticket }) {
    return (
        <>
            <div className="tkt-card__top">
                <span className="tkt-card__id">#{ticket.id}</span>
                <span className={`tkt-priority tkt-priority--${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                <button className="tkt-card__menu-btn" aria-label="More options" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal size={15} />
                </button>
            </div>

            <p className="tkt-card__subject">{ticket.subject}</p>

            <div className="tkt-card__customer">
                <span className="tkt-avatar" style={{ background: avatarColor(ticket.customer) }}>
                    {ticket.customer.charAt(0).toUpperCase()}
                </span>
                {ticket.customer}
            </div>

            {ticket.tags?.length > 0 && (
                <div className="tkt-card__tags">
                    {ticket.tags.map((tag) => (
                        <span className="tkt-tag" key={tag}>{tag}</span>
                    ))}
                </div>
            )}

            <div className="tkt-card__meta">
                <span className="tkt-card__meta-left">
                    <span><MessageSquare size={12} /> {ticket.comments}</span>
                    {ticket.attachments > 0 && <span><Paperclip size={12} /> {ticket.attachments}</span>}
                </span>
                <span><Clock size={12} /> {ticket.time}</span>
            </div>

            <div className="tkt-card__assignee">
                <User size={12} /> {ticket.assignee}
            </div>
        </>
    );
}

function NewTicketModal({ open, defaultStatus, onClose, onCreate }) {
    const [subject, setSubject] = useState("");
    const [customer, setCustomer] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [status, setStatus] = useState(defaultStatus);
    const [tags, setTags] = useState("");
    const [error, setError] = useState("");

    if (!open) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!subject.trim() || !customer.trim()) {
            setError("Subject and customer name are required");
            return;
        }
        onCreate({
            subject: subject.trim(),
            customer: customer.trim(),
            priority,
            status: status || defaultStatus,
            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            assignee: "Unassigned",
        });
        setSubject("");
        setCustomer("");
        setTags("");
        setError("");
    };

    return (
        <div className="tkt-modal-backdrop" onClick={onClose}>
            <div className="tkt-modal" onClick={(e) => e.stopPropagation()}>
                <div className="tkt-modal__header">
                    <h2>New Ticket</h2>
                    <button className="tkt-modal__close" onClick={onClose} aria-label="Close"><X size={20} /></button>
                </div>

                <form className="tkt-modal__body" onSubmit={handleSubmit}>
                    {error && <div className="error-banner">{error}</div>}

                    <label className="tkt-modal__label">Subject</label>
                    <input className="tkt-modal__input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Order not delivered" />

                    <label className="tkt-modal__label">Customer Name</label>
                    <input className="tkt-modal__input" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="e.g. Priya Mehta" />

                    <div className="tkt-modal__row">
                        <div style={{ flex: 1 }}>
                            <label className="tkt-modal__label">Priority</label>
                            <select className="tkt-modal__input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                                {PRIORITIES.filter((p) => p !== "All").map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="tkt-modal__label">Status</label>
                            <select className="tkt-modal__input" value={status} onChange={(e) => setStatus(e.target.value)}>
                                {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <label className="tkt-modal__label">Tags (comma separated)</label>
                    <input className="tkt-modal__input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. delivery, urgent" />

                    <div className="tkt-modal__actions">
                        <button type="button" className="tkt-btn tkt-btn--ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="tkt-btn tkt-btn--primary">Create Ticket</button>
                    </div>
                </form>
            </div>
        </div>
    );
}