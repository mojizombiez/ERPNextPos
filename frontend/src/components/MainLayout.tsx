import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useNavigate, Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import PinCodeModal from './PinCodeModal';
import { RefreshCw, Settings, LogOut, Network, UploadCloud, Barcode } from 'lucide-react';
import logoUniversal from '../assets/images/logo-universal.png';
import LoadingOverlay from './LoadingOverlay';
import { useTranslation } from 'react-i18next';

interface MainLayoutProps {
}

const MainLayout: React.FC<MainLayoutProps> = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [isSyncing, setIsSyncing] = useState(false);
    const [autoSync, setAutoSync] = useState(true);
    const [unsyncedCount, setUnsyncedCount] = useState(0);
    const [appMode, setAppMode] = useState<'online' | 'standalone'>('online');

    const [posProfile, setPosProfile] = useState("Loading Profile...");
    const [ping, setPing] = useState<number | null>(null);
    const [scannerConnected, setScannerConnected] = useState(false);
    const { currentUser, login, logout } = useAuth();
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
    const [lockCountdown, setLockCountdown] = useState<number>(300);
    const [maxLockTime, setMaxLockTime] = useState<number>(300);
    const { activeTheme } = useTheme();

    const performSync = async () => {
        setIsSyncing(true);
        try {
            await window.go.main.App.SyncAllData();
            const profile = await window.go.main.App.GetSetting('PosProfile');
            setPosProfile(profile || "Profile Not Selected");
        } catch (err) {
            console.error("Sync failed:", err);
        } finally {
            setIsSyncing(false);
        }
    };

    const updatePing = async () => {
        try {
            const ms = await window.go.main.App.GetNetworkPing();
            setPing(ms);
        } catch (err) {
            console.error("Ping failed:", err);
            setPing(null);
        }
    };

    const updateUnsyncedCount = async () => {
        try {
            const count = await window.go.main.App.GetUnsyncedOrderCount();
            setUnsyncedCount(count);
        } catch (err) {
            console.error("Failed to get unsynced count", err);
        }
    };

    const updateScannerStatus = async () => {
        try {
            const connected = await window.go.main.App.CheckBarcodeScanner();
            setScannerConnected(connected);
        } catch (err) {
            console.error("Scanner check failed:", err);
            setScannerConnected(false);
        }
    };

    const toggleSyncMode = async () => {
        const newValue = !autoSync;
        setAutoSync(newValue);
        window.go.main.App.SaveSetting('RequireSync', newValue.toString(), 6)
            .catch(err => console.error("[MainLayout] Failed to save setting:", err));
    };

    const handleLock = () => {
        logout();
        navigate('/pincode');
    };

    const resetLockTimer = () => {
        setLockCountdown(maxLockTime);
    };

    // 1. Startup & Mode Loading
    useEffect(() => {
        const fetchProfile = async () => {
            const profile = await window.go.main.App.GetSetting('PosProfile');
            setPosProfile(profile || "NO_PROFILE");
        };

        // Initial Fetch
        fetchProfile();
        window.go.main.App.GetSetting('AppMode').then(mode => setAppMode((mode as any) || 'online'));

        // Listen for internal setting updates (like branch name changes)
        // @ts-ignore
        if (window.runtime && window.runtime.EventsOn) {
            // @ts-ignore
            window.runtime.EventsOn("settings-updated", () => {
                fetchProfile();
                window.go.main.App.GetSetting('AppMode').then(mode => setAppMode((mode as any) || 'online'));
            });
        }

        // Language initialization
        window.go.main.App.GetSetting('SelectedLanguage').then(lang => {
            if (lang && i18n.language !== lang) {
                i18n.changeLanguage(lang);
            }
        });

        // Auto-lock timer
        const timerInterval = setInterval(() => {
            setLockCountdown(prev => {
                const storedUser = localStorage.getItem('currentUser');
                if (prev <= 1 && storedUser) {
                    handleLock();
                    return 0;
                }
                return prev > 0 ? prev - 1 : 0;
            });
        }, 1000);

        // Inactivity tracking
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        const activityHandler = () => resetLockTimer();
        events.forEach(event => window.addEventListener(event, activityHandler));

        return () => {
            clearInterval(timerInterval);
            events.forEach(event => window.removeEventListener(event, activityHandler));
        };
    }, [maxLockTime]);

    // 2. Polling Logic (depends on appMode)
    useEffect(() => {
        if (appMode !== 'online') return;

        updatePing();
        updateUnsyncedCount();
        const pingInt = setInterval(updatePing, 10000);
        const countInt = setInterval(updateUnsyncedCount, 2000);

        return () => {
            clearInterval(pingInt);
            clearInterval(countInt);
        };
    }, [appMode]);

    // 3. Scanner Polling
    useEffect(() => {
        updateScannerStatus();
        const interval = setInterval(updateScannerStatus, 15000);
        return () => clearInterval(interval);
    }, []);

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('isSidebarCollapsed');
        return saved === 'true';
    });

    const toggleSidebar = () => {
        const newValue = !isSidebarCollapsed;
        setIsSidebarCollapsed(newValue);
        localStorage.setItem('isSidebarCollapsed', String(newValue));
    };

    // 2. Navigation & Auth Sync
    useEffect(() => {
        const isPinCodePage = window.location.hash === '#/pincode';
        if (!currentUser && !isPinCodePage) {
            navigate('/pincode');
        }
    }, [navigate, currentUser, window.location.hash]);

    return (
        <div style={{
            display: 'flex',
            width: '100vw',
            height: '100dvh',
            background: 'var(--bg-color)',
            color: 'var(--text-primary)',
            overflow: 'hidden'
        }}>
            {isSyncing && <LoadingOverlay />}
            {isSwitchModalOpen && (
                <PinCodeModal
                    onSuccess={(staff) => {
                        login(staff);
                        setIsSwitchModalOpen(false);
                    }}
                    onCancel={() => setIsSwitchModalOpen(false)}
                />
            )}
            <Sidebar
                onSwitchUser={() => setIsSwitchModalOpen(true)}
                isCollapsed={isSidebarCollapsed}
                onToggle={toggleSidebar}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <header className="glass" style={{
                    height: '70px',
                    margin: '0.75rem 1rem 0.5rem 0',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 1.25rem',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{
                            padding: '6px',
                            background: 'white',
                            borderRadius: '14px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(0,0,0,0.03)'
                        }}>
                            <img src={logoUniversal} alt="Logo" style={{ height: '38px', width: 'auto' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{t('sidebar.pos_system', { defaultValue: 'POS System' })}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', opacity: 0.8 }}>{posProfile}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {appMode === 'online' && (
                            <div className={`header-action-item ${autoSync ? 'active' : ''}`} onClick={toggleSyncMode}>
                                <div style={{
                                    position: 'relative',
                                    width: '36px',
                                    height: '20px',
                                    backgroundColor: autoSync ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    opacity: autoSync ? 1 : 0.3,
                                    borderRadius: '10px',
                                    transition: 'all 0.3s'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '3px',
                                        left: '3px',
                                        width: '14px',
                                        height: '14px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transition: 'all 0.3s',
                                        transform: autoSync ? 'translateX(16px)' : 'translateX(0)'
                                    }} />
                                </div>
                                <span className="stat-badge">Sync</span>
                            </div>
                        )}

                        <div className="header-action-item" style={{ cursor: 'default' }}>
                            <span style={{
                                fontSize: '15px',
                                fontWeight: 800,
                                color: lockCountdown < 30 ? '#ef4444' : '#10b981',
                                fontFamily: 'monospace'
                            }}>
                                {Math.floor(lockCountdown / 60)}:{(lockCountdown % 60).toString().padStart(2, '0')}
                            </span>
                            <span className="stat-badge">{t('header.auto_lock', { defaultValue: 'Auto Lock' })}</span>
                        </div>

                        <div className="header-action-item" title="Barcode Scanner">
                            <Barcode size={22} color={scannerConnected ? "#10b981" : "#94a3b8"} className="icon" />
                            <span className="stat-badge" style={{ color: scannerConnected ? "#10b981" : "var(--text-secondary)" }}>{scannerConnected ? t('header.scanner_ready', { defaultValue: "Scanner Ready" }) : t('header.no_scanner', { defaultValue: "No Scanner" })}</span>
                        </div>

                        <div className="header-divider" />

                        {appMode === 'online' && (
                            <>
                                <button
                                    className="header-action-item"
                                    onClick={performSync}
                                    disabled={isSyncing}
                                    style={{ border: 'none', font: 'inherit', background: 'none' }}
                                >
                                    <div className="relative">
                                        <UploadCloud size={22} color={isSyncing ? "var(--accent-primary)" : "var(--accent-secondary)"} className={isSyncing ? "animate-spin" : "icon"} />
                                        {unsyncedCount > 0 && !isSyncing && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '-6px',
                                                right: '-8px',
                                                background: '#ef4444',
                                                color: 'white',
                                                fontSize: '10px',
                                                fontWeight: 900,
                                                padding: '0 5px',
                                                borderRadius: '10px',
                                                border: '2px solid white',
                                                minWidth: '18px',
                                                textAlign: 'center'
                                            }}>
                                                {unsyncedCount}
                                            </span>
                                        )}
                                    </div>
                                    <span className="stat-badge">{isSyncing ? t('common.loading') : t('header.sync_now', { defaultValue: 'Sync Now' })}</span>
                                </button>

                                <div className="header-action-item" title="Network Ping">
                                    <Network size={22} color={ping !== null ? "#10b981" : "#ef4444"} className="icon" />
                                    <span className="stat-badge">{ping !== null ? `${ping}ms` : t('header.offline', { defaultValue: "Offline" })}</span>
                                </div>
                            </>
                        )}

                        <div className="header-divider" />

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: 'var(--glass-bg)',
                            padding: '0.5rem 1rem',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            marginRight: '0.5rem'
                        }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--accent-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                                {currentUser?.name?.charAt(0) || 'U'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('header.cashier', { defaultValue: 'Cashier' })}</span>
                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{currentUser?.name || t('header.no_user', { defaultValue: "No User" })}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-icon" style={{ width: '42px', height: '42px', borderRadius: '12px' }} onClick={() => window.location.reload()}><RefreshCw size={18} /></button>
                            <button className="btn-icon" style={{ width: '42px', height: '42px', borderRadius: '12px' }} onClick={() => navigate('/settings')}><Settings size={18} /></button>
                            <button className="btn-icon" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.1)' }} onClick={handleLock}><LogOut size={18} /></button>
                        </div>
                    </div>
                </header>

                <main style={{ flex: 1, padding: '0.25rem 1rem 1rem 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Outlet />
                </main>
            </div >
        </div >
    );
};

export default MainLayout;
