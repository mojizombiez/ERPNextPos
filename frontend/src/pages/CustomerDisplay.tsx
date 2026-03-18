import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Heart, Store, Clock, Sparkles, Package } from 'lucide-react';

const CustomerDisplay: React.FC = () => {
    const { activeSession } = useCart();
    const { t } = useTranslation();
    const [currentTime, setCurrentTime] = useState(new Date());

    const cart = activeSession?.cart || [];
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const vat = subtotal * 0.07; // Assuming 7% VAT
    const total = subtotal + vat;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Idle Screen
    if (cart.length === 0) {
        return (
            <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-primary text-[var(--text-primary)]">
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/20 via-[var(--bg-primary)] to-[var(--accent-secondary)]/20 animate-gradient" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_50%)]" />

                <div className="relative z-10 flex flex-col items-center p-16 text-center animate-in fade-in zoom-in duration-1000">
                    {/* Animated Logo Container */}
                    <div className="mb-16 relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,var(--accent-primary)_0%,transparent_70%)] opacity-20 rounded-full animate-pulse" />
                        <div className="relative p-12 rounded-[40px] bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-[0_0_100px_rgba(139,92,246,0.3)]">
                            <Store size={120} className="text-[var(--accent-primary)] drop-shadow-2xl" strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Welcome Text */}
                    <div className="mb-8">
                        <h1 className="text-8xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent-primary)] to-[var(--text-primary)] animate-gradient">
                            Welcome to M
                        </h1>
                        <div className="flex items-center justify-center gap-3 text-4xl text-[var(--text-secondary)] font-light tracking-[0.3em] uppercase">
                            <Sparkles size={32} className="text-[var(--accent-primary)] animate-pulse" />
                            <span>Premium Shopping</span>
                            <Sparkles size={32} className="text-[var(--accent-primary)] animate-pulse" />
                        </div>
                    </div>

                    {/* Time Display */}
                    <div className="mt-12 flex items-center gap-4 text-3xl font-mono text-[var(--accent-primary)] bg-black/50 px-10 py-5 rounded-[28px] border border-white/10 shadow-2xl">
                        <Clock size={32} className="animate-pulse" />
                        <span className="font-black tracking-wider">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* Decorative Bottom Gradient */}
                <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/50 to-transparent" />
            </div>
        );
    }

    // Active Cart Screen
    return (
        <div className="flex h-screen bg-primary text-[var(--text-primary)] overflow-hidden font-sans">
            {/* Left Side: Cart Items */}
            <div className="flex-1 flex flex-col bg-[var(--bg-secondary)] relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />

                {/* Header */}
                <header className="relative px-10 py-8 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-primary)]">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl shadow-lg shadow-[var(--accent-primary)]/30">
                            <ShoppingCart size={32} className="text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
                                {t('checkout.current_order')}
                            </h1>
                            <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">
                                {cart.length} {cart.length === 1 ? 'item' : 'items'} in cart
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3 bg-[var(--accent-primary)]/10 rounded-2xl border border-[var(--accent-primary)]/20">
                        <Clock size={24} className="text-[var(--accent-primary)]" />
                        <span className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </header>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-10 space-y-4 scrollbar-hide">
                    {cart.map((item: any, index: number) => (
                        <div
                            key={`${item.id}-${index}`}
                            className="group p-6 bg-gradient-to-r from-[var(--glass-bg)] to-transparent hover:from-white/15 hover:to-white/5 border border-[var(--glass-border)] hover:border-[var(--accent-primary)]/40 rounded-[28px] flex items-center gap-6 transition-all duration-300 animate-in slide-in-from-left-4 fade-in fill-mode-backwards shadow-lg hover:shadow-2xl hover:shadow-[var(--accent-primary)]/10"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Product Image/Icon */}
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 flex items-center justify-center flex-shrink-0 border border-[var(--accent-primary)]/20">
                                <Package size={40} className="text-[var(--accent-primary)]" strokeWidth={1.5} />
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 flex flex-col gap-2">
                                <span className="text-2xl font-black text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors leading-tight">
                                    {item.nameTH || item.name}
                                </span>
                                <div className="flex items-center gap-4 text-base text-[var(--text-secondary)]">
                                    <span className="bg-[var(--accent-primary)]/20 px-4 py-1.5 rounded-xl text-[var(--accent-primary)] font-bold border border-[var(--accent-primary)]/30">
                                        x{item.quantity}
                                    </span>
                                    <span className="font-medium">@ ฿{item.price.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Item Total */}
                            <span className="text-4xl font-black text-[var(--text-primary)] tracking-tight">
                                ฿{(item.price * item.quantity).toLocaleString()}
                            </span>
                        </div>
                    ))}
                    <div className="h-6" /> {/* Spacer */}
                </div>
            </div>

            {/* Right Side: Totals & Summary */}
            <aside className="w-[500px] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] flex flex-col relative z-20 shadow-2xl border-l border-[var(--border-color)]">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-[radial-gradient(circle,var(--accent-primary)_0%,transparent_60%)] opacity-15 rounded-full pointer-events-none" />

                <div className="flex-1 p-12 flex flex-col justify-end">
                    {/* Summary Lines */}
                    <div className="space-y-6 mb-10">
                        <div className="flex justify-between items-end text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-5">
                            <span className="text-xl font-bold uppercase tracking-wider">{t('checkout.subtotal')}</span>
                            <span className="text-3xl font-mono font-black text-[var(--text-primary)]">
                                ฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between items-end text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-5">
                            <span className="text-xl font-bold uppercase tracking-wider">{t('checkout.vat')} (7%)</span>
                            <span className="text-3xl font-mono font-black text-[var(--text-primary)]">
                                ฿{vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Grand Total */}
                    <div className="relative bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-[40px] p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] transform transition-all hover:scale-[1.02] border-2 border-white/20">
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative">
                            <div className="text-white/90 text-sm font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                                <Sparkles size={16} />
                                {t('checkout.total_amount')}
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl text-white font-black">฿</span>
                                <span className="text-8xl font-black text-white tracking-tighter leading-none">
                                    {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Message */}
                    <div className="mt-16 flex flex-col items-center gap-4 text-[var(--accent-primary)]">
                        <div className="flex items-center gap-3">
                            <Heart size={24} className="animate-pulse fill-current" />
                            <span className="text-lg font-black tracking-wider uppercase">Thank you for shopping</span>
                            <Heart size={24} className="animate-pulse fill-current" />
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] font-medium">
                            We appreciate your business
                        </p>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default CustomerDisplay;
