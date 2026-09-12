import { useEffect, useState } from "react";
import {
    Megaphone, CheckCircle2, XCircle, CheckCheck, Eye, MailWarning,
    Clock, CircleCheck, Users, IndianRupee, TrendingUp, Ticket
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/dashboard/StatCard";
import Panel from "../components/dashboard/Panel";
import TicketStatusChart from "../components/dashboard/TicketStatusChart";
import MessageAnalyticsChart from "../components/dashboard/MessageAnalyticsChart";
import RevenueTrendChart from "../components/dashboard/RevenueTrendChart";
import RecentActivityList from "../components/dashboard/RecentActivityList";
import RecentOrdersList from "../components/dashboard/RecentOrdersList";
import KycStatusCard from "../components/layout/KycStatusCard";
import { useAuth } from "../context/AuthContext";
import { launchEmbeddedSignup } from "../lib/embeddedSignup";
import { completeEmbeddedSignup } from "../api/auth"; // aapko banana hoga, neeche note dekhein
import {
    getDashboardSummary, getMessageAnalytics, getRevenueTrend,
    getTicketStatusDistribution, getRecentActivity, getRecentOrders
} from "../api/dashboard";

export default function Dashboard() {
    const { user, refreshUser } = useAuth(); // refreshUser: neeche note me explain kiya hai
    const [summary, setSummary] = useState(null);
    const [messageAnalytics, setMessageAnalytics] = useState(null);
    const [revenueTrend, setRevenueTrend] = useState(null);
    const [ticketStatus, setTicketStatus] = useState(null);
    const [recentActivity, setRecentActivity] = useState(null);
    const [recentOrders, setRecentOrders] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [signupError, setSignupError] = useState("");

    const kycStatus = user?.kycStatus || "pending";
    const kycVerified = kycStatus === "verified";

    useEffect(() => {
        if (!kycVerified) return; // KYC pending hai toh dashboard data fetch karne ki zaroorat nahi
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const [s, ma, rt, ts, ra, ro] = await Promise.all([
                    getDashboardSummary(),
                    getMessageAnalytics(),
                    getRevenueTrend(),
                    getTicketStatusDistribution(),
                    getRecentActivity(),
                    getRecentOrders(),
                ]);
                if (cancelled) return;
                setSummary(s);
                setMessageAnalytics(ma);
                setRevenueTrend(rt);
                setTicketStatus(ts);
                setRecentActivity(ra);
                setRecentOrders(ro);
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.ErrorMessage || "Unable to load dashboard data. Please try again.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [kycVerified]);

    const handleStartKyc = () => {
        alert()
        setSignupError("");
        launchEmbeddedSignup({
            onSuccess: async (code) => {
                try {
                    await completeEmbeddedSignup(code); // backend: code -> WABA token exchange
                    await refreshUser?.();               // user.kycStatus ko refresh karo
                } catch (err) {
                    setSignupError(
                        err?.response?.data?.ErrorMessage || "Verification failed, please try again"
                    );
                }
            },
            onError: (msg) => setSignupError(msg),
            onCancel: () => { }, // user ne popup band kar diya, kuch nahi karna
        });
    };

    if (!kycVerified) {
        return (
            <AppLayout title="Dashboard">
                <div className="kyc-gate">
                    {signupError && <div className="error-banner">{signupError}</div>}
                    <KycStatusCard status={kycStatus} onStart={handleStartKyc} />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Dashboard">
            {error && <div className="error-banner">{error}</div>}

            {loading ? (
                <DashboardSkeleton />
            ) : (
                <>
                    <div className="stat-grid">
                        <StatCard icon={Megaphone} iconBg="#16a34a" value={(summary?.totalBroadcasts ?? 0).toLocaleString()} label="Total Broadcasts" changePct={summary?.totalBroadcastsChangePct} />
                        <StatCard icon={CheckCircle2} iconBg="#2563eb" value={(summary?.successful ?? 0).toLocaleString()} label="Successful" />
                        <StatCard icon={XCircle} iconBg="#ef4444" value={(summary?.failed ?? 0).toLocaleString()} label="Failed" />
                        <StatCard icon={CheckCheck} iconBg="#7c3aed" value={(summary?.delivered ?? 0).toLocaleString()} label="Delivered" />
                        <StatCard icon={Eye} iconBg="#0d9488" value={(summary?.read ?? 0).toLocaleString()} label="Read" />
                        <StatCard icon={MailWarning} iconBg="#f97316" value={(summary?.unread ?? 0).toLocaleString()} label="Unread" />
                        <StatCard icon={Clock} iconBg="#f97316" value={(summary?.pendingTickets ?? 0).toLocaleString()} label="Pending Tickets" />
                        <StatCard icon={Ticket} iconBg="#2563eb" value={(summary?.newTickets ?? 0).toLocaleString()} label="New Tickets" />
                        <StatCard icon={CircleCheck} iconBg="#16a34a" value={(summary?.closedTickets ?? 0).toLocaleString()} label="Closed Tickets" />
                        <StatCard icon={Users} iconBg="#2563eb" value={(summary?.totalContacts ?? 0).toLocaleString()} label="Total Contacts" />
                        <StatCard icon={IndianRupee} iconBg="#16a34a" value={`₹${(summary?.todaysRevenue ?? 0).toLocaleString()}`} label="Today's Revenue" />
                        <StatCard icon={TrendingUp} iconBg="#7c3aed" value={`₹${(summary?.monthlyRevenue ?? 0).toLocaleString()}`} label="Monthly Revenue" />
                    </div>

                    <div className="dashboard-grid">
                        <Panel title="Message Analytics" subtitle="Last 7 days performance">
                            <MessageAnalyticsChart data={messageAnalytics} />
                        </Panel>
                        <Panel title="Ticket Status" subtitle="Current distribution">
                            <TicketStatusChart data={ticketStatus} />
                        </Panel>
                    </div>

                    <div className="dashboard-grid-3">
                        <Panel title="Revenue Analytics" subtitle="Monthly revenue trend">
                            <RevenueTrendChart data={revenueTrend} />
                        </Panel>
                        <Panel title="Recent Activity">
                            <RecentActivityList items={recentActivity} />
                        </Panel>
                        <Panel title="Recent Orders">
                            <RecentOrdersList orders={recentOrders} />
                        </Panel>
                    </div>
                </>
            )}
        </AppLayout>
    );
}

function DashboardSkeleton() {
    return (
        <>
            <div className="stat-grid">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="card" style={{ padding: 16, height: 88 }}>
                        <div className="skeleton" style={{ width: "60%", height: 12, marginBottom: 10 }} />
                        <div className="skeleton" style={{ width: "40%", height: 20 }} />
                    </div>
                ))}
            </div>
            <div className="dashboard-grid">
                <div className="card" style={{ height: 300 }}><div className="skeleton" style={{ width: "100%", height: "100%" }} /></div>
                <div className="card" style={{ height: 300 }}><div className="skeleton" style={{ width: "100%", height: "100%" }} /></div>
            </div>
        </>
    );
}