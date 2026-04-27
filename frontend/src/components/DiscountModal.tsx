import { useState } from 'react';
import { Tag, AlertCircle } from 'lucide-react';

interface DiscountModalProps {
    onClose: () => void;
    onApply: (amount: number, reason: string) => void;
    subtotal: number;
    initialAmount?: number;
    initialReason?: string;
}

const DiscountModal = ({ onClose, onApply, subtotal, initialAmount = 0, initialReason = 'Staff Discount' }: DiscountModalProps) => {
    const [amount, setAmount] = useState<string>(initialAmount > 0 ? initialAmount.toString() : '');
    const [reason, setReason] = useState<string>(initialReason || 'Staff Discount');
    const [error, setError] = useState<string | null>(null);

    const handleApply = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 0) {
            setError('Please enter a valid amount');
            return;
        }
        if (numAmount > subtotal) {
            setError(`Discount cannot exceed subtotal (฿${subtotal.toLocaleString()})`);
            return;
        }
        onApply(numAmount, reason);
    };

    return (
        <div className="flex flex-col gap-6 p-2">
            <header className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[var(--accent-primary)]">
                    <Tag size={18} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Promotion Engine</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800">Apply Manual Discount</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adjust order total manually</p>
            </header>

            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Discount Amount (THB)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">฿</span>
                        <input
                            autoFocus
                            type="number"
                            className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-xl text-slate-800 outline-none focus:border-[var(--accent-primary)] focus:bg-white transition-all placeholder:text-slate-200"
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
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Reason for Discount</label>
                    <select
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-700 outline-none focus:border-[var(--accent-primary)] transition-all appearance-none cursor-pointer"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    >
                        <option>Staff Discount</option>
                        <option>Manager Special</option>
                        <option>Promotion</option>
                        <option>Damaged Item</option>
                        <option>Customer Satisfaction</option>
                        <option>Other</option>
                    </select>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Total After Discount</span>
                    <span className="text-lg font-black text-slate-900">
                        ฿{Math.max(0, subtotal - (parseFloat(amount) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <button
                        onClick={onClose}
                        className="py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs text-slate-400 hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        className="py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-black hover:shadow-lg transition-all"
                    >
                        Apply Discount
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiscountModal;
