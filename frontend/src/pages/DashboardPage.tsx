import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Activity, Package, Clock, RefreshCw } from 'lucide-react';

const DashboardPage = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const results = await window.go.main.App.GetDashboardStats();
            setStats(results);
        } catch (err) {
            console.error("Dashboard load failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, suffix = '', trend = 0 }: any) => (
        <div className="card animate-in fade-in slide-in-from-bottom-4" style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: `${color}15`, color: color }}>
                    <Icon size={20} />
                </div>
                {trend !== 0 && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: trend > 0 ? '#10b981' : '#ef4444' }}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div>
                <span className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-50">{title}</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[var(--text-primary)]">
                        {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}
                    </span>
                    <span className="text-sm font-bold text-[var(--text-secondary)] opacity-40">{suffix}</span>
                </div>
            </div>
        </div>
    );

    const yesterdayComparison = stats?.yesterdaySales && stats?.totalSales
        ? Math.round(((stats.totalSales - stats.yesterdaySales) / stats.yesterdaySales) * 100)
        : 0;

    return (
        <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
            <header className="flex justify-between items-center bg-secondary p-6 rounded-[24px] border border-[var(--border-color)]">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">POS Dashboard</h1>
                    <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mt-1">Local POS Analytics</p>
                </div>
                <button className="btn-icon p-3 gap-2" onClick={loadData} disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    <span className="text-sm font-bold uppercase">Refresh</span>
                </button>
            </header>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 opacity-20">
                    <RefreshCw size={48} className="animate-spin" />
                    <span className="font-black text-xl uppercase tracking-widest">Aggregating Sales Data...</span>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Revenue" value={stats?.totalSales || 0} icon={DollarSign} color="#10b981" suffix="THB" trend={yesterdayComparison} />
                        <StatCard title="Est. Profit" value={stats?.totalProfit || 0} icon={TrendingUp} color="#8b5cf6" suffix="THB" />
                        <StatCard title="Total Orders" value={stats?.orderCount || 0} icon={ShoppingBag} color="#3b82f6" suffix="TXNS" />
                        <StatCard title="Avg Ticket" value={stats?.totalSales ? (stats.totalSales / (stats.orderCount || 1)) : 0} icon={Activity} color="#f59e0b" suffix="THB/ORD" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="card col-span-2 p-6 flex flex-col gap-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)]">Hourly Sales Distribution</h3>
                            <div className="h-48 flex items-end gap-1.5 px-2">
                                {(stats?.hourlySales || Array(24).fill(0)).map((val: number, i: number) => {
                                    const max = Math.max(...(stats?.hourlySales || [1]));
                                    const height = max > 0 ? (val / max) * 100 : 0;
                                    const isNow = new Date().getHours() === i;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div
                                                className={`w-full rounded-t-md transition-all ${isNow ? 'bg-[var(--accent-primary)]' : 'bg-white/10 group-hover:bg-white/20'}`}
                                                style={{ height: `${Math.max(4, height)}%` }}
                                                title={`${i}:00 - ฿${val.toLocaleString()}`}
                                            />
                                            <span className={`text-sm font-bold ${isNow ? 'text-[var(--accent-primary)]' : 'opacity-20'}`}>{i}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="card p-6 flex flex-col gap-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)]">Top Selling Items</h3>
                            <div className="flex flex-col gap-3">
                                {(stats?.topProducts || []).map((p: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold line-clamp-1">{p.name}</span>
                                            <span className="text-sm opacity-40 font-bold uppercase">Popular item</span>
                                        </div>
                                        <span className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-sm font-black px-2 py-1 rounded-lg">x{p.qty}</span>
                                    </div>
                                ))}
                                {(!stats?.topProducts || stats.topProducts.length === 0) && (
                                    <div className="text-center py-10 opacity-20 text-sm font-bold uppercase">No items sold yet</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                        <div className="card p-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] mb-6">Revenue by Category</h3>
                            <div className="space-y-4">
                                {(stats?.categorySales || []).map((cat: any, i: number) => {
                                    const total = stats?.totalSales || 1;
                                    const percent = (cat.value / total) * 100;
                                    return (
                                        <div key={i} className="flex flex-col gap-1.5">
                                            <div className="flex justify-between text-sm font-bold">
                                                <span className="opacity-70">{cat.name}</span>
                                                <span>฿{cat.value.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-1000"
                                                    style={{ width: `${percent}%`, opacity: 1 - (i * 0.15) }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!stats?.categorySales || stats.categorySales.length === 0) && (
                                    <div className="text-center py-10 opacity-20 text-sm font-bold uppercase">No category data</div>
                                )}
                            </div>
                        </div>

                        <div className="card p-8 bg-[var(--accent-gradient)] text-white border-none flex flex-col justify-between overflow-hidden relative">
                            <TrendingUp size={120} className="absolute -bottom-8 -right-8 opacity-10" />
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] opacity-80 mb-6">Market Performance</h3>
                                <div className="space-y-1">
                                    <p className="text-3xl font-black">
                                        {yesterdayComparison > 0 ? `+${yesterdayComparison}%` : `${yesterdayComparison}%`}
                                    </p>
                                    <p className="text-sm font-bold opacity-70 uppercase tracking-widest italic">Growth vs Yesterday</p>
                                </div>
                            </div>
                            <div className="bg-white/30 p-4 rounded-2xl mt-6">
                                <p className="text-sm leading-relaxed font-medium">
                                    Your POS is currently performing {yesterdayComparison >= 0 ? 'better' : 'lower'} than yesterday.
                                    {stats?.topProducts?.[0] ? ` ${stats.topProducts[0].name} is currently your best performing item.` : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
