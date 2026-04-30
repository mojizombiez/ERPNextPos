import { useState } from 'react';
import { Tag, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DiscountModalProps {
    onClose: () => void;
    onApply: (amount: number, reason: string) => void;
    subtotal: number;
    initialAmount?: number;
    initialReason?: string;
}

const DiscountModal = ({ onClose, onApply, subtotal, initialAmount = 0, initialReason }: DiscountModalProps) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState<string>(initialAmount > 0 ? initialAmount.toString() : '');
    const [reason, setReason] = useState<string>(initialReason || t('discount_modal.reasons.staff'));
    const [error, setError] = useState<string | null>(null);

    const handleApply = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 0) {
            setError(t('discount_modal.error_valid'));
            return;
        }
        if (numAmount > subtotal) {
            setError(t('discount_modal.error_exceed', { total: subtotal.toLocaleString() }));
            return;
        }
        onApply(numAmount, reason);
    };

    return (
        <div className="flex flex-col gap-6 p-2">
            <header className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[var(--accent-primary)]">
                    <Tag size={18} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('discount_modal.engine')}</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800">{t('discount_modal.title')}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('discount_modal.subtitle')}</p>
            </header>

            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{t('discount_modal.amount_label')}</label>
                    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus-within:border-[var(--accent-primary)] focus-within:bg-white transition-all shadow-sm">
                        <span className="font-black text-slate-300 text-2xl shrink-0">฿</span>
                        <input
                            autoFocus
                            type="number"
                            className="flex-1 bg-transparent border-none outline-none font-black text-2xl text-slate-800 placeholder:text-slate-200"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                setError(null);
                            }}
                        />
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">{error}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{t('discount_modal.reason_label')}</label>
                    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus-within:border-[var(--accent-primary)] focus-within:bg-white transition-all shadow-sm">
                        <Tag className="text-slate-300 shrink-0" size={20} />
                        <select
                            className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            <option value={t('discount_modal.reasons.staff')}>{t('discount_modal.reasons.staff')}</option>
                            <option value={t('discount_modal.reasons.manager')}>{t('discount_modal.reasons.manager')}</option>
                            <option value={t('discount_modal.reasons.promotion')}>{t('discount_modal.reasons.promotion')}</option>
                            <option value={t('discount_modal.reasons.damaged')}>{t('discount_modal.reasons.damaged')}</option>
                            <option value={t('discount_modal.reasons.satisfaction')}>{t('discount_modal.reasons.satisfaction')}</option>
                            <option value={t('discount_modal.reasons.other')}>{t('discount_modal.reasons.other')}</option>
                        </select>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('discount_modal.net_total')}</span>
                    <span className="text-xl font-black text-slate-900">
                        ฿{Math.max(0, subtotal - (parseFloat(amount) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <button
                        onClick={onClose}
                        className="py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
                    >
                        {t('discount_modal.cancel')}
                    </button>
                    <button
                        onClick={handleApply}
                        className="py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black hover:shadow-lg transition-all"
                    >
                        {t('discount_modal.apply')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiscountModal;
