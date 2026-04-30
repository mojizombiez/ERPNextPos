import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    id: number;
    nameTH: string;
    price: number;
    quantity: number;
    categories?: { categoryId: number }[];
    barcode?: string;
    itemCode?: string;
    localImagePath?: string;
    remain?: number;
    itemGroup?: string;
    isBundle?: boolean;
    bundleItems?: any[];
}

export interface PaymentEntry {
    method: string;
    amount: number;
    account?: string;
    reference?: string;
}

export interface OrderSession {
    id: string;
    name: string;
    cart: CartItem[];
    cashReceived: string;
    payments: PaymentEntry[];
    customerName?: string;
    customerPhone?: string;
    customerPoints?: number;
    redeemedPoints?: number;
    redeemedAmount?: number;
    couponCode?: string;
    couponDiscount?: number;
    manualDiscount?: number;
    discountReason?: string;
    currentQrString?: string;
    currentQrAmount?: number;
}

interface CartContextType {
    sessions: OrderSession[];
    activeSessionId: string;
    activeSession: OrderSession | undefined;
    setActiveSession: (id: string) => void;
    addSession: () => void;
    removeSession: (id: string) => void;
    updateCart: (cart: CartItem[]) => void;
    updateCashReceived: (cash: string) => void;
    updatePayments: (payments: PaymentEntry[]) => void;
    updateCustomer: (name: string, phone: string, points?: number) => void;
    updateRedemption: (points: number, amount: number) => void;
    applyCoupon: (code: string, discount: number) => void;
    removeCoupon: () => void;
    applyManualDiscount: (amount: number, reason: string) => void;
    removeManualDiscount: () => void;
    updateQrCode: (qrString: string, amount: number) => void;
    clearActiveCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sessions, setSessions] = useState<OrderSession[]>(() => {
        const saved = localStorage.getItem('orderSessions');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse order sessions", e);
            }
        }
        return [{ id: '1', name: 'Order 1', cart: [], cashReceived: '', payments: [], customerName: '', customerPhone: '', customerPoints: 0, redeemedPoints: 0, redeemedAmount: 0, couponCode: '', couponDiscount: 0, manualDiscount: 0, discountReason: '', currentQrString: '', currentQrAmount: 0 }];
    });

    const [activeSessionId, setActiveSessionId] = useState<string>(() => {
        const saved = localStorage.getItem('activeSessionId');
        return saved || '1';
    });

    useEffect(() => {
        const data = JSON.stringify(sessions);
        localStorage.setItem('orderSessions', data);
        if ((window as any).runtime?.EventsEmit) {
            (window as any).runtime.EventsEmit('sync-sessions', data);
        }
    }, [sessions]);

    useEffect(() => {
        localStorage.setItem('activeSessionId', activeSessionId);
        if ((window as any).runtime?.EventsEmit) {
            (window as any).runtime.EventsEmit('sync-active-session', activeSessionId);
        }
    }, [activeSessionId]);

    // Cross-window synchronization for Customer Display
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'orderSessions' && e.newValue) {
                try {
                    const newSessions = JSON.parse(e.newValue);
                    setSessions(newSessions);
                } catch (err) {
                    console.error("Failed to sync order sessions", err);
                }
            }
            if (e.key === 'activeSessionId' && e.newValue) {
                setActiveSessionId(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Instant sync via Wails Events for low-performance PCs
        if ((window as any).runtime?.EventsOn) {
            (window as any).runtime.EventsOn('sync-sessions', (data: string) => {
                try {
                    setSessions(prev => {
                        if (JSON.stringify(prev) === data) return prev;
                        return JSON.parse(data);
                    });
                } catch (err) {
                    console.error("Failed to parse sync-sessions", err);
                }
            });
            (window as any).runtime.EventsOn('sync-active-session', (id: string) => {
                setActiveSessionId(prev => prev === id ? prev : id);
            });
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            if ((window as any).runtime?.EventsOff) {
                (window as any).runtime.EventsOff('sync-sessions');
                (window as any).runtime.EventsOff('sync-active-session');
            }
        };
    }, []);

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

    const addSession = () => {
        const newId = (Math.max(0, ...sessions.map(s => parseInt(s.id))) + 1).toString();
        const newSession: OrderSession = {
            id: newId,
            name: `Order ${newId}`,
            cart: [],
            cashReceived: '',
            payments: [],
            customerName: '',
            customerPhone: '',
            customerPoints: 0,
            redeemedPoints: 0,
            redeemedAmount: 0,
            couponCode: '',
            couponDiscount: 0,
            manualDiscount: 0,
            discountReason: '',
            currentQrString: '',
            currentQrAmount: 0
        };
        setSessions([...sessions, newSession]);
        setActiveSessionId(newId);
    };

    const removeSession = (id: string) => {
        if (sessions.length <= 1) return;
        const newSessions = sessions.filter(s => s.id !== id);
        setSessions(newSessions);
        if (activeSessionId === id) {
            setActiveSessionId(newSessions[0].id);
        }
    };

    const updateCart = (cart: CartItem[]) => {
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? { ...s, cart } : s
        ));
    };

    const updateCashReceived = (cash: string) => {
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? { ...s, cashReceived: cash } : s
        ));
    };

    const updatePayments = (payments: PaymentEntry[]) => {
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? { ...s, payments } : s
        ));
    };

    const updateCustomer = (name: string, phone: string, points: number = 0) => {
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? { ...s, customerName: name, customerPhone: phone, customerPoints: points, redeemedPoints: 0, redeemedAmount: 0 } : s
        ));
    };

    const updateRedemption = (points: number, amount: number) => {
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? { ...s, redeemedPoints: points, redeemedAmount: amount } : s
        ));
    };

    const applyCoupon = (code: string, discount: number) => {
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? { ...s, couponCode: code, couponDiscount: discount } : s
        ));
    };

    const removeCoupon = () => {
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? { ...s, couponCode: '', couponDiscount: 0 } : s
        ));
    };

    const applyManualDiscount = (amount: number, reason: string) => {
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? { ...s, manualDiscount: amount, discountReason: reason } : s
        ));
    };

    const removeManualDiscount = () => {
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? { ...s, manualDiscount: 0, discountReason: '' } : s
        ));
    };

    const updateQrCode = (qrString: string, amount: number) => {
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? { ...s, currentQrString: qrString, currentQrAmount: amount } : s
        ));
    };

    const clearActiveCart = () => {
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? { ...s, cart: [], cashReceived: '', payments: [], customerName: '', customerPhone: '', customerPoints: 0, redeemedPoints: 0, redeemedAmount: 0, couponCode: '', couponDiscount: 0, manualDiscount: 0, discountReason: '', currentQrString: '', currentQrAmount: 0 } : s
        ));
    };

    return (
        <CartContext.Provider value={{
            sessions,
            activeSessionId,
            activeSession,
            setActiveSession: setActiveSessionId,
            addSession,
            removeSession,
            updateCart,
            updateCashReceived,
            updatePayments,
            updateCustomer,
            updateRedemption,
            applyCoupon,
            removeCoupon,
            applyManualDiscount,
            removeManualDiscount,
            updateQrCode,
            clearActiveCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
