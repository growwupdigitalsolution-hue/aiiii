import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";

export default function AppLayout({ title, children }) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const location = useLocation();

    // route badalte hi drawer apne aap band ho jaye (mobile pe)
    useEffect(() => {
        setMobileNavOpen(false);
    }, [location.pathname]);

    return (
        <div className="app-shell">
            <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

            {mobileNavOpen && (
                <div className="app-backdrop" onClick={() => setMobileNavOpen(false)} />
            )}

            <div className="main-area">
                <Topbar title={title} onMenuClick={() => setMobileNavOpen(true)} />
                <main className="content">{children}</main>
            </div>

            <BottomNav onMoreClick={() => setMobileNavOpen(true)} moreActive={mobileNavOpen} />
        </div>
    );
}
