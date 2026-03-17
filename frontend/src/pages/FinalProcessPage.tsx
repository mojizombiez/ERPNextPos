import React, { useState } from 'react';
import { CheckCircle, Printer, ArrowRight, Utensils, Mail, Smartphone, Send, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FinalProcessPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { order, change, orderUUID } = location.state || { order: { runningNumber: '000', totalPrice: 0 }, change: 0, orderUUID: '' };

    const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'sms' | null>(null);
    const [recipient, setRecipient] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [sendError, setSendError] = useState('');

    const handlePrint = async () => {
        try {
            await window.go.main.App.PrintSlip(order);
        } catch (err) {
            console.error("Print failed", err);
        }
    };

    const handlePrintKitchen = async () => {
        try {
            await window.go.main.App.PrintKitchenBill(order);
        } catch (err) {
            console.error("Kitchen print failed", err);
        }
    };

    const handlePrintBoth = async () => {
        try {
            await window.go.main.App.PrintSlip(order);
            await window.go.main.App.PrintKitchenBill(order);
        } catch (err) {
            console.error("Print both failed", err);
        }
    };

    const handleSendReceipt = async () => {
        if (!recipient || !deliveryMethod || !orderUUID) return;
        setIsSending(true);
        setSendError('');
        setSendSuccess(false);
        try {
            // @ts-ignore
            await window.go.main.App.SendReceipt(orderUUID, deliveryMethod, recipient);
            setSendSuccess(true);
            setTimeout(() => setSendSuccess(false), 5000);
        } catch (err) {
            console.error("Failed to send receipt", err);
            setSendError(String(err));
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-8 h-full" style={{ padding: '2rem' }}>
            <div className="card glass flex flex-col items-center gap-6" style={{ maxWidth: '540px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
                <CheckCircle size={80} color="#10b981" />

                <div>
                    <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>{t('checkout.success', { defaultValue: 'Order Complete!' })}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{t('checkout.order_processed', { defaultValue: 'Order #{{number}} processed successfully.', number: order.runningNumber })}</p>
                </div>

                <div style={{ width: '100%', padding: '1.2rem', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div className="flex justify-between mb-2 text-lg">
                        <span className="text-[var(--text-secondary)] opacity-60">{t('checkout.total_price', { defaultValue: 'Total Price' })}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>฿{order.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                        <span className="text-[var(--text-secondary)] opacity-60">{t('checkout.change')}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>฿{change.toFixed(2)}</span>
                    </div>
                </div>

                {/* Digital Receipt Selection */}
                <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">{t('checkout.digital_receipt', { defaultValue: 'Digital Receipt' })}</h3>

                    {!deliveryMethod ? (
                        <div className="flex gap-3 justify-center mb-4">
                            <button
                                className="btn flex items-center gap-2 px-6"
                                style={{ background: 'var(--glass-bg)' }}
                                onClick={() => { setDeliveryMethod('email'); setRecipient(''); }}
                            >
                                <Mail size={18} /> {t('checkout.email', { defaultValue: 'Email' })}
                            </button>
                            <button
                                className="btn flex items-center gap-2 px-6"
                                style={{ background: 'var(--glass-bg)' }}
                                onClick={() => { setDeliveryMethod('sms'); setRecipient(''); }}
                            >
                                <Smartphone size={18} /> {t('checkout.sms', { defaultValue: 'SMS' })}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        type={deliveryMethod === 'email' ? 'email' : 'tel'}
                                        placeholder={deliveryMethod === 'email' ? t('checkout.email_placeholder') : t('checkout.sms_placeholder')}
                                        className="glass w-full text-sm"
                                        style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '2px solid var(--border-color)' }}
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => setDeliveryMethod(null)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600"
                                    >
                                        {t('common.back', { defaultValue: 'Back' })}
                                    </button>
                                </div>
                                <button
                                    className="btn flex items-center justify-center p-3"
                                    style={{ background: 'var(--accent-primary)', color: 'white', borderRadius: '12px', border: 'none' }}
                                    onClick={handleSendReceipt}
                                    disabled={isSending || !recipient}
                                >
                                    {isSending ? <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={20} />}
                                </button>
                            </div>

                            {sendSuccess && (
                                <div className="flex items-center justify-center gap-2 text-emerald-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                                    <Check size={14} /> {t('checkout.sent_success', { defaultValue: 'Receipt sent successfully!' })}
                                </div>
                            )}

                            {sendError && (
                                <div className="text-rose-500 text-[10px] font-bold">
                                    {t('checkout.send_failed', { defaultValue: 'Error: ' })} {sendError}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        className="btn w-full flex items-center justify-center gap-2"
                        style={{ background: 'var(--accent-gradient)', color: 'white', border: 'none', height: '3.5rem', fontSize: '1.1rem' }}
                        onClick={handlePrintBoth}
                    >
                        <Printer size={22} /> {t('checkout.print_both', { defaultValue: 'Print Both' })}
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="btn flex items-center justify-center gap-2" onClick={handlePrint}>
                            <Printer size={20} /> {t('checkout.print_receipt')}
                        </button>
                        <button
                            className="btn flex items-center justify-center gap-2"
                            style={{ background: 'rgba(59, 130, 146, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}
                            onClick={handlePrintKitchen}
                        >
                            <Utensils size={20} /> {t('checkout.print_kitchen')}
                        </button>
                    </div>
                    <button
                        className="btn w-full flex items-center justify-center gap-2"
                        style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        onClick={() => navigate('/orders')}
                    >
                        {t('checkout.new_order', { defaultValue: 'New Order' })} <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinalProcessPage;
