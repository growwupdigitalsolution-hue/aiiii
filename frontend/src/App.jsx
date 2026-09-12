import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ComingSoon from "./pages/ComingSoon";
import GroupManagement from "./pages/Groupmanagement";
import Templates from "./pages/Templates";
import Broadcast from "./pages/Broadcast";
import Chats from "./pages/Chats";
import Tickets from "./pages/Tickets";
import ChatbotsList from "./pages/Chatbotslist";
import Catalog from "./pages/Catalog";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";

const COMING_SOON_ROUTES = [
    { path: "/tickets", title: "Tickets" },
    { path: "/chats", title: "Chats" },
    { path: "/broadcast", title: "Broadcast" },
    { path: "/templates", title: "Templates" },
    { path: "/chatbots", title: "Chatbots" },
    { path: "/groups", title: "Groups" },
    { path: "/catalog", title: "Catalog" },
    { path: "/orders", title: "Orders" },
    { path: "/payments", title: "Payments" },
    { path: "/stock", title: "Stock" },
    { path: "/roles", title: "Roles" },
    { path: "/automation", title: "Automation" },
    { path: "/settings", title: "Settings" },
];

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/groups"
                        element={
                            <ProtectedRoute>
                                <GroupManagement />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/templates"
                        element={
                            <ProtectedRoute>
                                <Templates />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/broadcast"
                        element={
                            <ProtectedRoute>
                                <Broadcast />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/chats"
                        element={
                            <ProtectedRoute>
                                <Chats />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/chatbots"
                        element={
                            <ProtectedRoute>
                                <ChatbotsList />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tickets"
                        element={
                            <ProtectedRoute>
                                <Tickets />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/catalog"
                        element={
                            <ProtectedRoute>
                                <Catalog />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/orders"
                        element={
                            <ProtectedRoute>
                                <Orders />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/payments"
                        element={
                            <ProtectedRoute>
                                <Payments />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />
                    {COMING_SOON_ROUTES.map(({ path, title }) => (
                        <Route
                            key={path}
                            path={path}
                            element={
                                <ProtectedRoute>
                                    <ComingSoon title={title} />
                                </ProtectedRoute>
                            }
                        />
                    ))}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
