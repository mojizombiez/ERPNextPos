import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Tag, Calendar, Plus, Trash2, Edit2, Save, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import HelpTooltip from '../components/HelpTooltip';

const CampaignPage = () => {
    const { t } = useTranslation();
    const { showModal } = useModal();
    const [promotions, setPromotions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<any>(null);

    const loadPromotions = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            const res = await window.go.main.App.GetPromotions();
            setPromotions(res || []);
        } catch (err) {
            console.error("Failed to load promotions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPromotions();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Ensure dates are ISO strings
            const promoToSave = {
                ...editingPromo,
                startDate: new Date(editingPromo.startDate).toISOString(),
                endDate: new Date(editingPromo.endDate).toISOString()
            };
            // @ts-ignore
            await window.go.main.App.SavePromotion(promoToSave);
            setIsModalOpen(false);
            setEditingPromo(null);
            loadPromotions();
            showModal({
                title: t('common.success', { defaultValue: 'Success' }),
                message: 'Promotion saved successfully',
                type: 'success'
            });
        } catch (err) {
            showModal({ title: 'Error', message: '' + err, type: 'error' });
        }
    };

    const handleDelete = (id: number) => {
        showModal({
            title: t('common.confirm_delete', { defaultValue: 'Confirm Delete' }),
            message: 'Remove this promotion?',
            type: 'confirm',
            onConfirm: async () => {
                // For now we don't have a specific delete promotion but we can set active=false
                const promo = promotions.find(p => p.id === id);
                if (promo) {
                    promo.isActive = false;
                    // @ts-ignore
                    await window.go.main.App.SavePromotion(promo);
                    loadPromotions();
                }
            }
        });
    };

    const openCreate = () => {
        setEditingPromo({
            id: 0,
            name: '',
            code: '',
            description: '',
            type: 'AMOUNT',
            value: 0,
            minSpend: 0,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isActive: true
        });
        setIsModalOpen(true);
    };

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
                        <Gift size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {t('sidebar.campaign', { defaultValue: 'Campaigns' })}
                            <HelpTooltip titleKey="help.campaigns.title" contentKey="help.campaigns.content" size={16} />
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', opacity: 0.7, margin: 0 }}>
                            Manage active promotions and seasonal discounts
                        </p>
                    </div>
                </div>
                <button className="btn flex items-center gap-2" onClick={openCreate}>
                    <Plus size={20} />
                    <span>Create Campaign</span>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center p-20 opacity-50">Loading campaigns...</div>
                ) : promotions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-24 glass rounded-[32px] border border-dashed border-[var(--border-color)] text-[var(--text-secondary)] gap-6">
                        <div className="w-20 h-20 rounded-full bg-[var(--accent-primary)]/5 flex items-center justify-center">
                            <Sparkles size={40} className="opacity-20" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">No Active Campaigns</h3>
                            <p className="opacity-60">Create your first promotion to boost your sales!</p>
                        </div>
                        <button className="btn-icon bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-6 py-3" onClick={openCreate}>
                            <Plus size={18} /> Add Promotion
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                        {promotions.map((promo) => (
                            <div key={promo.id} className="card glass relative flex flex-col group overflow-hidden border border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 transition-all">
                                <div style={{
                                    height: '140px',
                                    background: 'var(--accent-gradient)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    position: 'relative'
                                }}>
                                    <h2 className="text-3xl font-black tracking-tighter mb-1">{promo.name}</h2>
                                    <div className="bg-white/30 px-4 py-1 rounded-full text-sm font-bold border border-white/20">
                                        CODE: {promo.code || 'AUTO'}
                                    </div>
                                    <div className="absolute top-4 right-4 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                        <CheckCircle2 size={16} />
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col gap-4">
                                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed min-h-[40px]">
                                        {promo.description || 'No description provided.'}
                                    </p>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] uppercase opacity-60">
                                            <Tag size={12} /> Promotion Details
                                        </div>
                                        <div className="flex justify-between items-center bg-[var(--glass-bg)] p-3 rounded-xl border border-[var(--border-color)]">
                                            <span className="text-sm font-medium">Type: {promo.type}</span>
                                            <span className="text-lg font-black text-[var(--accent-primary)]">
                                                {promo.type === 'PERCENT' ? `${promo.value}%` : `฿${promo.value.toLocaleString()}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm font-bold text-[var(--text-secondary)] opacity-60 pt-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            Expires: {new Date(promo.endDate).toLocaleDateString()}
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors" onClick={() => handleDelete(promo.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal - Premium White Style */}
            {isModalOpen && (
                <div className="modal-overlay-standard" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="modal-card-standard modal-viewport-constraint animate-in fade-in zoom-in duration-500 max-w-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center modal-header-sticky" style={{ backgroundColor: '#ffffff' }}>
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 leading-tight">
                                    <Sparkles className="text-[var(--accent-primary)]" size={28} strokeWidth={2.5} />
                                    {editingPromo.id === 0 ? 'Initialize Event' : 'Refine Campaign'}
                                </h1>
                                <p className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] mt-1">Marketing Intelligence Protocol</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-300 hover:text-slate-500"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        <div className="modal-scrollable-content pt-0">
                            <form onSubmit={handleSave} className="p-10 pt-4 flex flex-col gap-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="flex flex-col gap-2 col-span-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-1">Campaign Designation</label>
                                        <input
                                            className="modal-input-standard text-lg"
                                            placeholder="e.g. Summer Special 2024"
                                            value={editingPromo.name}
                                            onChange={e => setEditingPromo({ ...editingPromo, name: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-1">Security Code</label>
                                        <input
                                            className="modal-input-standard font-mono uppercase tracking-widest"
                                            placeholder="SUMMER24"
                                            value={editingPromo.code}
                                            onChange={e => setEditingPromo({ ...editingPromo, code: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-1">Reduction Strategy</label>
                                        <div className="relative">
                                            <select
                                                className="modal-input-standard appearance-none"
                                                value={editingPromo.type}
                                                onChange={e => setEditingPromo({ ...editingPromo, type: e.target.value })}
                                            >
                                                <option value="AMOUNT">Monetary (฿)</option>
                                                <option value="PERCENT">Percentage (%)</option>
                                                <option value="B1G1">Complimentary (B1G1)</option>
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                                <Tag size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-1">Benefit Value</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="modal-input-standard text-xl"
                                                value={editingPromo.value}
                                                onChange={e => setEditingPromo({ ...editingPromo, value: parseFloat(e.target.value) })}
                                                required
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm">
                                                {editingPromo.type === 'PERCENT' ? '%' : '฿'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-1">Lower Bound (฿)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="modal-input-standard text-xl"
                                                value={editingPromo.minSpend}
                                                onChange={e => setEditingPromo({ ...editingPromo, minSpend: parseFloat(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-1">Activation Date</label>
                                        <input
                                            type="date"
                                            className="modal-input-standard"
                                            value={editingPromo.startDate}
                                            onChange={e => setEditingPromo({ ...editingPromo, startDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-1">Termination Date</label>
                                        <input
                                            type="date"
                                            className="modal-input-standard"
                                            value={editingPromo.endDate}
                                            onChange={e => setEditingPromo({ ...editingPromo, endDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2 col-span-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-1">Executive Summary</label>
                                        <textarea
                                            className="modal-textarea-standard text-sm leading-relaxed font-medium"
                                            placeholder="Define the scope and objectives..."
                                            value={editingPromo.description}
                                            onChange={e => setEditingPromo({ ...editingPromo, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-2">
                                    <button
                                        type="button"
                                        className="flex-1 btn-cancel-modal"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] btn-primary-modal"
                                    >
                                        <Save size={18} strokeWidth={3} />
                                        <span>Commit Campaign</span>
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

export default CampaignPage;
