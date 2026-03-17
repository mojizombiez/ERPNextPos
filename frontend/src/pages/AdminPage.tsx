import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Database, Users, Package, Plus, Edit2, Trash2, Save, X, Search, History, Trash, RefreshCw, Layers, CheckCircle, AlertCircle } from 'lucide-react';
import AdminAuthWrapper from '../components/AdminAuthWrapper';
import { useModal } from '../context/ModalContext';
import HelpTooltip from '../components/HelpTooltip';

const AdminPage = () => {
    const { showModal } = useModal();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'products' | 'staff' | 'logs' | 'data'>((location.state as any)?.tab || 'products');
    const [products, setProducts] = useState<any[]>([]);
    const [staffs, setStaffs] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [databaseStats, setDatabaseStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'products') {
                const res = await window.go.main.App.LoadProducts();
                setProducts(res || []);
            } else if (activeTab === 'staff') {
                const res = await window.go.main.App.GetStaffs();
                setStaffs(res || []);
            } else if (activeTab === 'logs') {
                // @ts-ignore
                const res = await window.go.main.App.GetSyncLogs();
                setLogs(res || []);
            } else if (activeTab === 'data') {
                // @ts-ignore
                const res = await window.go.main.App.GetDatabaseStats();
                setDatabaseStats(res);
            }
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    useEffect(() => {
        if ((location.state as any)?.tab) {
            setActiveTab((location.state as any).tab);
        }
    }, [location.state]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (activeTab === 'products') {
                await window.go.main.App.SaveProduct(editingItem);
            } else {
                await window.go.main.App.SaveStaff(editingItem);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            loadData();
        } catch (err) {
            showModal({
                title: 'Save Failed',
                message: 'Error saving: ' + err,
                type: 'error'
            });
        }
    };

    const handleDelete = async (id: number) => {
        showModal({
            title: 'Delete Item',
            message: 'Are you sure you want to delete this item? This action is permanent.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    if (activeTab === 'products') {
                        await window.go.main.App.DeleteProduct(id);
                    } else {
                        await window.go.main.App.DeleteStaff(id);
                    }
                    loadData();
                    showModal({ title: 'Deleted', message: 'Item deleted successfully.', type: 'success' });
                } catch (err) {
                    showModal({ title: 'Delete Failed', message: 'Delete failed: ' + err, type: 'error' });
                }
            }
        });
    };

    const openEdit = (item: any) => {
        setEditingItem({ ...item });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        if (activeTab === 'products') {
            setEditingItem({ id: 0, nameTH: '', price: 0, productTypeId: 1 });
        } else {
            setEditingItem({ id: 0, name: '', nickName: '', passCode: '', isActive: true });
        }
        setIsModalOpen(true);
    };

    const filteredItems = (activeTab === 'products' ? products : activeTab === 'staff' ? staffs : logs).filter(item => {
        const search = searchTerm.toLowerCase();
        if (activeTab === 'products') {
            return item.nameTH?.toLowerCase().includes(search) || item.id.toString().includes(search);
        }
        if (activeTab === 'staff') {
            return item.name?.toLowerCase().includes(search) || item.nickName?.toLowerCase().includes(search);
        }
        return item.title?.toLowerCase().includes(search) || item.message?.toLowerCase().includes(search) || item.orderId?.toLowerCase().includes(search);
    });

    const handleClearLogs = async () => {
        if (activeTab !== 'logs') return;
        showModal({
            title: 'Clear Logs',
            message: 'Are you sure you want to delete all sync logs?',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    // @ts-ignore
                    await window.go.main.App.ClearSyncLogs();
                    loadData();
                } catch (err) {
                    showModal({ title: 'Error', message: 'Failed to clear logs: ' + err, type: 'error' });
                }
            }
        });
    };

    return (
        <AdminAuthWrapper>
            <div className="flex flex-col gap-6">
                <header className="flex justify-between items-center bg-[var(--bg-secondary)] p-4 rounded-[var(--radius-lg)] border border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                        {activeTab === 'products' ? (
                            <Database size={24} className="text-[var(--accent-primary)]" />
                        ) : activeTab === 'staff' ? (
                            <Users size={24} className="text-[var(--accent-primary)]" />
                        ) : activeTab === 'logs' ? (
                            <History size={24} className="text-[var(--accent-primary)]" />
                        ) : (
                            <Layers size={24} className="text-[var(--accent-primary)]" />
                        )}
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {activeTab === 'products' ? 'Product Database' : activeTab === 'staff' ? 'Staff Management' : activeTab === 'logs' ? 'Sync Error Logs' : 'Data Management'}
                                {activeTab === 'staff' && <HelpTooltip titleKey="help.admin_staff.title" contentKey="help.admin_staff.content" size={16} />}
                            </h1>
                            <p className="text-sm text-[var(--text-secondary)] opacity-70">
                                {activeTab === 'products' ? 'Manage local items and inventory' : activeTab === 'staff' ? 'Manage staff accounts and access codes' : activeTab === 'logs' ? 'History of synchronization events and errors' : 'Manage local database health and synchronization'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 p-1 bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-lg">
                        <button
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-primary)]/5'}`}
                            onClick={() => setActiveTab('products')}
                        >
                            Products
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'staff' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-primary)]/5'}`}
                            onClick={() => setActiveTab('staff')}
                        >
                            Staff
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'logs' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-primary)]/5'}`}
                            onClick={() => setActiveTab('logs')}
                        >
                            Logs
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'data' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-primary)]/5'}`}
                            onClick={() => setActiveTab('data')}
                        >
                            Data
                        </button>
                    </div>
                </header>

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 glass px-4 py-2 rounded-md border border-[var(--border-color)] bg-[var(--glass-bg)] shadow-sm">
                        <Search size={18} className="text-[var(--text-secondary)] opacity-50" />
                        <input
                            placeholder={`Search ${activeTab}...`}
                            className="bg-transparent border-none outline-none text-sm w-64 text-[var(--text-primary)]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {activeTab === 'logs' ? (
                        <button className="btn flex items-center gap-2 bg-red-500 hover:bg-red-600 border-none" onClick={handleClearLogs}>
                            <Trash size={18} />
                            Clear All Logs
                        </button>
                    ) : (
                        <button className="btn flex items-center gap-2" onClick={openCreate}>
                            <Plus size={18} />
                            Add New {activeTab === 'products' ? 'Product' : 'Staff'}
                        </button>
                    )}
                </div>

                {activeTab === 'data' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card shadow-premium p-8 bg-white border border-slate-100 rounded-[32px]">
                            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                <Database size={20} className="text-blue-500" />
                                Local Database Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Products', count: databaseStats?.products || 0, icon: <Package size={16} /> },
                                    { label: 'Customers', count: databaseStats?.customers || 0, icon: <Users size={16} /> },
                                    { label: 'Total Orders', count: databaseStats?.orders || 0, icon: <Save size={16} /> },
                                    { label: 'Sync Logs', count: databaseStats?.logs || 0, icon: <History size={16} /> },
                                ].map((stat, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                                            {stat.icon}
                                            {stat.label}
                                        </div>
                                        <div className="text-2xl font-black text-slate-800 tracking-tight">{stat.count}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card shadow-premium p-8 bg-white border border-slate-100 rounded-[32px]">
                            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                <RefreshCw size={20} className="text-green-500" />
                                Maintenance & Sync
                            </h3>
                            <div className="flex flex-col gap-3">
                                <button
                                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all group"
                                    onClick={async () => {
                                        try {
                                            // @ts-ignore
                                            await window.go.main.App.SyncProductsOnly();
                                            showModal({ title: 'Success', message: 'Products synced successfully', type: 'success' });
                                            loadData();
                                        } catch (e) {
                                            showModal({ title: 'Error', message: 'Sync failed: ' + e, type: 'error' });
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Package size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-black text-slate-800">Sync Products Only</div>
                                            <div className="text-sm text-slate-400 font-bold">Refresh local product records from ERPNext</div>
                                        </div>
                                    </div>
                                    <RefreshCw size={18} className="text-slate-300" />
                                </button>

                                <button
                                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all group"
                                    onClick={async () => {
                                        try {
                                            // @ts-ignore
                                            await window.go.main.App.SyncCustomersOnly();
                                            showModal({ title: 'Success', message: 'Customers synced successfully', type: 'success' });
                                            loadData();
                                        } catch (e) {
                                            showModal({ title: 'Error', message: 'Sync failed: ' + e, type: 'error' });
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Users size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-black text-slate-800">Sync Customers Only</div>
                                            <div className="text-sm text-slate-400 font-bold">Refresh customer mapping from ERPNext</div>
                                        </div>
                                    </div>
                                    <RefreshCw size={18} className="text-slate-300" />
                                </button>

                                <button
                                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all group"
                                    onClick={async () => {
                                        try {
                                            // @ts-ignore
                                            await window.go.main.App.CleanupDuplicates();
                                            showModal({ title: 'Cleanup Done', message: 'Checked and merged duplicate records', type: 'success' });
                                            loadData();
                                        } catch (e) {
                                            showModal({ title: 'Error', message: 'Cleanup failed: ' + e, type: 'error' });
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <CheckCircle size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-black text-slate-800">Cleanup Duplicates</div>
                                            <div className="text-sm text-slate-400 font-bold">Find and merge duplicate product/customer entries</div>
                                        </div>
                                    </div>
                                    <RefreshCw size={18} className="text-slate-300" />
                                </button>

                                <button
                                    className="flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-2xl border border-red-100 transition-all group mt-2"
                                    onClick={async () => {
                                        showModal({
                                            title: 'DANGER: Clear All Data',
                                            message: 'This will delete ALL local products, orders, and customers. Settings will be preserved. Are you sure?',
                                            type: 'confirm',
                                            onConfirm: async () => {
                                                try {
                                                    // @ts-ignore
                                                    await window.go.main.App.ClearAllData();
                                                    showModal({ title: 'Reset Complete', message: 'Database wiped successfully', type: 'success' });
                                                    loadData();
                                                } catch (e) {
                                                    showModal({ title: 'Error', message: 'Wipe failed: ' + e, type: 'error' });
                                                }
                                            }
                                        });
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-red-200">
                                            <Trash2 size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-black text-red-600">Factory Reset Data</div>
                                            <div className="text-sm text-red-400 font-bold">Wipe all local records and restart clean</div>
                                        </div>
                                    </div>
                                    <AlertCircle size={18} className="text-red-300" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card shadow-xl overflow-hidden" style={{ padding: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                {activeTab === 'logs' ? (
                                    <tr>
                                        <th className="p-4 text-left font-semibold text-gray-500 w-48">Timestamp</th>
                                        <th className="p-4 text-left font-semibold text-gray-500 w-24">Level</th>
                                        <th className="p-4 text-left font-semibold text-gray-500">Event / Message</th>
                                        <th className="p-4 text-left font-semibold text-gray-500 w-48">Reference</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="p-4 text-left font-semibold text-gray-500">ID</th>
                                        <th className="p-4 text-left font-semibold text-gray-500">Name</th>
                                        <th className="p-4 text-left font-semibold text-gray-500">{activeTab === 'products' ? 'Price / Category' : 'Nickname / Role'}</th>
                                        <th className="p-4 text-right font-semibold text-gray-500">Actions</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="p-10 text-center text-gray-400">Loading...</td></tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr><td colSpan={4} className="p-10 text-center text-gray-400">No records found</td></tr>
                                ) : activeTab === 'logs' ? (
                                    filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-[var(--accent-primary)]/5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td className="p-4 text-sm text-[var(--text-secondary)]">
                                                {new Date(item.timestamp).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-sm font-bold ${item.level === 'ERROR' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    {item.level}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[var(--text-primary)]">{item.title}</span>
                                                    <span className="text-sm text-[var(--text-secondary)] opacity-80">{item.message}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-mono text-[var(--text-secondary)] truncate max-w-[200px]">
                                                {item.orderId || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-[var(--accent-primary)]/5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td className="p-4 text-sm font-mono text-[var(--text-secondary)] opacity-50">#{item.id}</td>
                                            <td className="p-4 font-bold text-[var(--text-primary)]">{activeTab === 'products' ? item.nameTH : item.name}</td>
                                            <td className="p-4">
                                                {activeTab === 'products' ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[var(--accent-primary)]">฿{item.price?.toFixed(2)}</span>
                                                        <span className="text-sm text-[var(--text-secondary)] opacity-60">Type: {item.productTypeId}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="text-[var(--text-primary)]">{item.nickName}</span>
                                                        <span className={`text-sm ${item.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                                            {item.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-2 text-[var(--text-primary)]">
                                                <button className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-md transition-colors" onClick={() => openEdit(item)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-red-500/10 text-red-500 rounded-md transition-colors" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal - Premium White Style */}
                {isModalOpen && (
                    <div className="modal-overlay-standard" onClick={() => setIsModalOpen(false)}>
                        <div
                            className="modal-card-standard modal-viewport-constraint animate-in fade-in zoom-in duration-500 max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center modal-header-sticky" style={{ backgroundColor: '#ffffff' }}>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                        {editingItem?.id ? 'Refine Record' : 'Registry Entry'}
                                    </h2>
                                    <p className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] mt-1">{activeTab === 'products' ? 'Product Protocol' : 'Staff Protocol'}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-300 hover:text-slate-500">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="modal-scrollable-content pt-0">
                                <form key={activeTab} onSubmit={handleSave} className="p-10 pt-4 flex flex-col gap-8">
                                    {!editingItem ? (
                                        <div className="text-center p-12 text-slate-300 font-bold italic">Loading...</div>
                                    ) : activeTab === 'products' ? (
                                        <div className="flex flex-col gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Product Name (TH)</label>
                                                <input
                                                    className="modal-input-standard"
                                                    value={editingItem.nameTH || ''}
                                                    onChange={e => setEditingItem({ ...editingItem, nameTH: e.target.value })}
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Price (฿)</label>
                                                    <input
                                                        type="number"
                                                        className="modal-input-standard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        value={editingItem.price}
                                                        onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                                                        required
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Category ID</label>
                                                    <input
                                                        type="number"
                                                        className="modal-input-standard"
                                                        value={editingItem.productTypeId}
                                                        onChange={e => setEditingItem({ ...editingItem, productTypeId: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                                                <input
                                                    className="modal-input-standard"
                                                    value={editingItem.name || ''}
                                                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Nickname</label>
                                                    <input
                                                        className="modal-input-standard"
                                                        value={editingItem.nickName || ''}
                                                        onChange={e => setEditingItem({ ...editingItem, nickName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Passcode</label>
                                                    <input
                                                        className="modal-input-standard font-mono tracking-widest"
                                                        value={editingItem.passCode || ''}
                                                        onChange={e => setEditingItem({ ...editingItem, passCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                                        placeholder="4-6 digits"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 p-5 rounded-[20px] bg-slate-50 border border-slate-100 mt-2">
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        id="isActive"
                                                        className="sr-only peer"
                                                        checked={editingItem.isActive}
                                                        onChange={e => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
                                                </div>
                                                <label htmlFor="isActive" className="text-sm font-black text-slate-500 uppercase tracking-wider">Active Staff Member</label>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4 mt-4">
                                        <button
                                            className="flex-1 btn-cancel-modal"
                                            onClick={() => setIsModalOpen(false)}
                                        >
                                            Discard
                                        </button>
                                        <button
                                            className="flex-[2] btn-primary-modal"
                                        >
                                            <Save size={18} strokeWidth={3} />
                                            <span>{editingItem.id ? 'Commit Changes' : `Initialize ${activeTab === 'products' ? 'Product' : 'Staff'}`}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminAuthWrapper >
    );
};

export default AdminPage;
