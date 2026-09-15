import { useEffect, useRef, useState, useCallback } from "react";
import { Search, MessageSquare, Clock, MoreHorizontal } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { getAllTickets, getGroupByTicket, assignTicketInGroup, cancelTicket } from "../api/ticket";
import "./tickets.css";

const PRIORITIES = ["All", "Urgent", "High", "Medium", "Low"];
const AVATAR_COLORS = ["#16a34a", "#2563eb", "#7c3aed", "#db2777", "#f97316", "#0d9488"];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const PAGE_SIZE = 10;
const FETCH_LIMIT = 200; // ek hi call me sara data — scroll pe sirf reveal hoga, refetch nahi

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function Tickets() {
    const [newTickets, setNewTickets] = useState([]);
    const [groups, setGroups] = useState([]);
    const [search, setSearch] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // har column ka apna "kitne dikhaye ja rahe hain" counter — client-side pagination
    const [visibleCounts, setVisibleCounts] = useState({ new: PAGE_SIZE });

    const [dragId, setDragId] = useState(null);
    const [dragTicket, setDragTicket] = useState(null);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [hoverColumn, setHoverColumn] = useState(null);

    const columnRefs = useRef({});
    const cardListRefs = useRef({});
    const boardRef = useRef(null);
    const cardSize = useRef({ w: 0, h: 0 });

    /* ---------------- data fetching (ek hi baar, bade limit ke saath) ---------------- */
    const loadData = useCallback(async (searchTerm = "") => {
        setLoading(true);
        setError("");
        try {
            const [newRes, groupRes] = await Promise.all([
                getAllTickets({ limit: FETCH_LIMIT, search: searchTerm }),
                getGroupByTicket({ limit: FETCH_LIMIT, search: searchTerm }),
            ]);
            const newData = newRes?.data || [];
            const groupData = groupRes?.data || [];
            setNewTickets(newData);
            setGroups(groupData);

            // reset visible counts — nayi search/refresh pe sab column wapas 10 se shuru
            const counts = { new: PAGE_SIZE };
            groupData.forEach((g) => { counts[g._id] = PAGE_SIZE; });
            setVisibleCounts(counts);
        } catch (err) {
            console.error("Failed to load tickets:", err);
            setError("Tickets load nahi ho paye. Dubara try karo.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        const t = setTimeout(() => loadData(search), 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    /* ---------------- columns ---------------- */
    const columns = [
        { key: "new", label: "New Ticket", isGroup: false, tickets: newTickets },
        ...groups.map((g) => ({
            key: g._id,
            label: g.name || g.groupName || g.title || "Untitled Group",
            isGroup: true,
            tickets: g.ticketData || [],
        })),
    ];

    const visibleColumns = columns.map((col) => {
        const filtered = col.tickets.filter((t) => {
            const priority = (t.ticketType || "").toLowerCase();
            return priorityFilter === "All" || priority === priorityFilter.toLowerCase();
        });
        const shown = visibleCounts[col.key] ?? PAGE_SIZE;
        return { ...col, allTickets: filtered, tickets: filtered.slice(0, shown), hasMore: filtered.length > shown };
    });

    /* ---------------- vertical scroll inside a column → reveal next 10 (no API call) ---------------- */
    const handleColumnScroll = (colKey) => (e) => {
        const el = e.currentTarget;
        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
        if (!nearBottom) return;

        setVisibleCounts((prev) => {
            const col = visibleColumns.find((c) => c.key === colKey);
            if (!col || !col.hasMore) return prev;
            return { ...prev, [colKey]: (prev[colKey] ?? PAGE_SIZE) + PAGE_SIZE };
        });
    };

    /* ---------------- board horizontal scroll: mouse wheel ko horizontal me convert karo ---------------- */
    const handleBoardWheel = (e) => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // already horizontal (trackpad) hai to chhod do
        if (boardRef.current) {
            boardRef.current.scrollLeft += e.deltaY;
            e.preventDefault();
        }
    };

    /* ---------------- drag & drop (pointer events) ---------------- */
    const handlePointerDown = (e, ticket, sourceColumnKey) => {
        if (e.target.closest(".tkt-card__menu-btn")) return;
        const rect = e.currentTarget.getBoundingClientRect();
        cardSize.current = { w: rect.width, h: rect.height };
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setDragPos({ x: rect.left, y: rect.top });
        setDragId(ticket._id);
        setDragTicket({ ...ticket, _sourceColumn: sourceColumnKey });
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

    const handlePointerUp = async () => {
        const ticketId = dragId;
        const sourceColumn = dragTicket?._sourceColumn;
        const targetColumn = hoverColumn;

        setDragId(null);
        setDragTicket(null);
        setHoverColumn(null);

        if (!ticketId || !targetColumn || targetColumn === sourceColumn) return;

        const groupIdToSend = targetColumn === "new" ? "empty" : targetColumn;

        try {
            await assignTicketInGroup(ticketId, groupIdToSend);
            await loadData(search);
        } catch (err) {
            console.error("Failed to move ticket:", err);
            setError("Ticket move nahi hua. Dubara try karo.");
        }
    };

    const handleCancelTicket = async (ticketId) => {
        try {
            await cancelTicket(ticketId, "Closed from board");
            await loadData(search);
        } catch (err) {
            console.error("Failed to cancel ticket:", err);
            setError("Ticket close nahi hua.");
        }
    };

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
                </div>

                {error && <div className="tkt-error-banner">{error}</div>}

                <div className="tkt-column-tabs">
                    {visibleColumns.map((col) => (
                        <button
                            key={col.key}
                            className="tkt-column-tab"
                            onClick={() =>
                                columnRefs.current[col.key]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })
                            }
                        >
                            <span className="tkt-dot" style={{ background: col.isGroup ? "#7c3aed" : "#2563eb" }} />
                            {col.label}
                            <span className="tkt-count">{col.allTickets.length}</span>
                        </button>
                    ))}
                </div>

                <div className="tkt-board" ref={boardRef} onWheel={handleBoardWheel}>
                    {loading && newTickets.length === 0 && groups.length === 0 ? (
                        <div className="tkt-loading">Loading tickets…</div>
                    ) : (
                        visibleColumns.map((col) => (
                            <div
                                key={col.key}
                                className={`tkt-column ${hoverColumn === col.key ? "tkt-column--hover" : ""}`}
                                ref={(el) => (columnRefs.current[col.key] = el)}
                            >
                                <div className="tkt-column__header">
                                    <span className="tkt-dot" style={{ background: col.isGroup ? "#7c3aed" : "#2563eb" }} />
                                    <span className="tkt-column__title">{col.label}</span>
                                    <span className="tkt-count">{col.allTickets.length}</span>
                                </div>

                                <div
                                    className="tkt-column__cards"
                                    ref={(el) => (cardListRefs.current[col.key] = el)}
                                    onScroll={handleColumnScroll(col.key)}
                                >
                                    {col.tickets.map((t) => (
                                        <TicketCard
                                            key={t._id}
                                            ticket={t}
                                            dragging={dragId === t._id}
                                            onPointerDown={(e) => handlePointerDown(e, t, col.key)}
                                            onCancel={() => handleCancelTicket(t._id)}
                                        />
                                    ))}
                                    {col.tickets.length === 0 && <div className="tkt-empty-column">No tickets</div>}
                                    {col.hasMore && <div className="tkt-scroll-hint">Scroll for more…</div>}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {dragId && dragTicket && (
                    <div
                        className="tkt-drag-ghost"
                        style={{ left: dragPos.x, top: dragPos.y, width: cardSize.current.w }}
                    >
                        <TicketCardContent ticket={dragTicket} />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function TicketCard({ ticket, dragging, onPointerDown, onCancel }) {
    return (
        <div className={`tkt-card ${dragging ? "tkt-card--dragging" : ""}`} onPointerDown={onPointerDown}>
            <TicketCardContent ticket={ticket} onCancel={onCancel} />
        </div>
    );
}

function TicketCardContent({ ticket, onCancel }) {
    const name = ticket.contact?.name || "Unknown";
    const priority = ticket.ticketType || "medium";
    const lastMsg = ticket.messages?.message || "No messages yet";

    return (
        <>
            <div className="tkt-card__top">
                <span className="tkt-card__id">#{ticket.ticketNumber}</span>
                <span className={`tkt-priority tkt-priority--${priority.toLowerCase()}`}>{priority}</span>
                {ticket.unReadCount > 0 && <span className="tkt-unread-badge">{ticket.unReadCount}</span>}
                {onCancel && (
                    <button
                        className="tkt-card__menu-btn"
                        aria-label="Close ticket"
                        onClick={(e) => { e.stopPropagation(); onCancel(); }}
                    >
                        <MoreHorizontal size={15} />
                    </button>
                )}
            </div>

            <p className="tkt-card__subject">{lastMsg}</p>

            <div className="tkt-card__customer">
                <span className="tkt-avatar" style={{ background: avatarColor(name) }}>
                    {name.charAt(0).toUpperCase()}
                </span>
                {name}
            </div>

            <div className="tkt-card__meta">
                <span className="tkt-card__meta-left">
                    <span><MessageSquare size={12} /></span>
                </span>
                <span><Clock size={12} /> {timeAgo(ticket.lastMessageAt)}</span>
            </div>
        </>
    );
}