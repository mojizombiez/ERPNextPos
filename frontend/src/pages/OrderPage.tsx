import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Printer, DollarSign, Calendar, Eye, ChevronDown, Utensils, FileText, CheckCircle2, Plus, Trash } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { useTranslation } from 'react-i18next';
import HelpTooltip from '../components/HelpTooltip';

const OrderPage = () => {
    const { t } = useTranslation();
    const { showModal } = useModal();
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [period, setPeriod] = useState('Today');
    const [onlyUnsynced, setOnlyUnsynced] = useState(false);
    const [activeReprint, setActiveReprint] = useState<string | null>(null);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [modes, setModes] = useState<any[]>([]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const now = new Date();
            let from = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            let to = new Date(now.setHours(23, 59, 59, 999)).toISOString();

            if (period === 'Yesterday') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                from = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
                to = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();
            } else if (period === 'Custom') {
                // Keep default or handle custom range
            }

            const result = await (window.go.main.App as any).GetOrders(from, to, {
                filterText: filterText,
                isFilterProductName: false,
                onlyUnsynced: onlyUnsynced
            });
            setOrders(result.results || []);
            setStats({
                total: result.sumTotalPrice || 0,
                count: result.results?.length || 0
            });
        } catch (error) {
            console.error("Failed to load orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [period, onlyUnsynced]);

    const showOrderDetails = (order: any) => {
        // Build payment list: prefer the deserialized payments array, fall back to jsonData
        let parsedPayments: { method: string; amount: number }[] = [];

        if (order.payments && order.payments.length > 0) {
            parsedPayments = order.payments;
        } else if (order.customerPaid > 0) {
            parsedPayments = [{ method: order.paymentGateway || t('checkout.cash', 'Cash'), amount: order.customerPaid }];
        } else {
            // Last resort: parse jsonData
            try {
                const data = JSON.parse(order.jsonData || '{}');
                if (data.payments && data.payments.length > 0) {
                    parsedPayments = data.payments;
                } else if (data.customerPaid > 0) {
                    parsedPayments = [{ method: data.paymentGateway || t('checkout.cash', 'Cash'), amount: data.customerPaid }];
                }
            } catch (e) { /* ignore */ }
        }

        showModal({
            title: `${t('orders.details')} - ${order.runningNumber}`,
            type: 'info',
            message: (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <table className="w-full text-left">
                        <thead className="text-[var(--text-secondary)] text-sm border-b border-[var(--border-color)]">
                            <tr>
                                <th className="pb-2">{t('checkout.all_products')}</th>
                                <th className="pb-2 text-center">Qty</th>
                                <th className="pb-2 text-right">{t('checkout.total')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/30">
                            {order.subOrder?.map((sub: any) =>
                                sub.detail?.map((item: any, idx: number) => (
                                    <tr key={`${sub.id}-${idx}`} className="text-sm">
                                        <td className="py-2">{item.productName}</td>
                                        <td className="py-2 text-center">{item.quantity}</td>
                                        <td className="py-2 text-right">฿{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <div className="pt-4 border-t border-[var(--border-color)] space-y-1">
                        <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                            <span>{t('checkout.subtotal')}</span>
                            <span>฿{order.orderPrice.toFixed(2)}</span>
                        </div>
                        {order.vatPrice > 0 && (
                            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                <span>{t('checkout.vat')}</span>
                                <span>฿{order.vatPrice.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 text-[var(--accent-primary)]">
                            <span>{t('checkout.total')}</span>
                            <span>฿{order.totalPrice.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Methods Section */}
                    {parsedPayments.length > 0 && (
                        <div className="pt-4 border-t border-[var(--border-color)] space-y-2">
                            <p className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
                                {t('checkout.payment_method', 'Payment Methods')}
                            </p>
                            <div className="flex flex-col gap-2">
                                {parsedPayments.map((p, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--glass-bg)]"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-primary)' }} />
                                            <span className="font-bold text-sm text-[var(--text-primary)]">{p.method}</span>
                                        </div>
                                        <span className="font-black text-base" style={{ color: 'var(--accent-primary)' }}>
                                            ฿{Number(p.amount).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )
        });
    };

    const handleReprint = async (order: any, type: 'slip' | 'kitchen' | 'both') => {
        setActiveReprint(null);
        try {
            if (type === 'slip' || type === 'both') {
                await window.go.main.App.PrintSlip(order);
            }
            if (type === 'kitchen' || type === 'both') {
                await window.go.main.App.PrintKitchenBill(order);
            }
        } catch (err) {
            console.error("Reprint failed", err);
        }
    };

    const handleManualSync = async (uuid: string) => {
        try {
            await (window.go.main.App as any).ManualSyncOrder(uuid);
            loadOrders();
            showModal({ title: t('common.success'), type: 'success', message: 'Sync attempt completed.' });
        } catch (err) {
            console.error("Manual sync failed", err);
            showModal({ title: t('common.error'), type: 'error', message: 'Sync failed: ' + err });
            loadOrders();
        }
    };

    const handleUpdateMetadata = async (uuid: string, warehouse: string, company: string, customer: string, paymentsJson: string) => {
        try {
            await (window.go.main.App as any).UpdateOrderMetadata(uuid, warehouse, company, customer, paymentsJson);
            loadOrders();
        } catch (err) {
            console.error("Metadata update failed", err);
            showModal({ title: t('common.error'), type: 'error', message: 'Failed to update metadata: ' + err });
        }
    };

    const showFixSyncModal = async (order: any) => {
        // Load options if not loaded
        let c = companies;
        let cust = customers;
        let m = modes;
        let accounts: any[] = [];

        if (warehouses.length === 0) {
            try {
                const wh = await (window.go.main.App as any).GetWarehouses();
                setWarehouses(wh);
            } catch (e) { console.error(e); }
        }
        if (c.length === 0) {
            try {
                c = await (window.go.main.App as any).GetCompanies();
                setCompanies(c);
            } catch (e) { console.error(e); }
        }
        if (cust.length === 0) {
            try {
                cust = await (window.go.main.App as any).GetCustomers();
                setCustomers(cust);
            } catch (e) { console.error(e); }
        }
        if (m.length === 0) {
            try {
                m = await (window.go.main.App as any).GetModeOfPayments();
                setModes(m);
            } catch (e) { console.error(e); }
        }
        try {
            accounts = await (window.go.main.App as any).GetAccounts();
        } catch (e) { console.error(e); }

        // Parse current order data
        let currentWarehouse = '';
        let currentCompany = '';
        let currentCustomer = '';
        let initialPayments: any[] = [];
        try {
            const data = JSON.parse(order.jsonData);
            currentWarehouse = data.warehouse || '';
            currentCompany = data.company || '';
            currentCustomer = data.referenceNo || '';

            if (data.payments && data.payments.length > 0) {
                initialPayments = data.payments;
            } else {
                // Fallback for older orders
                initialPayments = [{
                    method: data.paymentGateway || 'Cash',
                    amount: data.customerPaid || 0,
                    account: data.passCode || ''
                }];
            }
        } catch (e) { }

        const FixForm = () => {
            const [selWarehouse, setSelWarehouse] = useState(currentWarehouse);
            const [selCompany, setSelCompany] = useState(currentCompany);
            const [selCustomer, setSelCustomer] = useState(currentCustomer);
            const [editablePayments, setEditablePayments] = useState(initialPayments);

            const updatePaymentAccount = (index: number, account: string) => {
                const updated = [...editablePayments];
                updated[index] = { ...updated[index], account };
                setEditablePayments(updated);
            };

            const updatePaymentMethod = (index: number, method: string) => {
                const updated = [...editablePayments];
                updated[index] = { ...updated[index], method };
                setEditablePayments(updated);
            };

            const updatePaymentAmount = (index: number, amount: number) => {
                const updated = [...editablePayments];
                updated[index] = { ...updated[index], amount };
                setEditablePayments(updated);
            };

            const addPayment = () => {
                setEditablePayments([...editablePayments, { method: 'Cash', amount: 0, account: '' }]);
            };

            const removePayment = (index: number) => {
                if (editablePayments.length > 1) {
                    const updated = editablePayments.filter((_, i) => i !== index);
                    setEditablePayments(updated);
                }
            };

            const totalPaid = editablePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const isBalanceOk = Math.abs(totalPaid - order.totalPrice) < 0.01;

            return (
                <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">ERPNext Customer</label>
                            <select
                                className="glass w-full p-3 rounded-xl border border-[var(--border-color)]"
                                value={selCustomer}
                                onChange={(e) => setSelCustomer(e.target.value)}
                            >
                                <option value="">-- Cash Customer --</option>
                                {cust.map(cu => <option key={cu.name} value={cu.name}>{cu.customer_name || cu.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">ERPNext Company</label>
                                <select
                                    className="glass w-full p-3 rounded-xl border border-[var(--border-color)]"
                                    value={selCompany}
                                    onChange={(e) => setSelCompany(e.target.value)}
                                >
                                    <option value="">-- Select Company --</option>
                                    {c.map(comp => <option key={comp.id} value={comp.id}>{comp.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Warehouse</label>
                                <select
                                    className="glass w-full p-3 rounded-xl border border-[var(--border-color)]"
                                    value={selWarehouse}
                                    onChange={(e) => setSelWarehouse(e.target.value)}
                                >
                                    <option value="">-- Select Warehouse --</option>
                                    {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border-t border-[var(--border-color)] pt-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-[var(--accent-primary)] uppercase tracking-wider">Payment Methods</h3>
                            <button
                                className="flex items-center gap-1 text-sm bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-1 rounded-md hover:bg-[var(--accent-primary)]/20 transition-all font-bold"
                                onClick={addPayment}
                            >
                                <Plus size={12} /> Add Payment
                            </button>
                        </div>

                        {editablePayments.map((p, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-[var(--border-color)] space-y-3 relative group">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-300">Payment #{idx + 1}</span>
                                    {editablePayments.length > 1 && (
                                        <button
                                            className="text-red-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removePayment(idx)}
                                        >
                                            <Trash size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-500 uppercase">Mode</label>
                                        <select
                                            className="glass w-full p-2 rounded-lg text-sm border border-[var(--border-color)]"
                                            value={p.method}
                                            onChange={(e) => updatePaymentMethod(idx, e.target.value)}
                                        >
                                            {m.map(mo => <option key={mo.name} value={mo.name}>{mo.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-500 uppercase">Amount (฿)</label>
                                        <input
                                            type="number"
                                            className="glass w-full p-2 rounded-lg text-sm border border-[var(--border-color)] font-mono font-bold"
                                            value={p.amount}
                                            onChange={(e) => updatePaymentAmount(idx, parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-sm font-bold text-gray-500 uppercase">GL Account (Optional)</label>
                                        <select
                                            className="glass w-full p-2 rounded-lg text-sm border border-[var(--border-color)]"
                                            value={p.account}
                                            onChange={(e) => updatePaymentAccount(idx, e.target.value)}
                                        >
                                            <option value="">-- Use Default --</option>
                                            {accounts.map(acc => <option key={acc.name} value={acc.name}>{acc.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className={`p-3 rounded-xl border flex justify-between items-center ${isBalanceOk ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'}`}>
                            <div className="flex flex-col">
                                <span className="text-sm font-black uppercase tracking-wider">Total Paid</span>
                                <span className="text-lg font-black font-mono">฿{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-black uppercase tracking-wider">Target Total</span>
                                <div className="text-sm font-bold opacity-80">฿{order.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 sticky bottom-0 bg-[var(--bg-modal)] pb-2">
                        <button
                            className="btn flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                            onClick={async () => {
                                const paymentsJson = JSON.stringify(editablePayments);
                                await handleUpdateMetadata(order.orderUUID, selWarehouse, selCompany, selCustomer, paymentsJson);
                                await handleManualSync(order.orderUUID);
                            }}
                        >
                            Update & Retry Sync
                        </button>
                    </div>
                </div>
            );
        };

        showModal({
            title: `Fix Order Sync - ${order.runningNumber}`,
            type: 'info',
            message: <FixForm />
        });
    };

    return (
        <div className="flex flex-col gap-4 p-4 h-full overflow-hidden">
            <div className="flex justify-between items-end shrink-0">
                <div className="flex flex-col gap-0.5">
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t('orders.title', { defaultValue: 'Order History' })}
                        <HelpTooltip titleKey="help.orders.title" contentKey="help.orders.content" size={16} />
                    </h1>
                    <p className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
                        {t('orders.period')}: <span className="text-[var(--accent-primary)]">{t(`orders.${period.toLowerCase()}`)}</span>
                    </p>
                </div>
                {stats && (
                    <div className="flex gap-3">
                        <div className="bg-[var(--glass-bg)] border border-[var(--border-color)] px-4 py-2 rounded-xl shadow-sm">
                            <p className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">{t('orders.total')}</p>
                            <p className="text-xl font-black text-[var(--accent-primary)]">฿{stats.total.toFixed(2)}</p>
                        </div>
                        <div className="bg-[var(--glass-bg)] border border-[var(--border-color)] px-4 py-2 rounded-xl shadow-sm">
                            <p className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">{t('sidebar.orders')}</p>
                            <p className="text-xl font-black text-[var(--text-primary)]">{stats.count}</p>
                        </div>
                    </div>
                )}
            </div>

            <header className="flex justify-between items-center bg-[var(--glass-bg)] p-3 rounded-2xl border border-[var(--border-color)] shadow-sm shrink-0">
                <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2 bg-white border border-[var(--border-color)] px-3 py-1.5 rounded-xl shadow-sm">
                        <Calendar size={16} color="var(--accent-primary)" />
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer text-sm"
                        >
                            <option value="Today">{t('orders.today')}</option>
                            <option value="Yesterday">{t('orders.yesterday')}</option>
                            <option value="Custom">{t('orders.custom')}</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full border border-[var(--border-color)] group transition-all">
                        <Search size={16} className="text-slate-400 opacity-60 group-focus-within:opacity-100 transition-opacity" />
                        <input
                            placeholder={t('common.search')}
                            className="bg-transparent border-none outline-none text-sm w-40 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:opacity-40"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            onKeyUp={(e) => e.key === 'Enter' && loadOrders()}
                        />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer glass px-3 py-1.5 rounded-xl border border-[var(--border-color)] hover:bg-white/5 transition-colors">
                        <input
                            type="checkbox"
                            checked={onlyUnsynced}
                            onChange={(e) => setOnlyUnsynced(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-[var(--border-color)] text-[var(--accent-primary)]"
                        />
                        <span className="text-sm font-bold text-[var(--text-secondary)]">Unsynced Only</span>
                    </label>
                </div>
                <button className="btn py-2 px-4 flex items-center gap-2 rounded-xl text-sm" onClick={loadOrders}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {t('header.sync_now')}
                </button>
            </header>

            <div className="card shadow-xl flex-1 overflow-hidden" style={{ padding: 0 }}>
                <div className="h-full overflow-y-auto custom-scrollbar">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                            <tr>
                                <th className="p-4 text-left font-semibold text-gray-400 uppercase text-sm tracking-wider">{t('orders.sync')}</th>
                                <th className="p-4 text-left font-semibold text-gray-400 uppercase text-sm tracking-wider">{t('orders.order_no')}</th>
                                <th className="p-4 text-left font-semibold text-gray-400 uppercase text-sm tracking-wider">{t('orders.date_time')}</th>
                                <th className="p-4 text-left font-semibold text-gray-400 uppercase text-sm tracking-wider">{t('orders.cashier')}</th>
                                <th className="p-4 text-left font-semibold text-gray-400 uppercase text-sm tracking-wider">{t('orders.total')}</th>
                                <th className="p-4 text-center font-semibold text-gray-400 uppercase text-sm tracking-wider">{t('orders.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-gray-500">
                                        {loading ? t('common.loading') : t('orders.no_orders')}
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.orderUUID} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div style={{
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                background: order.isSyncComplete ? '#10b981' : '#ef4444',
                                                boxShadow: order.isSyncComplete ? '0 0 10px rgba(16, 185, 129, 0.4)' : '0 0 10px rgba(239, 68, 68, 0.4)',
                                                cursor: order.syncError ? 'help' : 'default'
                                            }} title={order.syncError || (order.isSyncComplete ? 'Synced' : 'Pending')} />
                                            {!order.isSyncComplete && order.syncError && (
                                                <div className="text-sm text-red-400 mt-1 max-w-[120px] truncate" title={order.syncError}>
                                                    {order.syncError}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono font-bold text-[var(--accent-primary)]">
                                            {order.id || 'OFFLINE'}/{order.runningNumber}
                                        </td>
                                        <td className="p-4 text-sm text-[var(--text-secondary)]">
                                            {new Date(order.orderDate).toLocaleString()}
                                        </td>
                                        <td className="p-4 font-medium">{order.cashier || 'System'}</td>
                                        <td className="p-4 font-bold">฿{order.totalPrice.toFixed(2)}</td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-xl transition-all"
                                                    title={t('orders.details')}
                                                    onClick={() => showOrderDetails(order)}
                                                >
                                                    <Eye size={22} />
                                                </button>
                                                <div className="relative">
                                                    <button
                                                        className="w-10 h-10 flex items-center justify-center hover:bg-blue-500/10 text-blue-500 rounded-xl transition-all"
                                                        title={t('orders.reprint')}
                                                        onClick={() => setActiveReprint(activeReprint === order.orderUUID ? null : order.orderUUID)}
                                                    >
                                                        <Printer size={22} />
                                                    </button>

                                                    {activeReprint === order.orderUUID && (
                                                        <>
                                                            <div className="fixed inset-0 z-[1001]" onClick={() => setActiveReprint(null)} />
                                                            <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl z-[1002] overflow-hidden animate-in fade-in slide-in-from-top-2">
                                                                <button
                                                                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors text-sm border-b border-[var(--border-color)]"
                                                                    onClick={() => handleReprint(order, 'slip')}
                                                                >
                                                                    <FileText size={16} className="text-blue-400" />
                                                                    {t('orders.reprint_slip')}
                                                                </button>
                                                                <button
                                                                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors text-sm border-b border-[var(--border-color)]"
                                                                    onClick={() => handleReprint(order, 'kitchen')}
                                                                >
                                                                    <Utensils size={16} className="text-orange-400" />
                                                                    {t('orders.reprint_kitchen')}
                                                                </button>
                                                                <button
                                                                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors text-sm"
                                                                    onClick={() => handleReprint(order, 'both')}
                                                                >
                                                                    <CheckCircle2 size={16} className="text-green-400" />
                                                                    {t('orders.reprint_both')}
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <button
                                                    className="hover:text-red-400 transition-colors"
                                                    title={t('orders.refund')}
                                                    onClick={() => {
                                                        showModal({
                                                            title: t('orders.refund'),
                                                            message: t('orders.refund_confirm'),
                                                            type: 'confirm',
                                                            onConfirm: async () => {
                                                                try {
                                                                    await window.go.main.App.AddRefundOrder(order, order.id);
                                                                    loadOrders();
                                                                    showModal({
                                                                        title: t('common.success'),
                                                                        message: t('orders.refund_success'),
                                                                        type: 'success'
                                                                    });
                                                                } catch (e) {
                                                                    showModal({
                                                                        title: t('common.error'),
                                                                        message: t('common.error') + ': ' + e,
                                                                        type: 'error'
                                                                    });
                                                                }
                                                            }
                                                        });
                                                    }}
                                                >
                                                    <DollarSign size={20} />
                                                </button>

                                                {!order.isSyncComplete && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => showFixSyncModal(order)}
                                                            className="p-1 hover:text-orange-400 transition-colors"
                                                            title="Fix Metadata & Retry"
                                                        >
                                                            <RefreshCw size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleManualSync(order.orderUUID)}
                                                            className="p-1 hover:text-green-400 transition-colors"
                                                            title="Retry Sync"
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderPage;
