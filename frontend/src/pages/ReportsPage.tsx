import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    BarChart3, 
    PieChart, 
    Download, 
    RefreshCw, 
    Cloud, 
    Monitor, 
    DollarSign, 
    ShoppingBag, 
    TrendingUp, 
    Activity,
    ChevronRight,
    Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ReportsPage = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [isCloud, setIsCloud] = useState(false);
    const [appMode, setAppMode] = useState('online');
    const [range, setRange] = useState('today');
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString(),
        to: new Date().toISOString()
    });
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        window.go.main.App.GetAppMode().then(setAppMode);
        loadReport();
    }, [range, isCloud]);

    const loadReport = async () => {
        setLoading(true);
        try {
            let from = new Date();
            let to = new Date();

            if (range === 'today') {
                from.setHours(0, 0, 0, 0);
                to.setHours(23, 59, 59, 999);
            } else if (range === '7d') {
                from.setDate(from.getDate() - 7);
            } else if (range === '30d') {
                from.setDate(from.getDate() - 30);
            }

            const data = await window.go.main.App.GetReportStats(from.toISOString(), to.toISOString(), isCloud);
            setStats(data);
        } catch (err) {
            console.error("Failed to load report", err);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, suffix = "" }: any) => (
        <div className="card p-6 flex flex-col gap-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
                <div style={{ backgroundColor: `${color}15`, color: color }} className="p-3 rounded-2xl">
                    <Icon size={24} />
                </div>
                <div className="opacity-10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform">
                    <Icon size={100} />
                </div>
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-secondary opacity-50">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                    <span className="text-xs font-bold opacity-30">{suffix}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
            {/* Header with Controls */}
            <header className="glass p-6 rounded-[24px] border border-[var(--glass-border)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">{t('reports.title', { defaultValue: 'Advanced Reporting' })}</h1>
                    <p className="text-sm font-bold text-[var(--accent-primary)] uppercase tracking-widest mt-1">
                        {isCloud ? 'ERPNext Cloud Analytics' : 'Local Terminal Analytics'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Range Selector */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        {['today', '7d', '30d'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${range === r ? 'bg-[var(--accent-primary)] text-white' : 'opacity-40 hover:opacity-100'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    {/* Source Toggle */}
                    {appMode !== 'standalone' && (
                        <button 
                            onClick={() => setIsCloud(!isCloud)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${isCloud ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}
                        >
                            {isCloud ? <Cloud size={16} /> : <Monitor size={16} />}
                            {isCloud ? 'Cloud' : 'Local'}
                        </button>
                    )}

                    <button className="btn-icon p-2.5" onClick={loadReport} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {loading && !stats ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 opacity-20">
                    <RefreshCw size={48} className="animate-spin" />
                    <span className="font-black text-xl uppercase tracking-widest italic">Crunching Data...</span>
                </div>
            ) : (
                <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Total Revenue" value={stats?.totalSales || 0} icon={DollarSign} color="#10b981" suffix="THB" />
                        <StatCard title="Est. Profit" value={stats?.totalProfit || 0} icon={TrendingUp} color="#8b5cf6" suffix="THB" />
                        <StatCard title="Transactions" value={stats?.orderCount || 0} icon={ShoppingBag} color="#3b82f6" suffix="TXNS" />
                        <StatCard title="Average Ticket" value={stats?.totalSales ? (stats.totalSales / (stats.orderCount || 1)) : 0} icon={Activity} color="#f59e0b" suffix="THB/ORD" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Daily Sales Chart */}
                        <div className="card lg:col-span-2 p-6 flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-black uppercase tracking-widest opacity-50">Sales Performance</h3>
                                <div className="flex items-center gap-2 text-xs font-bold opacity-30">
                                    <BarChart3 size={14} />
                                    <span>TRENDS</span>
                                </div>
                            </div>
                            <div className="h-64 flex items-end gap-2 px-2">
                                {(stats?.dailySales || []).map((day: any, i: number) => {
                                    const max = Math.max(...(stats?.dailySales?.map((d:any) => d.Value) || [1]));
                                    const height = max > 0 ? (day.Value / max) * 100 : 0;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div className="relative w-full">
                                                <div
                                                    className="w-full rounded-t-lg bg-[var(--accent-gradient)] opacity-20 group-hover:opacity-100 transition-all cursor-pointer"
                                                    style={{ height: `${Math.max(8, height)}%` }}
                                                    title={`${day.Date}: ฿${day.Value.toLocaleString()}`}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black opacity-20 group-hover:opacity-100 rotate-45 mt-2 origin-left whitespace-nowrap">
                                                {day.Date.split('-').slice(1).join('/')}
                                            </span>
                                        </div>
                                    );
                                })}
                                {(!stats?.dailySales || stats.dailySales.length === 0) && (
                                    <div className="w-full h-full flex items-center justify-center opacity-10 italic">Not enough data for trend</div>
                                )}
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="card p-6 flex flex-col gap-6">
                            <h3 className="text-sm font-black uppercase tracking-widest opacity-50">Best Sellers</h3>
                            <div className="flex flex-col gap-3">
                                {(stats?.topProducts || []).map((p: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-default">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black truncate max-w-[150px]">{p.name}</span>
                                            <span className="text-[10px] font-black opacity-30 uppercase tracking-tighter">Popular product</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black px-2 py-1 bg-white/10 rounded-lg text-secondary">x{p.qty}</span>
                                            <ChevronRight size={14} className="opacity-20" />
                                        </div>
                                    </div>
                                ))}
                                {(!stats?.topProducts || stats.topProducts.length === 0) && (
                                    <div className="text-center py-10 opacity-20 text-sm font-bold uppercase italic">No products sold in range</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Lower Grid: Payments & Categories */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                        <div className="card p-6">
                            <h3 className="text-sm font-black uppercase tracking-widest opacity-50 mb-6">Payment Methods</h3>
                            <div className="space-y-4">
                                {(stats?.paymentSales || []).map((p: any, i: number) => {
                                    const total = stats?.totalSales || 1;
                                    const percent = (p.value / total) * 100;
                                    return (
                                        <div key={i} className="flex flex-col gap-2">
                                            <div className="flex justify-between text-sm font-black">
                                                <span className="opacity-70">{p.name}</span>
                                                <span>฿{p.value.toLocaleString()}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!stats?.paymentSales || stats.paymentSales.length === 0) && (
                                    <div className="text-center py-10 opacity-20 text-sm font-bold uppercase italic">No payment data</div>
                                )}
                            </div>
                        </div>

                        <div className="card p-6">
                            <h3 className="text-sm font-black uppercase tracking-widest opacity-50 mb-6">Category Revenue</h3>
                            <div className="space-y-4">
                                {(stats?.categorySales || []).map((c: any, i: number) => {
                                    const total = stats?.totalSales || 1;
                                    const percent = (c.value / total) * 100;
                                    return (
                                        <div key={i} className="flex flex-col gap-2">
                                            <div className="flex justify-between text-sm font-black">
                                                <span className="opacity-70">{c.name}</span>
                                                <span>฿{c.value.toLocaleString()}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-[var(--accent-primary)] rounded-full"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!stats?.categorySales || stats.categorySales.length === 0) && (
                                    <div className="text-center py-10 opacity-20 text-sm font-bold uppercase italic">No category data</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
