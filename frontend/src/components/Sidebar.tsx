import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingCart,
    ClipboardList,
    Package,
    Users,
    Gift,
    Truck,
    Unlock,
    Settings,
    Database,
    ShieldCheck,
    User,
    RefreshCw,
    LogOut,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
    onSwitchUser: () => void;
    onLock?: () => void;
    isCollapsed: boolean;
    onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSwitchUser, onLock, isCollapsed, onToggle }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    const menuItems = [
        { icon: <LayoutDashboard size={24} />, label: t('sidebar.dashboard'), path: '/dashboard' },
        { icon: <ClipboardList size={24} />, label: t('sidebar.orders'), path: '/orders' },
        { icon: <ShoppingCart size={24} />, label: t('sidebar.checkout'), path: '/checkout' },
        { icon: <Package size={24} />, label: t('sidebar.stock'), path: '/stock' },
        { icon: <Users size={24} />, label: t('sidebar.customers'), path: '/customers' },
        { icon: <Gift size={24} />, label: t('sidebar.campaigns'), path: '/campaigns' },
        { icon: <Truck size={24} />, label: t('sidebar.delivery', { defaultValue: 'Delivery' }), path: '/delivery' },
        { icon: <Unlock size={24} />, label: t('sidebar.drawer', { defaultValue: 'Drawer' }), path: '/drawer' },
        { icon: <Settings size={24} />, label: t('sidebar.settings'), path: '/settings' },
        { icon: <ShieldCheck size={24} />, label: t('sidebar.staff'), path: '/admin', state: { tab: 'staff' } },
        { icon: <Database size={24} />, label: t('sidebar.admin'), path: '/admin', state: { tab: 'products' } },
    ];

    const [version, setVersion] = React.useState('v0.0.0');

    React.useEffect(() => {
        // @ts-ignore
        if (window.go && window.go.main && window.go.main.App) {
            // @ts-ignore
            window.go.main.App.GetAppVersion().then((v: string) => setVersion(`v${v}`));
        }
    }, []);

    const handleLogout = () => {
        if (onLock) {
            onLock();
        } else {
            logout();
            navigate('/');
        }
    };

    return (
        <aside className="glass" style={{
            width: isCollapsed ? '84px' : '260px',
            margin: '1rem 0 1rem 1rem',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            padding: isCollapsed ? '1.5rem 0.75rem' : '1.5rem 1rem',
            border: '1px solid var(--border-color)',
            position: 'relative',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'visible'
        }}>
            {/* Toggle Button */}
            <button
                onClick={onToggle}
                style={{
                    position: 'absolute',
                    right: '-12px',
                    top: '84px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    zIndex: 10,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Version Badge */}
            {!isCollapsed && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'var(--accent-primary)',
                    opacity: 0.5,
                    pointerEvents: 'none'
                }}>
                    {version}
                </div>
            )}

            {/* Logo Section */}
            <NavLink
                to="/checkout"
                style={{
                    padding: isCollapsed ? '0.5rem 0 2rem 0' : '0.5rem 1.25rem 2rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '0.75rem',
                    textDecoration: 'none',
                    cursor: 'pointer'
                }}
            >
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.5)',
                    flexShrink: 0
                }}>
                    <ShoppingCart size={22} color="white" />
                </div>
                {!isCollapsed && (
                    <div style={{ transition: 'opacity 0.2s', opacity: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                            M
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Premium POS
                        </div>
                    </div>
                )}
            </NavLink>

            <nav style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: isCollapsed ? '0 0.25rem' : '0'
            }}>
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path + (item.state?.tab ? `-${item.state.tab}` : '')}
                        to={item.path}
                        state={item.state}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                        title={isCollapsed ? item.label : undefined}
                        style={{
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            padding: isCollapsed ? '0.75rem 0' : '0.75rem 1.25rem'
                        }}
                    >
                        <div className="icon-container" style={{ margin: isCollapsed ? '0' : undefined }}>
                            {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                        </div>
                        {!isCollapsed && (
                            <span style={{
                                fontSize: '0.875rem',
                                letterSpacing: '-0.01em',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                            }}>{item.label}</span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div style={{
                marginTop: 'auto',
                paddingTop: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                alignItems: isCollapsed ? 'center' : 'stretch'
            }}>
                {/* User Profile Section */}
                <div style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    padding: isCollapsed ? '0.4rem' : '0.6rem 0.8rem',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '0.6rem',
                    width: 'auto',
                    margin: '0 0.25rem'
                }} title={isCollapsed ? (currentUser?.nickName || currentUser?.name || 'Guest') : undefined}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: currentUser?.role === 'Manager' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                        color: currentUser?.role === 'Manager' ? '#f59e0b' : 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <User size={16} strokeWidth={2.5} />
                    </div>
                    {!isCollapsed && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {currentUser?.nickName || currentUser?.name || 'Guest'}
                            </div>
                            <div style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-secondary)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {currentUser?.role || 'Staff'}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{
                    display: isCollapsed ? 'flex' : 'grid',
                    flexDirection: isCollapsed ? 'column' : undefined,
                    gridTemplateColumns: isCollapsed ? undefined : '1fr 1fr',
                    gap: '0.5rem',
                    width: 'auto',
                    margin: '0 0.25rem'
                }}>
                    <button
                        onClick={onSwitchUser}
                        className="btn-icon"
                        title="Switch User"
                        style={{
                            height: '44px',
                            width: '100%',
                            borderRadius: '14px',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="btn-icon"
                        title="Logout/Lock"
                        style={{
                            height: '44px',
                            width: '100%',
                            borderRadius: '14px',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#f87171'
                        }}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
