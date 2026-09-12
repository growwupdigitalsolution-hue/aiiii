import React, { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import {
    Package, Loader, Truck, CheckCircle2, RotateCcw, XCircle,
    Search, Eye, Printer, X, Phone, Mail, MapPin, Circle
} from 'lucide-react';
import './orders.css';

/* =========================================================
   SAMPLE DATA
   ========================================================= */
const INITIAL_ORDERS = [
    {
        id: 'ORD-5512', customer: 'Rahul Sharma', phone: '+91 98765 43210',
        items: 2, total: 5700, payment: 'paid', status: 'Shipped', date: 'Aug 3, 2025',
        address: '42, MG Road, Bangalore, KA 560001', email: 'rahul@example.com',
        orderItems: [
            { name: 'Premium T-Shirt', qty: 2, price: 1500, total: 3000 },
            { name: 'Jeans', qty: 1, price: 2700, total: 2700 },
        ],
        timeline: [
            { label: 'Order Placed', date: 'Aug 3, 2025', done: true },
            { label: 'Payment Confirmed', date: 'Aug 3, 2025', done: true },
            { label: 'Processing', date: '—', done: true },
            { label: 'Shipped', date: 'Aug 3, 2025', done: true },
            { label: 'Delivered', date: '—', done: false },
        ],
    },
    {
        id: 'ORD-5511', customer: 'Priya Mehta', phone: '+91 87654 32109',
        items: 1, total: 1800, payment: 'pending', status: 'Processing', date: 'Aug 3, 2025',
        address: '12, Park Street, Mumbai, MH 400001', email: 'priya@example.com',
        orderItems: [{ name: 'Kurti', qty: 1, price: 1800, total: 1800 }],
        timeline: [
            { label: 'Order Placed', date: 'Aug 3, 2025', done: true },
            { label: 'Payment Confirmed', date: '—', done: false },
            { label: 'Processing', date: 'Aug 3, 2025', done: true },
            { label: 'Shipped', date: '—', done: false },
            { label: 'Delivered', date: '—', done: false },
        ],
    },
    {
        id: 'ORD-5510', customer: 'Vikram Singh', phone: '+91 76543 21098',
        items: 2, total: 9500, payment: 'paid', status: 'Delivered', date: 'Aug 2, 2025',
        address: '5, Sector 18, Noida, UP 201301', email: 'vikram@example.com',
        orderItems: [
            { name: 'Jacket', qty: 1, price: 6000, total: 6000 },
            { name: 'Shoes', qty: 1, price: 3500, total: 3500 },
        ],
        timeline: [
            { label: 'Order Placed', date: 'Aug 1, 2025', done: true },
            { label: 'Payment Confirmed', date: 'Aug 1, 2025', done: true },
            { label: 'Processing', date: 'Aug 1, 2025', done: true },
            { label: 'Shipped', date: 'Aug 2, 2025', done: true },
            { label: 'Delivered', date: 'Aug 2, 2025', done: true },
        ],
    },
    {
        id: 'ORD-5509', customer: 'Ananya Roy', phone: '+91 65432 10987',
        items: 1, total: 3200, payment: 'paid', status: 'Pending', date: 'Aug 2, 2025',
        address: '21, Salt Lake, Kolkata, WB 700064', email: 'ananya@example.com',
        orderItems: [{ name: 'Dress', qty: 1, price: 3200, total: 3200 }],
        timeline: [
            { label: 'Order Placed', date: 'Aug 2, 2025', done: true },
            { label: 'Payment Confirmed', date: 'Aug 2, 2025', done: true },
            { label: 'Processing', date: '—', done: false },
            { label: 'Shipped', date: '—', done: false },
            { label: 'Delivered', date: '—', done: false },
        ],
    },
    {
        id: 'ORD-5508', customer: 'Suresh Kumar', phone: '+91 54321 09876',
        items: 1, total: 4500, payment: 'paid', status: 'Returned', date: 'Jul 31, 2025',
        address: '8, Anna Nagar, Chennai, TN 600040', email: 'suresh@example.com',
        orderItems: [{ name: 'Sneakers', qty: 1, price: 4500, total: 4500 }],
        timeline: [
            { label: 'Order Placed', date: 'Jul 28, 2025', done: true },
            { label: 'Payment Confirmed', date: 'Jul 28, 2025', done: true },
            { label: 'Processing', date: 'Jul 28, 2025', done: true },
            { label: 'Shipped', date: 'Jul 29, 2025', done: true },
            { label: 'Delivered', date: 'Jul 31, 2025', done: true },
        ],
    },
    {
        id: 'ORD-5507', customer: 'Kavita Patel', phone: '+91 43210 98765',
        items: 2, total: 3500, payment: 'failed', status: 'Cancelled', date: 'Jul 30, 2025',
        address: '14, CG Road, Ahmedabad, GJ 380009', email: 'kavita@example.com',
        orderItems: [
            { name: 'Top', qty: 1, price: 1500, total: 1500 },
            { name: 'Skirt', qty: 1, price: 2000, total: 2000 },
        ],
        timeline: [
            { label: 'Order Placed', date: 'Jul 30, 2025', done: true },
            { label: 'Payment Confirmed', date: '—', done: false },
            { label: 'Processing', date: '—', done: false },
            { label: 'Shipped', date: '—', done: false },
            { label: 'Delivered', date: '—', done: false },
        ],
    },
];

/* =========================================================
   STATUS CONFIG
   ========================================================= */
const statusConfig = {
    Shipped: { cls: 'shipped', Icon: Truck },
    Processing: { cls: 'processing', Icon: Loader },
    Delivered: { cls: 'delivered', Icon: CheckCircle2 },
    Pending: { cls: 'pending', Icon: Package },
    Returned: { cls: 'returned', Icon: RotateCcw },
    Cancelled: { cls: 'cancelled', Icon: XCircle },
};

const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || statusConfig.Pending;
    const { cls, Icon } = cfg;
    return (
        <span className={`status-pill ${cls}`}>
            <Icon />
            {status}
        </span>
    );
};

const paymentCls = (p) => (p === 'paid' ? 'paid' : p === 'pending' ? 'pending' : 'failed');

/* =========================================================
   STAT CARD
   ========================================================= */
const StatCard = ({ label, value, Icon, color }) => (
    <div className="order-stat-card">
        <div className={`order-stat-icon ${color}`}>
            <Icon size={18} strokeWidth={2.2} />
        </div>
        <div>
            <p className="order-stat-value">{value}</p>
            <p className="order-stat-label">{label}</p>
        </div>
    </div>
);

/* =========================================================
   ORDER ROW (Desktop + Mobile)
   ========================================================= */
const OrderRow = ({ order, onView, onPrint, isMobile }) => {
    const total = `₹${order.total.toLocaleString('en-IN')}`;

    if (isMobile) {
        return (
            <div className="mobile-order-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="order-id-link" onClick={() => onView(order)}>{order.id}</span>
                    <StatusBadge status={order.status} />
                </div>
                <div className="customer-cell">
                    <span className="customer-name">{order.customer}</span>
                    <span className="customer-phone">{order.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span className="cell-total">{total}</span>
                        <span className={`payment-pill ${paymentCls(order.payment)}`}>{order.payment}</span>
                    </div>
                    <div className="actions-cell">
                        <button className="icon-btn" onClick={() => onView(order)}><Eye size={15} /></button>
                        <button className="icon-btn" onClick={() => onPrint(order)}><Printer size={15} /></button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <tr>
            <td>
                <span className="order-id-link" onClick={() => onView(order)}>{order.id}</span>
            </td>
            <td>
                <div className="customer-cell">
                    <span className="customer-name">{order.customer}</span>
                    <span className="customer-phone">{order.phone}</span>
                </div>
            </td>
            <td className="cell-muted">{order.items} {order.items === 1 ? 'item' : 'items'}</td>
            <td className="cell-total">{total}</td>
            <td>
                <span className={`payment-pill ${paymentCls(order.payment)}`}>{order.payment}</span>
            </td>
            <td><StatusBadge status={order.status} /></td>
            <td className="cell-muted">{order.date}</td>
            <td>
                <div className="actions-cell">
                    <button className="icon-btn" onClick={() => onView(order)} title="View">
                        <Eye size={15} />
                    </button>
                    <button className="icon-btn" onClick={() => onPrint(order)} title="Print">
                        <Printer size={15} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

/* =========================================================
   ORDER DETAIL MODAL
   ========================================================= */
const OrderDetailModal = ({ order, onClose }) => {
    if (!order) return null;
    const total = `₹${order.total.toLocaleString('en-IN')}`;
    const statusCls = order.status.toLowerCase();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="order-modal" onClick={(e) => e.stopPropagation()}>
                <div className="order-modal-header">
                    <div>
                        <h2 className="order-modal-title">{order.id}</h2>
                        <div className="order-modal-badges">
                            <span className={`status-pill ${statusCls}`}>{order.status}</span>
                            <span className={`payment-pill ${paymentCls(order.payment)}`}>
                                Payment: {order.payment}
                            </span>
                        </div>
                    </div>
                    <div className="order-modal-actions">
                        <button className="order-modal-icon-btn" title="Print"><Printer size={16} /></button>
                        <button className="order-modal-icon-btn" onClick={onClose} title="Close"><X size={16} /></button>
                    </div>
                </div>

                <div className="order-modal-body">
                    <div className="order-modal-grid">
                        <div>
                            <p className="section-label">Customer</p>
                            <p className="customer-name-lg">{order.customer}</p>
                            <div className="customer-info-row"><Phone size={14} />{order.phone}</div>
                            <div className="customer-info-row"><Mail size={14} />{order.email}</div>
                            <div className="customer-info-row"><MapPin size={14} />{order.address}</div>
                        </div>

                        <div>
                            <p className="section-label">Order Timeline</p>
                            <div className="timeline">
                                {order.timeline.map((t, i) => (
                                    <div className="timeline-item" key={i}>
                                        <div className={`timeline-marker ${t.done ? '' : 'pending'}`}>
                                            {t.done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                        </div>
                                        {i < order.timeline.length - 1 && <div className="timeline-line"></div>}
                                        <div className="timeline-content">
                                            <span className="timeline-title">{t.label}</span>
                                            <span className="timeline-date">{t.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="section-label">Order Items</p>
                        <table className="order-items-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th className="th-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.orderItems.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.name}</td>
                                        <td>{item.qty}</td>
                                        <td>₹{item.price.toLocaleString('en-IN')}</td>
                                        <td className="th-right">₹{item.total.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="order-total-row">
                            <span>Total:</span>
                            <span>{total}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */
const Orders = () => {
    const [orders] = useState(INITIAL_ORDERS);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    const stats = {
        pending: orders.filter(o => o.status === 'Pending').length,
        processing: orders.filter(o => o.status === 'Processing').length,
        shipped: orders.filter(o => o.status === 'Shipped').length,
        delivered: orders.filter(o => o.status === 'Delivered').length,
        returned: orders.filter(o => o.status === 'Returned').length,
        cancelled: orders.filter(o => o.status === 'Cancelled').length,
    };

    const filtered = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout title="Orders">
            <div className="orders-page">

                {/* 1. Statistics Cards */}
                <div className="orders-stats-grid">
                    <StatCard label="Pending" value={stats.pending} Icon={Package} color="gray" />
                    <StatCard label="Processing" value={stats.processing} Icon={Loader} color="orange" />
                    <StatCard label="Shipped" value={stats.shipped} Icon={Truck} color="blue" />
                    <StatCard label="Delivered" value={stats.delivered} Icon={CheckCircle2} color="green" />
                    <StatCard label="Returned" value={stats.returned} Icon={RotateCcw} color="orange" />
                    <StatCard label="Cancelled" value={stats.cancelled} Icon={XCircle} color="red" />
                </div>

                {/* 2. All Orders Container */}
                <div className="orders-container">
                    <div className="orders-header">
                        <h2 className="orders-title">All Orders</h2>
                        <div className="search-box">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="table-scroll">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th className="th-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(o => (
                                    <OrderRow key={o.id} order={o} onView={setSelectedOrder} onPrint={() => window.print()} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="mobile-orders">
                        {filtered.map(o => (
                            <OrderRow key={o.id} order={o} onView={setSelectedOrder} onPrint={() => window.print()} isMobile />
                        ))}
                    </div>
                </div>

            </div>

            {/* 3. Order Detail Modal */}
            <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        </AppLayout>
    );
};

export default Orders;