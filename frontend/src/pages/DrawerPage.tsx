import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Unlock, Wallet, LogOut, Plus, Minus, Info, Save, X, History } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import HelpTooltip from '../components/HelpTooltip';
import Keypad from '../components/Keypad';

const DrawerPage = () => {
    const { t } = useTranslation();
    const { showModal } = useModal();
    const [currentDrawer, setCurrentDrawer] = useState<any>(null);
    const [drawerStats, setDrawerStats] = useState<{ totalSales: number; orderCount: number }>({ totalSales: 0, orderCount: 0 });
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState<string>('');

    const loadDrawerStatus = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            const res = await window.go.main.App.GetCurrentDrawer();
            setCurrentDrawer(res);
            if (res) {
                // @ts-ignore
                const stats = await window.go.main.App.GetDrawerStats(res.id);
                setDrawerStats(stats || { totalSales: 0, orderCount: 0 });
            }
        } catch (err) {
            console.error("Failed to load drawer status", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDrawerStatus();
    }, []);

    const performOpenDrawer = async (startBalance: number) => {
        try {
            const userStr = localStorage.getItem('currentUser');
            const user = userStr ? JSON.parse(userStr) : { id: 0, nickname: 'Unknown' };
            // @ts-ignore
            await window.go.main.App.OpenDrawer(startBalance, user.id, user.nickName || user.name || "Unknown");
            loadDrawerStatus();
            showModal({
                title: t('common.success', { defaultValue: 'Success' }),
                message: t('drawer.open_success', { defaultValue: 'Drawer opened successfully' }),
                type: 'success'
            });
        } catch (err) {
            showModal({ title: 'Error', message: '' + err, type: 'error' });
        }
    };

    const performCloseDrawer = async (actualCash: number) => {
        try {
            // @ts-ignore
            await window.go.main.App.CloseDrawer(currentDrawer.id, actualCash, actualCash);
            loadDrawerStatus();
            showModal({
                title: t('common.success', { defaultValue: 'Success' }),
                message: t('drawer.close_success', { defaultValue: 'Drawer closed and session ended' }),
                type: 'success'
            });
        } catch (err) {
            showModal({ title: 'Error', message: '' + err, type: 'error' });
        }
    };

    const openModal = (mode: 'open' | 'close') => {
        let localValue = mode === 'open' ? '1500' : '';

        const ModalContent = () => {
            const [val, setVal] = useState(localValue);

            // We need to keep the outside ref updated for the onConfirm callback
            useEffect(() => {
                localValue = val;
            }, [val]);

            return (
                <div className="flex flex-col gap-8 w-full items-center">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${mode === 'open' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                            {mode === 'open' ? <Unlock size={40} /> : <Lock size={40} />}
                        </div>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            {mode === 'open'
                                ? 'Please confirm the starting cash balance for this shift.'
                                : 'Count and reconcile the final cash balance to close the session.'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 items-center w-full">
                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest text-center">
                            {mode === 'open' ? 'Initial Asset' : 'Physical Settlement'} (฿)
                        </label>
                        <Keypad
                            value={val}
                            onValueChange={setVal}
                            mode="numeric"
                            maxLength={8}
                        />
                    </div>
                </div>
            );
        };

        showModal({
            title: mode === 'open' ? 'Shift Initialization' : 'Shift Termination',
            message: <ModalContent />,
            type: mode === 'open' ? 'info' : 'warning',
            confirmText: mode === 'open' ? 'Start Register' : 'End Register',
            cancelText: 'Cancel',
            onConfirm: () => {
                const valNum = parseFloat(localValue) || 0;
                if (mode === 'open') performOpenDrawer(valNum);
                else performCloseDrawer(valNum);
            }
        });
    };

    if (loading) return <div className="flex items-center justify-center h-full opacity-50">Loading drawer status...</div>;

    return (
        <div className="flex flex-col gap-6 p-2 h-full">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '16px',
                        background: currentDrawer ? 'var(--accent-gradient)' : 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: currentDrawer ? '0 8px 16px -4px rgba(139, 92, 246, 0.4)' : 'none'
                    }}>
                        {currentDrawer ? <Unlock size={24} color="white" /> : <Lock size={24} color="#ef4444" />}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {t('sidebar.drawer', { defaultValue: 'Cash Drawer' })}
                            <HelpTooltip titleKey="help.drawer.title" contentKey="help.drawer.content" size={16} />
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', opacity: 0.7, margin: 0 }}>
                            {currentDrawer ? 'Active session in progress' : 'No active session. Please open the drawer.'}
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Card */}
                <div className="card glass flex flex-col gap-6 p-8 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-black text-[var(--accent-primary)] uppercase tracking-widest">Current Status</span>
                            <div className={`flex items-center gap-2 text-2xl font-black ${currentDrawer ? 'text-green-500' : 'text-red-500'}`}>
                                {currentDrawer ? <><Unlock size={28} /> ACTIVE SESSION</> : <><Lock size={28} /> CLOSED</>}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div className="p-6 glass-deep flex flex-col gap-2 rounded-2xl border border-[var(--border-color)]">
                            <span className="text-sm font-bold text-[var(--text-secondary)] opacity-60 flex items-center gap-2">
                                <Wallet size={16} /> Opening Balance
                            </span>
                            <div className="text-3xl font-black text-[var(--text-primary)]">
                                ฿{currentDrawer ? currentDrawer.startBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                            </div>
                        </div>

                        <div className="p-6 glass-deep flex flex-col gap-2 rounded-2xl border border-[var(--border-color)]">
                            <span className="text-sm font-bold text-[var(--text-secondary)] opacity-60 flex items-center gap-2">
                                <Plus size={16} className="text-green-500" /> Current Sales ({drawerStats.orderCount} orders)
                            </span>
                            <div className="text-3xl font-black text-[var(--text-primary)]">
                                ฿{drawerStats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-4">
                        {!currentDrawer ? (
                            <button className="btn flex-1 py-6 text-xl flex items-center justify-center gap-3 shadow-2xl" onClick={() => openModal('open')}>
                                <Unlock size={24} />
                                OPEN DRAWER SESSION
                            </button>
                        ) : (
                            <>
                                <button className="btn flex-1 py-6 text-xl flex items-center justify-center gap-3 shadow-2xl bg-red-500 hover:bg-red-600 border-red-400" onClick={() => openModal('close')}>
                                    <Lock size={24} />
                                    CLOSE & END SHIFT
                                </button>
                                <button className="btn-icon p-6 border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--glass-bg)]">
                                    <History size={24} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="card glass p-8 flex flex-col gap-6" style={{ background: 'var(--accent-gradient)', border: 'none', color: 'white' }}>
                    <div className="flex items-center gap-3" style={{ color: 'white' }}>
                        <Info size={24} style={{ color: 'white' }} />
                        <h3 className="text-xl font-black" style={{ color: 'white' }}>Shift Summary</h3>
                    </div>
                    {currentDrawer ? (
                        <div className="flex flex-col gap-4" style={{ color: 'white' }}>
                            <div className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Opened By</span>
                                <span className="font-bold" style={{ color: 'white' }}>{currentDrawer.staffName}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Started At</span>
                                <span className="font-bold font-mono" style={{ color: 'white' }}>{new Date(currentDrawer.startTime).toLocaleTimeString()}</span>
                            </div>
                            <div className="mt-4 p-4 bg-white/10 rounded-xl" style={{ color: 'white' }}>
                                <p className="text-sm leading-relaxed" style={{ color: 'white' }}>
                                    A drawer session allows you to track cash flow accurately. All sales made during this session will be recorded against this balance.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-center gap-4" style={{ color: 'white' }}>
                            <LogOut size={48} style={{ color: 'white', opacity: 0.5 }} />
                            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Please open a new session to begin taking orders and tracking cash.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DrawerPage;
