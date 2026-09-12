import React, { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import {
    Settings as SettingsIcon,
    MessageCircle,
    Bell,
    Shield,
    Palette,
    Globe,
    Upload,
    // Integration logos — using emoji for simplicity
} from 'lucide-react';
import './settings.css';

/* =========================================================
   NAV ITEMS
   ========================================================= */
const NAV_ITEMS = [
    { id: 'general', label: 'General', Icon: SettingsIcon },
    { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'security', label: 'Security', Icon: Shield },
    { id: 'appearance', label: 'Appearance', Icon: Palette },
    { id: 'integrations', label: 'Integrations', Icon: Globe },
];

/* =========================================================
   REUSABLE TOGGLE
   ========================================================= */
const Toggle = ({ on, onChange }) => (
    <button
        type="button"
        className={`toggle-switch ${on ? 'on' : ''}`}
        onClick={onChange}
        aria-pressed={on}
    >
        <span className="toggle-knob"></span>
    </button>
);

/* =========================================================
   GENERAL TAB
   ========================================================= */
const GeneralTab = () => (
    <>
        <div className="settings-header">
            <h1 className="settings-title">General Settings</h1>
            <p className="settings-subtitle">Configure your business profile and preferences</p>
        </div>

        {/* Business Profile */}
        <div className="settings-card">
            <h2 className="card-title">Business Profile</h2>

            <div className="logo-upload-row">
                <div className="logo-preview">WC</div>
                <div className="logo-upload-info">
                    <button className="upload-btn">
                        <Upload size={14} />
                        Upload Logo
                    </button>
                    <p className="upload-hint">PNG, JPG up to 2MB</p>
                </div>
            </div>

            <div className="form-row-2">
                <div className="form-field">
                    <label>Company Name</label>
                    <input className="form-input" defaultValue="WaCRM Technologies" />
                </div>
                <div className="form-field">
                    <label>Email Address</label>
                    <input className="form-input" type="email" defaultValue="admin@wacrm.io" />
                </div>
            </div>

            <div className="form-row-2">
                <div className="form-field">
                    <label>Phone Number</label>
                    <input className="form-input" defaultValue="+91 98765 43210" />
                </div>
                <div className="form-field">
                    <label>Website</label>
                    <input className="form-input" defaultValue="https://wacrm.io" />
                </div>
            </div>
        </div>

        {/* Regional Settings */}
        <div className="settings-card">
            <h2 className="card-title">Regional Settings</h2>

            <div className="form-row-2">
                <div className="form-field">
                    <label>Timezone</label>
                    <select className="form-select" defaultValue="Asia/Kolkata">
                        <option>Asia/Kolkata</option>
                        <option>Asia/Dubai</option>
                        <option>Europe/London</option>
                        <option>America/New_York</option>
                    </select>
                </div>
                <div className="form-field">
                    <label>Currency</label>
                    <select className="form-select" defaultValue="INR">
                        <option>INR</option>
                        <option>USD</option>
                        <option>EUR</option>
                        <option>GBP</option>
                    </select>
                </div>
            </div>
        </div>
    </>
);

/* =========================================================
   WHATSAPP TAB
   ========================================================= */
const WhatsAppTab = () => (
    <>
        <div className="settings-header">
            <h1 className="settings-title">WhatsApp Configuration</h1>
            <p className="settings-subtitle">Connect and configure your WhatsApp Business account</p>
        </div>

        <div className="settings-card">
            <div className="status-banner">
                <span className="status-banner-dot"></span>
                <div className="status-banner-content">
                    <p className="status-banner-title">Connected — +91 98765 43210</p>
                    <p className="status-banner-sub">WaCRM Business · Verified</p>
                </div>
            </div>

            <div className="form-field" style={{ marginBottom: 20 }}>
                <label>WhatsApp Phone Number ID</label>
                <input className="form-input" type="password" defaultValue="123456789012345" />
            </div>

            <div className="form-field" style={{ marginBottom: 20 }}>
                <label>Business Account ID</label>
                <input className="form-input" type="password" defaultValue="987654321098765" />
            </div>

            <div className="form-field" style={{ marginBottom: 20 }}>
                <label>Access Token</label>
                <input className="form-input" type="password" defaultValue="EAAxxxxxxxxxxxx" />
            </div>

            <div className="form-field" style={{ marginBottom: 24 }}>
                <label>Webhook Verify Token</label>
                <input className="form-input" type="password" defaultValue="wh_verify_token_123" />
            </div>

            <div className="form-row-2" style={{ marginBottom: 0 }}>
                <button className="integration-btn configure" style={{ padding: '12px 16px', fontSize: 14 }}>
                    Test Connection
                </button>
                <button className="btn-submit" style={{ marginTop: 0 }}>
                    Save Config
                </button>
            </div>
        </div>
    </>
);

/* =========================================================
   NOTIFICATIONS TAB
   ========================================================= */
const NotificationsTab = () => {
    const [toggles, setToggles] = useState({
        ticket: true,
        chat: true,
        payment: true,
        broadcast: false,
        stock: true,
        order: true,
    });

    const toggle = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

    const items = [
        { key: 'ticket', title: 'New Ticket Created', desc: 'Get notified when a new support ticket is created' },
        { key: 'chat', title: 'New Chat Message', desc: 'Get notified when a customer sends a message' },
        { key: 'payment', title: 'Payment Received', desc: 'Get notified for successful payments' },
        { key: 'broadcast', title: 'Broadcast Completed', desc: 'Get notified when a broadcast campaign completes' },
        { key: 'stock', title: 'Low Stock Alert', desc: 'Get notified when product stock is low' },
        { key: 'order', title: 'New Order Placed', desc: 'Get notified when a new order is placed' },
    ];

    return (
        <>
            <div className="settings-header">
                <h1 className="settings-title">Notifications</h1>
                <p className="settings-subtitle">Choose what you want to be notified about</p>
            </div>

            <div className="settings-card">
                {items.map(item => (
                    <div className="toggle-row" key={item.key}>
                        <div className="toggle-info">
                            <p className="toggle-title">{item.title}</p>
                            <p className="toggle-desc">{item.desc}</p>
                        </div>
                        <Toggle on={toggles[item.key]} onChange={() => toggle(item.key)} />
                    </div>
                ))}
            </div>
        </>
    );
};

/* =========================================================
   SECURITY TAB
   ========================================================= */
const SecurityTab = () => (
    <>
        <div className="settings-header">
            <h1 className="settings-title">Security</h1>
            <p className="settings-subtitle">Manage your account security settings</p>
        </div>

        <div className="settings-card">
            <h2 className="card-title">Change Password</h2>

            <div className="form-field" style={{ marginBottom: 20 }}>
                <label>Current Password</label>
                <input className="form-input" type="password" placeholder="••••••••" />
            </div>

            <div className="form-field" style={{ marginBottom: 20 }}>
                <label>New Password</label>
                <input className="form-input" type="password" placeholder="••••••••" />
            </div>

            <div className="form-field" style={{ marginBottom: 8 }}>
                <label>Confirm New Password</label>
                <input className="form-input" type="password" placeholder="••••••••" />
            </div>

            <button className="btn-submit">Update Password</button>
        </div>
    </>
);

/* =========================================================
   APPEARANCE TAB
   ========================================================= */
const AppearanceTab = () => {
    const [theme, setTheme] = useState('light');

    return (
        <>
            <div className="settings-header">
                <h1 className="settings-title">Appearance</h1>
                <p className="settings-subtitle">Customize how the dashboard looks</p>
            </div>

            <div className="settings-card">
                <h2 className="card-title">Theme</h2>

                <div className="theme-options">
                    <div className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                        <div className="theme-preview light"></div>
                        <div className="theme-label">Light</div>
                    </div>
                    <div className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                        <div className="theme-preview dark"></div>
                        <div className="theme-label">Dark</div>
                    </div>
                    <div className={`theme-option ${theme === 'auto' ? 'active' : ''}`} onClick={() => setTheme('auto')}>
                        <div className="theme-preview auto"></div>
                        <div className="theme-label">System</div>
                    </div>
                </div>
            </div>
        </>
    );
};

/* =========================================================
   INTEGRATIONS TAB
   ========================================================= */
const INTEGRATIONS = [
    { id: 'shopify', name: 'Shopify', logo: '🛍️', status: 'connected', desc: 'Sync products, orders, customers', action: 'configure' },
    { id: 'woocommerce', name: 'WooCommerce', logo: '🛒', status: 'not-connected', desc: 'WordPress e-commerce integration', action: 'connect' },
    { id: 'gsheets', name: 'Google Sheets', logo: '📊', status: 'connected', desc: 'Export data to spreadsheets', action: 'configure' },
    { id: 'zapier', name: 'Zapier', logo: '⚡', status: 'not-connected', desc: 'Connect with 5000+ apps', action: 'connect' },
    { id: 'hubspot', name: 'HubSpot', logo: '🔶', status: 'not-connected', desc: 'CRM data synchronization', action: 'connect' },
    { id: 'mailchimp', name: 'Mailchimp', logo: '📧', status: 'not-connected', desc: 'Email marketing sync', action: 'connect' },
];

const IntegrationsTab = () => (
    <>
        <div className="settings-header">
            <h1 className="settings-title">Integrations</h1>
            <p className="settings-subtitle">Connect with third-party tools and services</p>
        </div>

        <div className="integrations-grid">
            {INTEGRATIONS.map(item => (
                <div className="integration-card" key={item.id}>
                    <div className="integration-header">
                        <div className="integration-logo">{item.logo}</div>
                        <div className="integration-info">
                            <p className="integration-name">{item.name}</p>
                            <span className={`integration-status ${item.status}`}>
                                {item.status === 'connected' ? 'Connected' : 'Not Connected'}
                            </span>
                        </div>
                    </div>

                    <p className="integration-desc">{item.desc}</p>

                    <button className={`integration-btn ${item.action}`}>
                        {item.action === 'configure' ? 'Configure' : 'Connect'}
                    </button>
                </div>
            ))}
        </div>
    </>
);

/* =========================================================
   MAIN COMPONENT
   ========================================================= */
const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <AppLayout title="Settings">
            <div className="settings-page">
                {/* Left navigation */}
                <aside className="settings-nav">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            className={`settings-nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <item.Icon size={17} strokeWidth={2.2} />
                            {item.label}
                        </button>
                    ))}
                </aside>

                {/* Right content */}
                <main className="settings-content">
                    {activeTab === 'general' && <GeneralTab />}
                    {activeTab === 'whatsapp' && <WhatsAppTab />}
                    {activeTab === 'notifications' && <NotificationsTab />}
                    {activeTab === 'security' && <SecurityTab />}
                    {activeTab === 'appearance' && <AppearanceTab />}
                    {activeTab === 'integrations' && <IntegrationsTab />}
                </main>
            </div>
        </AppLayout>
    );
};

export default Settings;