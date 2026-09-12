import { NavLink } from "react-router-dom";
import {
    LayoutDashboard, Ticket, MessageCircle, Megaphone, FileText,
    Bot, Users, BookOpen, ShoppingCart, CreditCard, Package,
    ShieldCheck, Zap, Settings, ChevronLeft, Wifi, X
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./sidebar.css";

const NAV_ITEMS = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tickets", label: "Tickets", icon: Ticket },
    { to: "/chats", label: "Chats", icon: MessageCircle },
    { to: "/broadcast", label: "Broadcast", icon: Megaphone },
    { to: "/templates", label: "Templates", icon: FileText },
    { to: "/chatbots", label: "Chatbots", icon: Bot },
    { to: "/groups", label: "Groups", icon: Users },
    { to: "/catalog", label: "Catalog", icon: BookOpen },
    { to: "/orders", label: "Orders", icon: ShoppingCart },
    { to: "/payments", label: "Payments", icon: CreditCard },
    { to: "/stock", label: "Stock", icon: Package },
    // { to: "/roles", label: "Roles", icon: ShieldCheck },
    // { to: "/automation", label: "Automation", icon: Zap },
    { to: "/settings", label: "Settings", icon: Settings },
];

// ROLES constant ke mutabik: 1 = SUPER_ADMIN, 2 = ADMIN, 3 = COLLABORATOR
const ROLE_LABELS = {
    1: "Super Admin",
    2: "Admin",
    3: "Collaborator",
};

export default function Sidebar({ open = false, onClose }) {
    const [collapsed, setCollapsed] = useState(false);
    const { user } = useAuth();

    return (
        <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${open ? "sidebar--open" : ""}`}>
            <div className="sidebar__brand">
                <div className="sidebar__logo">
                    <Wifi size={18} />
                </div>
                {!collapsed && (
                    <div>
                        <div className="sidebar__brand-name">WACRM</div>
                        <div className="sidebar__brand-sub">MARKETING SUITE</div>
                    </div>
                )}
                <button className="sidebar__close-btn" onClick={onClose} aria-label="Close menu">
                    <X size={20} />
                </button>
            </div>

            <nav className="sidebar__nav">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
                    >
                        <Icon size={18} />
                        {!collapsed && <span>{label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar__footer">
                <div className="sidebar__user">
                    <div className="sidebar__avatar">
                        {(user?.name || "A").charAt(0).toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div>
                            <div className="sidebar__user-name">{user?.name || "Admin User"}</div>
                            <div className="sidebar__user-role">
                                {ROLE_LABELS[user?.role] || "Admin"}
                            </div>
                        </div>
                    )}
                </div>
                <button className="sidebar__collapse-btn sidebar__collapse-btn--desktop-only" onClick={() => setCollapsed((c) => !c)}>
                    <ChevronLeft size={16} style={{ transform: collapsed ? "rotate(180deg)" : "none" }} />
                    {!collapsed && "Collapse"}
                </button>
            </div>
        </aside>
    );
}
