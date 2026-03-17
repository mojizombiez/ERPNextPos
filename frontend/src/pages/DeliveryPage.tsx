import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, MapPin, Clock, ChevronRight, Search, Package, ExternalLink, Filter, X } from 'lucide-react';
import { useModal } from '../context/ModalContext';

const DeliveryPage = () => {
    const { t } = useTranslation();
    const { showModal } = useModal();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadDeliveries = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            const res = await window.go.main.App.GetDeliveryOrders();
            // Filter only those with delivery price > 0 or specific status
            const filtered = (res?.results || []).filter((o: any) => o.deliveryPrice > 0);
            setOrders(filtered);
        } catch (err) {
            console.error("Failed to load deliveries", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeliveries();
    }, []);

    const filteredOrders = orders.filter(o =>
        o.runningNumber.includes(searchTerm) ||
        o.claimPhoneNo?.includes(searchTerm)
    );

    return (
        <div className="flex flex-col gap-6 p-2 h-full">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '16px',
                        background: 'var(--accent-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.4)'
                    }}>
                        <Truck size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                            {t('sidebar.delivery', { defaultValue: 'Delivery' })}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', opacity: 0.7, margin: 0 }}>
                            Track and dispatch orders for transportation
                        </p>
                    </div>
                </div>
            </header>

            <div className="card glass flex flex-col gap-4 flex-1 overflow-hidden" style={{ padding: '1.5rem' }}>
                <div className="flex items-center gap-3 glass p-4 rounded-full border border-[var(--border-color)] group focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/10 transition-all">
                    <Search size={22} className="text-[var(--text-secondary)] opacity-50 group-focus-within:opacity-100 transition-opacity ml-1" />
                    <input
                        className="bg-transparent border-none outline-none text-lg w-full text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)] placeholder:opacity-40"
                        placeholder="Search by Order # or Phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)] opacity-50 hover:opacity-100">
                            <X size={20} />
                        </button>
                    )}
                    <button className="p-3 hover:bg-[var(--accent-primary)]/10 rounded-full text-[var(--text-secondary)] transition-colors">
                        <Filter size={22} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center p-20 opacity-50">Loading delivery queue...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-24 text-[var(--text-secondary)] gap-4 opacity-40">
                            <Package size={64} strokeWidth={1} />
                            <div className="text-center">
                                <p className="text-xl font-bold">No Deliveries Found</p>
                                <p className="text-sm">Active delivery orders will appear here.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {filteredOrders.map((order) => (
                                <div key={order.uuid} className="p-1 glass border border-[var(--border-color)] rounded-2xl flex items-center hover:border-[var(--accent-primary)]/50 transition-all group">
                                    <div className="p-5 flex-1 flex items-center gap-6">
                                        <div className="flex flex-col items-center justify-center bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] w-16 h-16 rounded-xl font-black text-xl">
                                            <span className="text-sm opacity-60 font-bold mb-[-4px]">ORDER</span>
                                            #{order.runningNumber}
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-[var(--accent-primary)] uppercase tracking-widest">Customer</span>
                                                <div className="font-bold text-[var(--text-primary)]">{order.claimPhoneNo || 'Walk-in'}</div>
                                                <div className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                                                    <Clock size={12} /> {new Date(order.orderDate).toLocaleTimeString()}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-[var(--accent-primary)] uppercase tracking-widest">Destination</span>
                                                <div className="text-sm flex items-start gap-2 text-[var(--text-primary)] font-medium">
                                                    <MapPin size={14} className="mt-1 flex-shrink-0 text-red-500" />
                                                    <span className="line-clamp-2">Standalone Address (Check customer record)</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-[var(--accent-primary)] uppercase tracking-widest">Fees</span>
                                                <div className="font-black text-[var(--text-primary)]">฿{order.deliveryPrice?.toFixed(2)}</div>
                                                <div className="text-sm text-green-500 font-bold">Paid</div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-[var(--accent-primary)] uppercase tracking-widest">Status</span>
                                                <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-sm font-bold w-fit border border-blue-500/20">
                                                    Pending Dispatch
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pr-4">
                                            <button className="p-4 bg-[var(--accent-primary)] text-white rounded-xl shadow-lg hover:translate-x-1 transition-all">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryPage;
