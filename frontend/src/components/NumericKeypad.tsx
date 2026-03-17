import React, { useState } from 'react';
import { Delete, Check, Banknote, CreditCard, Smartphone, Ticket, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Keypad from './Keypad';

interface NumericKeypadProps {
    totalAmount: number;
    remainingAmount: number;
    onApply: (method: string, amount: number, reference?: string) => void;
    onClose: () => void;
    allowedMethods?: { mode_of_payment: string; default_account: string }[];
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({ totalAmount, remainingAmount, onApply, onClose, allowedMethods }) => {
    const { t } = useTranslation();
    const [value, setValue] = useState(remainingAmount > 0 ? remainingAmount.toFixed(2) : '');
    const [selectedMethod, setSelectedMethod] = useState<string>(
        allowedMethods && allowedMethods.length > 0
            ? allowedMethods[0].mode_of_payment
            : 'Cash'
    );
    const [giftCardCode, setGiftCardCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [gcBalance, setGcBalance] = useState<number | null>(null);

    const paymentMethods = allowedMethods && allowedMethods.length > 0
        ? allowedMethods.map(m => {
            const mode = m.mode_of_payment;
            let icon = <Banknote size={20} />;
            if (mode.toLowerCase().includes('card') || mode.toLowerCase().includes('credit')) icon = <CreditCard size={20} />;
            if (mode.toLowerCase().includes('qr') || mode.toLowerCase().includes('bank') || mode.toLowerCase().includes('promptpay')) icon = <Smartphone size={20} />;
            if (mode.toLowerCase().includes('gift')) icon = <Ticket size={20} />;

            return { id: mode, icon, label: mode };
        })
        : [
            { id: 'Cash', icon: <Banknote size={20} />, label: t('checkout.cash') },
            { id: 'Card', icon: <CreditCard size={20} />, label: t('checkout.card') },
            { id: 'QR', icon: <Smartphone size={20} />, label: t('checkout.qr') }
        ];


    const numericValue = parseFloat(value) || 0;
    const change = Math.max(0, numericValue - remainingAmount);

    return (
        <div className="flex flex-row w-full text-slate-800 bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm min-h-[380px]">
            {/* Left Panel: Summary & Input */}
            <div className="flex-1 pl-8 pr-6 py-6 bg-slate-50/50 flex flex-col justify-between relative">

                {/* 1. Payment Method Pills */}
                <div className="w-full flex flex-col gap-2 mb-6">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-400 pl-1">{t('checkout.payment_method', 'Payment Method')}</span>
                    <div className="grid grid-cols-2 min-[400px]:grid-cols-3 gap-2 w-full">
                        {paymentMethods.map(method => {
                            const isSelected = selectedMethod === method.id;
                            return (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className="flex items-center justify-center gap-1.5 px-2 py-3 rounded-2xl border text-sm font-black uppercase tracking-wider transition-all duration-300 w-full"
                                    style={isSelected ? {
                                        background: 'var(--accent-gradient)',
                                        color: 'white',
                                        borderColor: 'var(--accent-primary)',
                                        boxShadow: '0 4px 15px -3px var(--accent-primary, rgba(139,92,246,0.4))'
                                    } : {
                                        background: 'white',
                                        color: 'var(--text-secondary)',
                                        borderColor: 'var(--glass-border)'
                                    }}
                                >
                                    <div className={isSelected ? 'opacity-100' : 'opacity-60'}>
                                        {method.icon}
                                    </div>
                                    <span>{method.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Display Area */}
                <div className="w-full flex flex-col gap-3 flex-1 justify-center max-w-sm mx-auto">

                    {/* Remaining */}
                    <div className="flex justify-between items-end border-b-2 border-slate-100 pb-3 mt-auto">
                        <span className="text-sm font-black uppercase tracking-[0.2em] text-[#ef4444] px-1">{t('checkout.remaining')}</span>
                        <span className="text-2xl font-black text-slate-800 leading-none">฿{remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* Gift Card Input (Only if selected) */}
                    {selectedMethod.toLowerCase().includes('gift') && (
                        <div className="flex flex-col bg-blue-50/50 rounded-2xl p-4 border border-blue-100 mb-2">
                            <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-2">{t('checkout.gift_card_number', 'Gift Card Number')}</span>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 bg-white rounded-xl border border-blue-100 px-3 py-2 text-sm font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter GC Code..."
                                    value={giftCardCode}
                                    onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                                />
                                <button
                                    onClick={async () => {
                                        if (!giftCardCode) return;
                                        setIsValidating(true);
                                        try {
                                            // @ts-ignore
                                            const res = await window.go.main.App.ValidateGiftCard(giftCardCode);
                                            const balance = res.balance || 0;
                                            setGcBalance(balance);
                                            // Auto-fill amount with min(balance, remaining)
                                            const applyAmount = Math.min(balance, remainingAmount);
                                            setValue(applyAmount.toFixed(2));
                                        } catch (err) {
                                            alert(err);
                                            setGcBalance(null);
                                        } finally {
                                            setIsValidating(false);
                                        }
                                    }}
                                    disabled={isValidating || !giftCardCode}
                                    className="px-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isValidating ? '...' : <Search size={16} />}
                                </button>
                            </div>
                            {gcBalance !== null && (
                                <p className="text-[10px] font-bold text-blue-600 mt-2">
                                    Current Balance: ฿{gcBalance.toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Amount Input */}
                    <div className="flex flex-col bg-white rounded-3xl p-5 shadow-sm border border-slate-100 my-2">
                        <span className="text-sm text-slate-400 font-bold uppercase tracking-[0.3em] mb-1 pl-1">{t('checkout.amount_paid', 'Amount Paid')}</span>
                        <div className="text-5xl font-black tracking-tighter text-slate-900 flex items-center h-12 mt-1">
                            <span className="text-slate-300 mr-2 text-3xl font-bold">฿</span>
                            {value || '0'}<span className="w-1.5 h-10 bg-blue-500 animate-pulse ml-2 opacity-50 rounded-full"></span>
                        </div>
                    </div>

                    {/* Change */}
                    <div className="flex justify-between items-end pt-2 mb-auto">
                        <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 px-1">{t('checkout.change')}</span>
                        <span className={`text-2xl font-black tracking-tighter leading-none ${change > 0 && selectedMethod === 'Cash' ? 'text-emerald-500' : 'text-slate-300'}`}>
                            ฿{selectedMethod === 'Cash' ? change.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                        </span>
                    </div>

                </div>
            </div>

            {/* Right Panel: Keypad & Actions */}
            <div className="w-[260px] p-5 pb-5 flex flex-col items-center justify-between bg-white border-l border-slate-100 shrink-0">
                <div className="w-full flex justify-center flex-1">
                    <Keypad
                        value={value}
                        onValueChange={setValue}
                        mode="numeric"
                        maxLength={10}
                        hideDisplay={true}
                        compact={true}
                        showConfirmButton={false}
                        onClear={() => setValue('')}
                    />
                </div>

                <div className="w-full grid grid-cols-2 gap-2 mt-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="py-5 rounded-2xl bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-colors border border-transparent hover:border-slate-300 w-full"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={() => onApply(selectedMethod, numericValue, selectedMethod.toLowerCase().includes('gift') ? giftCardCode : undefined)}
                        className="py-5 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all shadow-md shadow-slate-900/20 active:scale-95 w-full"
                    >
                        {t('checkout.apply_payment')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NumericKeypad;
