import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit2, Trash2, UserPlus, X, Save, Phone, Mail, MapPin, Users, Award } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import HelpTooltip from '../components/HelpTooltip';

const CustomerPage = () => {
    const { t } = useTranslation();
    const { showModal } = useModal();
    const [customers, setCustomers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            const res = await window.go.main.App.GetCustomers();
            setCustomers(res || []);
        } catch (err) {
            console.error("Failed to load customers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // @ts-ignore
            await window.go.main.App.SaveCustomer(editingCustomer);
            setIsModalOpen(false);
            setEditingCustomer(null);
            loadCustomers();
            showModal({
                title: t('common.success', { defaultValue: 'Success' }),
                message: t('customers.save_success', { defaultValue: 'Customer saved successfully' }),
                type: 'success'
            });
        } catch (err) {
            showModal({
                title: t('common.error', { defaultValue: 'Error' }),
                message: 'Failed to save customer: ' + err,
                type: 'error'
            });
        }
    };

    const handleDelete = (id: number) => {
        showModal({
            title: t('common.confirm_delete', { defaultValue: 'Confirm Delete' }),
            message: t('customers.confirm_delete_msg', { defaultValue: 'Are you sure you want to delete this customer?' }),
            type: 'confirm',
            onConfirm: async () => {
                try {
                    // @ts-ignore
                    await window.go.main.App.DeleteCustomer(id);
                    loadCustomers();
                } catch (err) {
                    showModal({ title: 'Delete Failed', message: '' + err, type: 'error' });
                }
            }
        });
    };

    const openCreate = () => {
        setEditingCustomer({ id: 0, customer_name: '', mobile_no: '', email_id: '', primary_address: '', loyalty_points: 0 });
        setIsModalOpen(true);
    };

    const openEdit = (customer: any) => {
        setEditingCustomer({ ...customer });
        setIsModalOpen(true);
    };

    const filteredCustomers = customers.filter(c =>
        (c.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.mobile_no || '').includes(searchTerm)
    );

    return (
        <div className="flex flex-col gap-4 p-4 h-full overflow-hidden">
            <header className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'var(--accent-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.4)'
                    }}>
                        <UserPlus size={20} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {t('sidebar.customers', { defaultValue: 'Customers' })}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.7, margin: 0 }}>
                            {customers.length} {t('customers.items_total', { defaultValue: 'Accounts Identified' })}
                        </p>
                    </div>
                    <HelpTooltip titleKey="help.customers.title" contentKey="help.customers.content" size={16} />
                </div>
                <button className="btn flex items-center gap-2" onClick={openCreate} style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}>
                    <Plus size={18} />
                    <span>{t('customers.add_new', { defaultValue: 'Add Customer' })}</span>
                </button>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-4 shrink-0 overflow-x-auto pb-2">
                <div className="card glass p-4 flex items-center gap-4 border border-[var(--border-color)] flex-shrink-0 min-w-[200px]">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Users size={24} className="text-blue-500" />
                    </div>
                    <div>
                        <div className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Total Matrix</div>
                        <div className="text-2xl font-black text-[var(--text-primary)]">{customers.length}</div>
                    </div>
                </div>
                <div className="card glass p-4 flex items-center gap-4 border border-[var(--border-color)] flex-shrink-0 min-w-[200px]">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Award size={24} className="text-green-500" />
                    </div>
                    <div>
                        <div className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Loyalty Score</div>
                        <div className="text-2xl font-black text-[var(--text-primary)]">
                            {customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className="card glass p-4 flex items-center gap-4 border border-[var(--border-color)] flex-shrink-0 min-w-[200px]">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Mail size={24} className="text-purple-500" />
                    </div>
                    <div>
                        <div className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Comm-Sync</div>
                        <div className="text-2xl font-black text-[var(--text-primary)]">
                            {customers.filter(c => c.email_id).length}
                        </div>
                    </div>
                </div>
                <div className="card glass p-4 flex items-center gap-4 border border-[var(--border-color)] flex-shrink-0 min-w-[200px]">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <MapPin size={24} className="text-orange-500" />
                    </div>
                    <div>
                        <div className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Localized</div>
                        <div className="text-2xl font-black text-[var(--text-primary)]">
                            {customers.filter(c => c.primary_address).length}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card glass flex flex-col gap-3 flex-1 overflow-hidden" style={{ padding: '1.25rem' }}>
                <div className="flex items-center gap-3 glass p-3 rounded-full border border-[var(--border-color)] group transition-all shrink-0">
                    <Search size={18} className="text-[var(--text-secondary)] opacity-50 group-focus-within:opacity-100 transition-opacity ml-1" />
                    <input
                        className="bg-transparent border-none outline-none text-base w-full text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:opacity-40"
                        placeholder={t('customers.search_placeholder', { defaultValue: 'Search by phone or name...' })}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)] opacity-50 hover:opacity-100 mr-1">
                            <X size={18} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center p-20 text-[var(--text-secondary)] opacity-50">
                            Loading customers...
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-24 text-[var(--text-secondary)] gap-6">
                            <div className="w-24 h-24 rounded-full bg-[var(--accent-primary)]/5 flex items-center justify-center">
                                <Search size={48} className="opacity-20" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                                    {searchTerm ? 'No Results Found' : 'No Customers Yet'}
                                </h3>
                                <p className="opacity-60">
                                    {searchTerm ? 'Try adjusting your search terms' : 'Add your first customer to get started'}
                                </p>
                            </div>
                            {!searchTerm && (
                                <button className="btn flex items-center gap-2" onClick={openCreate}>
                                    <Plus size={20} />
                                    Add First Customer
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredCustomers.map((customer) => (
                                <div key={customer.id} className="p-6 glass border border-[var(--border-color)] rounded-3xl flex flex-col gap-4 relative group hover:border-[var(--accent-primary)]/50 transition-all hover:shadow-2xl hover:shadow-[var(--accent-primary)]/10">
                                    {/* Header with Avatar and Actions */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '18px',
                                                background: 'var(--accent-gradient)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.4)'
                                            }}>
                                                {customer.customer_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                                    {customer.customer_name}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm mt-0.5">
                                                    <Phone size={12} />
                                                    <span className="font-medium">{customer.mobile_no}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button className="p-3.5 hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-xl transition-colors" onClick={() => openEdit(customer)}>
                                                <Edit2 size={18} />
                                            </button>
                                            <button className="p-3.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors" onClick={() => handleDelete(customer.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Contact Details */}
                                    <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-color)]">
                                        {customer.email_id ? (
                                            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/5 flex items-center justify-center flex-shrink-0">
                                                    <Mail size={14} className="text-[var(--accent-primary)]" />
                                                </div>
                                                <span className="font-medium truncate">{customer.email_id}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)] opacity-40">
                                                <div className="w-8 h-8 rounded-lg bg-gray-500/5 flex items-center justify-center flex-shrink-0">
                                                    <Mail size={14} />
                                                </div>
                                                <span className="italic">No email</span>
                                            </div>
                                        )}
                                        {customer.primary_address ? (
                                            <div className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/5 flex items-center justify-center flex-shrink-0">
                                                    <MapPin size={14} className="text-[var(--accent-primary)]" />
                                                </div>
                                                <span className="font-medium line-clamp-2">{customer.primary_address}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)] opacity-40">
                                                <div className="w-8 h-8 rounded-lg bg-gray-500/5 flex items-center justify-center flex-shrink-0">
                                                    <MapPin size={14} />
                                                </div>
                                                <span className="italic">No address</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Loyalty Points Badge */}
                                    <div className="mt-2 flex justify-between items-center p-4 rounded-2xl border-2 border-[var(--accent-primary)]/20" style={{ background: 'var(--accent-gradient)', opacity: 0.9 }}>
                                        <div className="flex items-center gap-2">
                                            <Award size={20} className="text-white" />
                                            <span className="text-sm font-black text-white uppercase tracking-wider">Loyalty Points</span>
                                        </div>
                                        <span className="text-2xl font-black text-white">
                                            {(customer.loyalty_points || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit/Create Modal - Premium White Style */}
            {isModalOpen && (
                <div className="modal-overlay-standard" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="modal-card-standard modal-viewport-constraint animate-in fade-in zoom-in duration-500 max-w-md"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center modal-header-sticky" style={{ backgroundColor: '#ffffff' }}>
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                    {editingCustomer?.id ? 'Refine Client' : t('customers.new_identity', { defaultValue: 'New Identity' })}
                                </h2>
                                <p className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] mt-1">Customer Protocol</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-300 hover:text-slate-500">
                                <X size={28} />
                            </button>
                        </div>

                        <div className="modal-scrollable-content pt-0">

                            <form onSubmit={handleSave} className="p-10 pt-6 flex flex-col gap-8">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                                        <input
                                            className="modal-input-standard"
                                            placeholder="Enter customer name..."
                                            value={editingCustomer.customer_name}
                                            onChange={e => setEditingCustomer({ ...editingCustomer, customer_name: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                                        <input
                                            className="modal-input-standard"
                                            placeholder="081-XXX-XXXX"
                                            value={editingCustomer.mobile_no}
                                            onChange={e => setEditingCustomer({ ...editingCustomer, mobile_no: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                                        <input
                                            type="email"
                                            className="modal-input-standard"
                                            placeholder="customer@example.com"
                                            value={editingCustomer.email_id}
                                            onChange={e => setEditingCustomer({ ...editingCustomer, email_id: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Address</label>
                                        <textarea
                                            className="modal-textarea-standard"
                                            placeholder="Optional delivery address..."
                                            value={editingCustomer.primary_address}
                                            onChange={e => setEditingCustomer({ ...editingCustomer, primary_address: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Starting Points</label>
                                        <input
                                            type="number"
                                            className="modal-input-standard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value={editingCustomer.loyalty_points}
                                            onChange={e => setEditingCustomer({ ...editingCustomer, loyalty_points: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-4">
                                    <button
                                        type="button"
                                        className="flex-1 btn-cancel-modal"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="flex-[2] btn-primary-modal"
                                    >
                                        <Save size={18} strokeWidth={3} />
                                        <span>{editingCustomer?.id ? 'Update Client' : 'Create Client'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerPage;
