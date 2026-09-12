import { Search, Bell, Moon, ChevronDown, Wifi, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

import "./topbar.css";

export default function Topbar({ title, onMenuClick }) {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="topbar">
            <button className="topbar__hamburger" onClick={onMenuClick} aria-label="Open menu">
                <Menu size={22} />
            </button>
            <h1 className="topbar__title">{title}</h1>

            <div className="topbar__search">
                <Search size={16} />
                <input placeholder="Search contacts, tickets, messages..." />
            </div>

            <div className="topbar__actions">

                <button className="topbar__icon-btn" aria-label="Notifications">
                    <Bell size={18} />
                    <span className="topbar__badge">2</span>
                </button>
                <button className="topbar__icon-btn" aria-label="Toggle theme">
                    <Moon size={18} />
                </button>
                <div className="topbar__user" onClick={() => setMenuOpen((o) => !o)}>
                    <div className="topbar__avatar">
                        {(user?.name || "A").charAt(0).toUpperCase()}
                    </div>
                    <span>{user?.name?.split(" ")[0] || "Admin"}</span>
                    <ChevronDown size={14} />
                    {menuOpen && (
                        <div className="topbar__menu">
                            <button onClick={logout}>Log out</button>
                        </div>
                    )}
                </div>
            </div>
        </header>

    );
}
