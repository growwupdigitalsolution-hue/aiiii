import { NavLink } from "react-router-dom";
import { LayoutDashboard, MessageCircle, Megaphone, Ticket, Menu } from "lucide-react";
import "./bottomnav.css";

// sirf sabse zyada use hone wale 4 sections + "More" (jo shared drawer kholta hai)
const TABS = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/chats", label: "Chats", icon: MessageCircle },
    { to: "/broadcast", label: "Broadcast", icon: Megaphone },
    { to: "/tickets", label: "Tickets", icon: Ticket },
];

// onMoreClick: AppLayout se aata hai - wahi single drawer (Sidebar) state control karta hai,
// isliye yahan doosra Sidebar instance mount nahi karte (duplicate DOM avoid karne ke liye)
export default function BottomNav({ onMoreClick, moreActive }) {
    return (
        <nav className="bottom-nav">
            {TABS.map(({ to, label, icon: Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`}
                >
                    <Icon size={20} />
                    <span>{label}</span>
                </NavLink>
            ))}
            <button
                className={`bottom-nav__item ${moreActive ? "bottom-nav__item--active" : ""}`}
                onClick={onMoreClick}
            >
                <Menu size={20} />
                <span>More</span>
            </button>
        </nav>
    );
}
