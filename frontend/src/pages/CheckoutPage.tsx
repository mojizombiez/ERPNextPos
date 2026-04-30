import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, CreditCard, ChevronRight, ShoppingCart, ListChecks, PlusCircle, X, Printer, Search, Wallet, Banknote, Smartphone, History, RotateCcw, Check, UserPlus, Users, Ticket, Star, Tag } from 'lucide-react';
import HelpTooltip from '../components/HelpTooltip';
import { useModal } from '../context/ModalContext';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import NumericKeypad from '../components/NumericKeypad';
import { useManagerAuth } from '../hooks/useManagerAuth';
import DiscountModal from '../components/DiscountModal';

const CheckoutPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { showModal, hideModal } = useModal();
    const {
        sessions,
        activeSession,
        activeSessionId,
        setActiveSession,
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
    } = useCart();
    const { checkManager, ManagerAuthModal } = useManagerAuth();

    const cart = activeSession?.cart || [];
    const cashReceived = activeSession?.cashReceived || '';
    const payments = activeSession?.payments || [];

    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanBuffer, setScanBuffer] = useState('');
    const [keyTimes, setKeyTimes] = useState<number[]>([]);
    const [processing, setProcessing] = useState(false);
    const [allowedPaymentMethods, setAllowedPaymentMethods] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [couponInput, setCouponInput] = useState('');
    const [redeemInput, setRedeemInput] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [creditInfo, setCreditInfo] = useState<{ limit: number; outstanding: number } | null>(null);

    const loadData = async () => {
        try {
            const productsResult = await window.go.main.App.LoadProducts();
            setProducts(productsResult || []);

            // @ts-ignore
            const customersResult = await window.go.main.App.GetCustomers();
            setAllCustomers(customersResult || []);

            // Load allowed payment methods from new model
            let parsedPayments = await window.go.main.App.GetPaymentMethods();
            
            // Fallback to old cache logic if no new payment methods are defined
            if (!parsedPayments || parsedPayments.length === 0) {
                const cachedPayments = await window.go.main.App.GetSetting('Cached_PosProfilePayments');
                if (cachedPayments) {
                    try {
                        const temp = JSON.parse(cachedPayments);
                        parsedPayments = temp.map((m: any) => ({ name: m.mode_of_payment, type: 'other', isActive: true, qrTemplate: '' }));
                    } catch (e) {
                        console.error("Failed to parse cached POS Profile payments", e);
                    }
                }

                if (!parsedPayments || parsedPayments.length === 0) {
                    const globalModes = await window.go.main.App.GetSetting('Cached_ModeOfPayments');
                    if (globalModes) {
                        try {
                            const parsedGlobal = JSON.parse(globalModes);
                            parsedPayments = parsedGlobal.map((m: any) => ({
                                name: m.name,
                                type: 'other',
                                isActive: true,
                                qrTemplate: ''
                            }));
                        } catch (e) {
                            console.error("Failed to parse global modes", e);
                        }
                    }
                }
            }

            // Filter only active methods
            const activeMethods = (parsedPayments || []).filter((m: any) => m.isActive !== false);
            setAllowedPaymentMethods(activeMethods);

        } catch (err) {
            console.error("Failed to load checkout data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const fetchBalance = async () => {
            if (activeSession?.customerName) {
                try {
                    // @ts-ignore
                    const result = await window.go.main.App.GetCustomerBalance(activeSession.customerName);
                    // result comes as [limit, outstanding] from Go
                    if (Array.isArray(result)) {
                        setCreditInfo({ limit: result[0], outstanding: result[1] });
                    }
                } catch (err) {
                    console.error("Failed to fetch customer balance", err);
                    setCreditInfo(null);
                }
            } else {
                setCreditInfo(null);
            }
        };
        fetchBalance();
    }, [activeSession?.customerName]);

    // Generate categories dynamically from products
    useEffect(() => {
        if (products && products.length > 0) {
            const groupNames = Array.from(new Set(products.map((p: any) => p.itemGroup).filter((g: any) => typeof g === 'string' && g.trim() !== '')));
            const cats: any[] = groupNames.map((name) => ({ id: name, name }));

            // Add "Sold Out" category if any item is disabled
            const hasSoldOut = products.some((p: any) => p.isAvailable === false);
            if (hasSoldOut) {
                cats.push({ id: 'SOLD_OUT', name: t('checkout.sold_out', { defaultValue: 'Sold Out' }) });
            }

            setCategories(cats);

            // Fallback if current category disappeared (e.g. last sold out item made available)
            if (selectedCategory === 'SOLD_OUT' && !hasSoldOut) {
                setSelectedCategory(cats.length > 0 ? cats[0].id : null);
            } else if (selectedCategory === null && cats.length > 0) {
                setSelectedCategory(cats[0].id);
            }
        } else {
            setCategories([]);
            setSelectedCategory(null);
        }
    }, [products, t]);

    useEffect(() => {
        const handleGlobalKey = (e: KeyboardEvent) => {
            // Ignore if the user is typing in the "Cash Received" input
            if (document.activeElement?.tagName === 'INPUT' && (document.activeElement as HTMLInputElement).type !== 'checkbox') {
                // But wait, if it's super fast, it might still be a scanner!
                // Usually scanners don't focus elements, they just dump data.
                // However, if the user IS focused on the cash input, we should probably ignore global scan unless we are sure.
                if (!scanBuffer && e.key === 'Enter') return;
            }

            const now = performance.now();

            if (e.key === 'Enter') {
                if (scanBuffer.length > 2) {
                    // Check timing
                    const intervals = [];
                    for (let i = 1; i < keyTimes.length; i++) {
                        intervals.push(keyTimes[i] - keyTimes[i - 1]);
                    }
                    const avgSpeed = intervals.length > 0 ? intervals.reduce((a, b) => a + b) / intervals.length : 100;

                    if (avgSpeed < 50) { // Confirmed scanner
                        e.preventDefault();
                        processBarcode(scanBuffer);
                    }
                }
                setScanBuffer('');
                setKeyTimes([]);
            } else if (e.key.length === 1) {
                setScanBuffer(prev => prev + e.key);
                setKeyTimes(prev => [...prev, now]);
            }
        };

        window.addEventListener('keydown', handleGlobalKey);
        return () => window.removeEventListener('keydown', handleGlobalKey);
    }, [scanBuffer, keyTimes, products]);

    const processBarcode = (code: string) => {
        const product = products.find(p => p.barcode === code || p.itemCode === code);
        if (product) {
            addToCart(product);
        } else {
            showModal({
                title: t('checkout.product_not_found'),
                message: t('checkout.product_not_found_msg', { code }),
                type: 'confirm',
                onConfirm: () => navigate('/stock', { state: { newBarcode: code } })
            });
        }
    };

    useEffect(() => {
        if (selectedCategory !== null) {
            let filtered = [];
            if (selectedCategory === 'SOLD_OUT') {
                filtered = products.filter(p => p.isAvailable === false);
            } else {
                filtered = products.filter(p => p.itemGroup === selectedCategory && p.isAvailable !== false);
            }

            if (searchTerm.trim() !== '') {
                const term = searchTerm.toLowerCase().trim();
                filtered = filtered.filter(p =>
                    (p.itemCode && p.itemCode.toLowerCase().includes(term)) ||
                    (p.nameTH && p.nameTH.toLowerCase().includes(term))
                );
            }

            setFilteredProducts(filtered);
        }
    }, [selectedCategory, products, searchTerm]);

    const addToCart = (product: any) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            updateCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            updateCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const updateQuantity = (id: number, delta: number) => {
        updateCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const toggleProductAvailability = async (product: any) => {
        const newStatus = product.isAvailable === false ? true : false;
        try {
            await (window.go.main.App as any).UpdateProductAvailability(product.itemCode, newStatus);
            // Locally update the products list
            const updatedProducts = products.map(p =>
                p.itemCode === product.itemCode ? { ...p, isAvailable: newStatus } : p
            );
            setProducts(updatedProducts);
        } catch (err) {
            console.error("Failed to update availability", err);
            showModal({ title: t('common.error'), message: 'Failed to update availability: ' + err, type: 'error' });
        }
    };

    const removeFromCart = (id: number) => {
        checkManager(() => {
            updateCart(cart.filter(item => item.id !== id));
        });
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = subtotal * 0.00; // placeholder for actual VAT logic
    const baseTotal = subtotal + vat;
    const couponDiscount = activeSession?.couponDiscount || 0;
    const loyaltyDiscount = activeSession?.redeemedAmount || 0;
    const manualDiscount = activeSession?.manualDiscount || 0;
    const discountAmount = couponDiscount + loyaltyDiscount + manualDiscount;
    const total = Math.max(0, baseTotal - discountAmount);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = Math.max(0, total - totalPaid);
    const change = Math.max(0, totalPaid - total);

    const openNumpad = () => {
        showModal({
            title: t('checkout.applied_payments'),
            message: (
                <NumericKeypad
                    totalAmount={total}
                    remainingAmount={remainingAmount}
                    allowedMethods={allowedPaymentMethods}
                    onQrUpdate={(qr, amount) => updateQrCode(qr, amount)}
                    onApply={(method, amount, reference) => {
                        updatePayments([...payments, { method, amount, reference }]);
                        hideModal();
                    }}
                    onClose={() => hideModal()}
                />
            ),
            type: 'info',
            hideFooter: true,
            maxWidthClass: 'max-w-[640px]',
            compactMode: true
        });
    };

    const openDiscountModal = () => {
        checkManager(() => {
            showModal({
                title: 'Manual Discount',
                message: (
                    <DiscountModal
                        subtotal={baseTotal}
                        initialAmount={manualDiscount}
                        initialReason={activeSession?.discountReason}
                        onApply={(amount, reason) => applyManualDiscount(amount, reason)}
                        onClose={() => hideModal()}
                    />
                ),
                type: 'info',
                hideFooter: true,
                maxWidthClass: 'max-w-[440px]',
                compactMode: true
            });
        });
    };

    const openCustomerModal = () => {
        setIsCustomerModalOpen(true);
    };

    const handleApplyRedemption = () => {
        const points = parseInt(redeemInput);
        if (isNaN(points) || points <= 0) return;

        const maxAvailable = activeSession?.customerPoints || 0;
        if (points > maxAvailable) {
            showModal({ title: t('common.error'), message: 'Not enough points.', type: 'error' });
            return;
        }

        const amount = points * 1.0; // 1 point = 1 THB (default conversion)
        if (amount > baseTotal - couponDiscount) {
            showModal({ title: t('common.error'), message: 'Redemption cannot exceed total balance.', type: 'error' });
            return;
        }

        updateRedemption(points, amount);
        setRedeemInput('');
        showModal({ title: t('common.success'), message: `Redeemed ${points} points for ฿${amount}`, type: 'success' });
    };

    const handleApplyCoupon = async () => {
        if (!couponInput) return;
        setIsApplyingCoupon(true);
        try {
            // @ts-ignore
            const coupon = await window.go.main.App.ValidateCouponCode(couponInput);
            let discount = 0;
            if (coupon.discount_percentage) {
                discount = (subtotal * coupon.discount_percentage) / 100;
            } else if (coupon.discount_amount) {
                discount = coupon.discount_amount;
            }
            applyCoupon(couponInput, discount);
            setCouponInput('');
            showModal({ title: t('common.success'), message: `Coupon ${couponInput} applied: ฿${discount}`, type: 'success' });
        } catch (err) {
            showModal({ title: t('common.error'), message: '' + err, type: 'error' });
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const CustomerSelectorModal = () => {
        const [custSearch, setCustSearch] = useState('');
        const [newName, setNewName] = useState('');
        const [newPhone, setNewPhone] = useState('');
        const [isCreating, setIsCreating] = useState(false);

        const filteredCustomers = allCustomers.filter(c =>
            (c.customer_name?.toLowerCase().includes(custSearch.toLowerCase())) ||
            (c.mobile_no?.includes(custSearch))
        ).slice(0, 5);

        const handleSelect = (c: any) => {
            updateCustomer(c.customer_name, c.mobile_no, c.loyalty_points);
            setIsCustomerModalOpen(false);
        };

        const handleQuickCreate = async () => {
            if (!newName) return;
            setIsCreating(true);
            try {
                // @ts-ignore
                await window.go.main.App.CreateCustomerQuick(newName, newPhone);
                updateCustomer(newName, newPhone);
                // Refresh customer list
                // @ts-ignore
                const fresh = await window.go.main.App.GetCustomers();
                setAllCustomers(fresh || []);
                setIsCustomerModalOpen(false);
                showModal({ title: t('common.success'), message: `Customer ${newName} created!`, type: 'success' });
            } catch (err) {
                showModal({ title: t('common.error'), message: '' + err, type: 'error' });
            } finally {
                setIsCreating(false);
            }
        };

        return (
            <div className="flex flex-col gap-6 p-2">
                {/* Search & Select */}
                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('checkout.search_existing')}</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            autoFocus
                            className="w-full pl-14 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-800 outline-none focus:border-slate-900 focus:bg-white focus:shadow-sm transition-all placeholder:text-slate-300"
                            placeholder="Name or Phone..."
                            value={custSearch}
                            onChange={(e) => setCustSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                        {filteredCustomers.map(c => (
                            <button
                                key={c.id}
                                onClick={() => handleSelect(c)}
                                className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 hover:shadow-premium-sm transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                        <Users size={18} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-slate-800 group-hover:text-blue-900 transition-colors">{c.customer_name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                            {c.mobile_no || 'No Phone'}
                                            {c.loyalty_points > 0 && <span className="ml-2 text-blue-600 font-black">| {c.loyalty_points} แต้ม</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <ChevronRight size={18} strokeWidth={3} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Quick Add Form */}
                <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">{t('checkout.create_new')}</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('checkout.customer_name')}</span>
                            <input
                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                                placeholder="Customer Name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('checkout.customer_phone')}</span>
                            <input
                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                                placeholder="08xxxxxxxx"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleQuickCreate}
                        disabled={!newName || isCreating}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-2 ${!newName || isCreating ? 'bg-slate-100 text-slate-300' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-premium'}`}
                    >
                        {isCreating ? <RotateCcw className="animate-spin" size={16} /> : <UserPlus size={16} />}
                        {isCreating ? t('common.processing') : t('checkout.register_select')}
                    </button>
                    <button
                        onClick={() => {
                            updateCustomer('', '');
                            setIsCustomerModalOpen(false);
                        }}
                        className="py-3.5 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-red-50 hover:text-[#ef4444] transition-all border border-transparent hover:border-red-100 flex items-center justify-center gap-2"
                    >
                        <X size={14} strokeWidth={3} />
                        {t('checkout.clear_selection')}
                    </button>
                </div>
            </div>
        );
    };

    const handlePrintKitchen = async () => {
        try {
            const orderData = {
                runningNumber: activeSessionId,
                subOrder: [{
                    detail: cart.flatMap(i => {
                        if (i.isBundle && i.bundleItems && i.bundleItems.length > 0) {
                            return [
                                { productName: `[BUNDLE] ${i.nameTH}`, quantity: i.quantity },
                                ...i.bundleItems.map((bi: any) => ({
                                    productName: ` - ${bi.item_name || bi.item_code}`,
                                    quantity: bi.qty * i.quantity
                                }))
                            ];
                        }
                        return [{ productName: i.nameTH, quantity: i.quantity }];
                    })
                }],
                orderDate: new Date()
            };

            await window.go.main.App.PrintKitchenBill(orderData);
        } catch (err) {
            console.error("Kitchen print failed", err);
        }
    };

    const checkLiveStock = async (product: any, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            // @ts-ignore
            const stock = await window.go.main.App.GetStockLevel(product.itemCode);
            setProducts(prev => prev.map(p =>
                p.itemCode === product.itemCode ? { ...p, remain: stock } : p
            ));
            return stock;
        } catch (err) {
            console.error("Failed to check live stock", err);
            return product.remain;
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (totalPaid < total) {
            showModal({
                title: t('checkout.insufficient_cash', { defaultValue: 'Insufficient Payment' }),
                message: t('checkout.insufficient_cash_msg', { defaultValue: 'The total paid is less than the total amount due.' }),
                type: 'warning'
            });
            return;
        }

        setProcessing(true);
        try {
            // Live Stock Validation
            const stockErrors: any[] = [];
            for (const item of cart) {
                // @ts-ignore
                const liveStock = await window.go.main.App.GetStockLevel(item.itemCode);
                if (liveStock < item.quantity) {
                    stockErrors.push({ name: item.nameTH, requested: item.quantity, available: liveStock });
                }
            }

            if (stockErrors.length > 0) {
                showModal({
                    title: t('checkout.insufficient_stock', { defaultValue: 'Insufficient Stock' }),
                    message: (
                        <div className="flex flex-col gap-2">
                            <p>{t('checkout.insufficient_stock_msg', { defaultValue: 'Some items in your cart are no longer available in the requested quantity:' })}</p>
                            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex flex-col gap-2 mt-2">
                                {stockErrors.map((err, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-rose-700">
                                        <span className="font-bold">{err.name}</span>
                                        <span className="text-xs">{err.available} available (requested {err.requested})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ),
                    type: 'error'
                });
                setProcessing(false);
                return;
            }

            // Check for open drawer first
            // @ts-ignore
            const currentDrawer = await window.go.main.App.GetCurrentDrawer();
            if (!currentDrawer) {
                showModal({
                    title: t('drawer.required_title', { defaultValue: 'Drawer Required' }),
                    message: t('drawer.required_msg', { defaultValue: 'Please open a cash drawer session before checking out.' }),
                    type: 'warning',
                    confirmText: t('drawer.open_drawer', { defaultValue: 'Go to Drawer' }),
                    onConfirm: () => navigate('/drawer')
                });
                setProcessing(false);
                return;
            }

            const warehouse = await window.go.main.App.GetSetting('Warehouse');
            const company = await window.go.main.App.GetSetting('Company');
            const orderData = {
                runningNumber: activeSessionId,
                orderDate: new Date(),
                discountPrice: discountAmount,
                deliveryPrice: 0,
                orderPrice: subtotal,
                vatPrice: vat,
                totalPrice: total,
                customerPaid: totalPaid,
                referenceNo: activeSession?.customerName || '',
                couponCode: activeSession?.couponCode || '',
                redeemedPoints: activeSession?.redeemedPoints || 0,
                redeemedAmount: activeSession?.redeemedAmount || 0,
                payments: payments, // Send the full list
                warehouse: warehouse,
                company: company,
                subOrder: [
                    {
                        detail: cart.map(item => ({
                            productId: item.id,
                            productName: item.nameTH,
                            itemCode: item.itemCode || item.nameTH,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                ]
            };

            // @ts-ignore
            const orderUUID = await window.go.main.App.AddOrder(orderData as any);
            clearActiveCart();
            navigate('/final', { state: { order: orderData, change, orderUUID } });
        } catch (err) {
            showModal({
                title: t('checkout.error', { defaultValue: 'Checkout Error' }),
                message: t('checkout.error_msg', { defaultValue: 'There was an error processing the checkout: ' }) + err,
                type: 'error'
            });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-10 text-center">{t('common.loading')}</div>;

    return (
        <div className="checkout-container h-full overflow-hidden">
            {/* Main Product Area */}
            <div className="product-grid-main h-full">
                <div className="product-grid-header" style={{ padding: '16px 40px', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between w-full gap-8">
                        <div className="flex flex-col gap-0.5 min-w-[200px]">
                            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('checkout.menu')}</h1>
                            <span className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{t('checkout.discover_cuisine')}</span>
                        </div>

                        {/* Integrated Search Bar */}
                        <div className="flex-1 max-w-2xl relative group">
                            <div className="flex items-center gap-4 glass p-4 rounded-full border border-[var(--border-color)] transition-all focus-within:ring-2 focus-within:ring-slate-100/50">
                                <Search size={22} className="text-slate-400 opacity-60 group-focus-within:opacity-100 transition-opacity ml-1" />
                                <input
                                    type="text"
                                    placeholder={t('checkout.search_placeholder', { defaultValue: 'Search by name or code...' })}
                                    className="w-full bg-transparent border-none outline-none text-lg font-bold text-slate-800 placeholder:text-slate-400 placeholder:opacity-50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="text-slate-300 hover:text-slate-500 transition-colors mr-1"
                                    >
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Items</div>
                                <div className="text-lg font-black text-slate-900 tracking-tighter leading-none">{filteredProducts.length}</div>
                            </div>
                            <HelpTooltip titleKey="help.checkout_products.title" contentKey="help.checkout_products.content" size={18} />
                        </div>
                    </div>
                </div>

                {/* Horizontal Category Pill Bar */}
                <div className="category-bar-wrapper">
                    <div className="category-bar custom-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="product-grid-content custom-scrollbar">
                    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
                        {filteredProducts.map(product => {
                            const isAvailable = product.isAvailable !== false;
                            return (
                                <div
                                    key={product.id}
                                    className={`product-card shadow-premium compact ${!isAvailable ? 'opacity-50 grayscale' : ''}`}
                                    onClick={() => isAvailable && addToCart(product)}
                                >
                                    <div className="product-image-wrap">
                                        {product.localImagePath ? (
                                            <img
                                                src={`/images/${product.localImagePath.split(/[\\/]/).pop()}`}
                                                alt={product.nameTH}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9InN0ZWVsdmx1ZSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cG9seWdvbiBwb2ludHM9IjIxIDE1IDE2IDEwIDUgMjEgMjEgMjEiLz48L3N2Zz4=';
                                                }}
                                            />
                                        ) : (
                                            <div className="text-4xl opacity-30">☕</div>
                                        )}
                                        {!isAvailable && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <span className="bg-white text-slate-900 px-3 py-1 rounded-full font-black text-sm uppercase tracking-[0.1em] shadow-lg">SOLD OUT</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-1 flex flex-col gap-1 mt-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest truncate">{product.itemCode}</div>
                                            {product.isBundle && (
                                                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-widest">BUNDLE</span>
                                            )}
                                        </div>
                                        <div className="font-black text-slate-900 text-base line-clamp-2 min-h-[1.5rem] tracking-tight leading-tight">{product.nameTH}</div>

                                        {/* Stock badge */}
                                        {product.remain !== undefined && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-widest w-fit ${product.remain <= 0
                                                    ? 'bg-red-100 text-red-500'
                                                    : product.remain <= 5
                                                        ? 'bg-amber-100 text-amber-600'
                                                        : 'bg-emerald-50 text-emerald-600'
                                                    }`}>
                                                    <span className={`w-2 h-2 rounded-full ${product.remain <= 0 ? 'bg-red-400' : product.remain <= 5 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                                    {product.remain <= 0 ? t('checkout.out_of_stock') : `${t('checkout.stock_remaining')} ${product.remain}`}
                                                </div>
                                                <button
                                                    onClick={(e) => checkLiveStock(product, e)}
                                                    className="btn-stock-refresh"
                                                    title="Live Check"
                                                >
                                                    <RotateCcw size={12} strokeWidth={3} />
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center mt-2">
                                            <div className="text-base font-black text-slate-900 tracking-tight">
                                                ฿{product.price ? product.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleProductAvailability(product);
                                                }}
                                                className={`btn-product-action-s ${!isAvailable ? 'active' : ''}`}
                                            >
                                                {isAvailable ? <X size={12} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. Order Sidebar (Premium White Tray) */}
            <div className="order-tray-wrapper">
                <div className="order-tray-card">
                    <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-md">
                                <ShoppingCart size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-slate-900 tracking-tight">
                                    {t('checkout.order')} {activeSessionId}
                                </h3>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-0.5">
                                    {cart.length} {t('checkout.items_selected')}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <HelpTooltip titleKey="help.checkout_cart.title" contentKey="help.checkout_cart.content" size={14} />
                            <button
                                onClick={() => updateCart([])}
                                className="w-11 h-11 flex items-center justify-center bg-slate-50 hover:bg-red-500 hover:text-white text-slate-400 rounded-xl transition-all border border-slate-100"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>

                    {/* PRIORITY: Cart Items List moved UP */}
                    <div className="order-item-list custom-scrollbar flex-1 py-1 bg-slate-50/50 border-b border-slate-100">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-100 gap-6">
                                <ShoppingCart size={80} strokeWidth={1} />
                                <p className="font-black uppercase tracking-[0.3em] text-sm text-slate-300">{t('checkout.tray_empty')}</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="order-item-card !px-3 !py-2 !gap-3">
                                    <div className="order-qty-control !p-1 !gap-1">
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="order-qty-btn-s !w-7 !h-7"
                                        >
                                            <Plus size={10} strokeWidth={3} />
                                        </button>
                                        <span className="text-xs font-black text-slate-900 leading-none py-1 text-center w-6">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="order-qty-btn-s !w-7 !h-7"
                                        >
                                            <Minus size={10} strokeWidth={3} />
                                        </button>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <span className="font-black text-slate-900 block text-sm tracking-tight line-clamp-1">{item.nameTH}</span>
                                        <span className="text-[10px] font-black text-slate-400 block mt-0.5 uppercase tracking-widest">฿{item.price.toLocaleString()} EA</span>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="font-black text-slate-900 text-base tracking-tighter block">
                                            ฿{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                        <button
                                            onClick={() => updateCart(cart.filter(c => c.id !== item.id))}
                                            className="text-slate-200 hover:text-[#ef4444] transition-all ml-auto mt-0.5"
                                        >
                                            <Trash2 size={12} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* COMPACT: Controls moved DOWN */}
                    <div className="pt-2 pb-1 border-b border-slate-100 bg-white">

                        <div
                            onClick={openCustomerModal}
                            className="mx-4 mb-1 p-2 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer group"
                        >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeSession?.customerName ? 'bg-blue-600 text-white shadow-blue-premium' : 'bg-slate-50 text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                                <UserPlus size={16} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="pos-label mb-1">{t('checkout.customer_label')}</p>
                                <h4 className={`font-black tracking-tight truncate ${activeSession?.customerName ? 'text-slate-900 text-lg' : 'text-slate-400 group-hover:text-blue-600 text-base'}`}>
                                    {activeSession?.customerName ? activeSession.customerName : t('checkout.customer_placeholder')}
                                </h4>
                                {activeSession?.customerName && activeSession?.customerPoints !== undefined && (
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">
                                        {activeSession.customerPoints} แต้ม (Points)
                                    </p>
                                )}
                                {activeSession?.customerName && creditInfo && creditInfo.limit > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Credit Limit</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${creditInfo.outstanding + total > creditInfo.limit ? 'text-red-500' : 'text-slate-600'}`}>
                                                ฿{(creditInfo.outstanding + total).toLocaleString()} / ฿{creditInfo.limit.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${creditInfo.outstanding + total > creditInfo.limit ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min(100, ((creditInfo.outstanding + total) / creditInfo.limit) * 100)}%` }}
                                            />
                                        </div>
                                        {creditInfo.outstanding + total > creditInfo.limit && (
                                            <p className="text-[9px] font-black text-red-500 uppercase tracking-tighter mt-1 animate-pulse">
                                                ⚠️ {t('checkout.credit_exceeded', { defaultValue: 'Credit Limit Exceeded' })}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            {activeSession?.customerName && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateCustomer('', '');
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-[#ef4444] transition-all"
                                >
                                    <X size={14} strokeWidth={3} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Loyalty Points Redemption Row */}
                    {activeSession?.customerName && activeSession?.customerPoints !== undefined && activeSession.customerPoints > 0 && (
                        <div className="mx-4 mb-1 p-2 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeSession?.redeemedPoints ? 'bg-blue-600 text-white shadow-blue-premium' : 'bg-white text-blue-300'}`}>
                                <Star size={14} strokeWidth={2.5} />
                            </div>
                            {activeSession?.redeemedPoints ? (
                                <div className="flex-1 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">Redeemed</p>
                                        <h4 className="font-black text-blue-900 tracking-tight text-xs uppercase">{activeSession.redeemedPoints} Pts</h4>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black text-blue-600">-฿{activeSession.redeemedAmount?.toLocaleString()}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateRedemption(0, 0);
                                            }}
                                            className="text-blue-300 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex gap-2">
                                    <input
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-black text-blue-600 placeholder:text-blue-300"
                                        placeholder={t('checkout.redeem_points')}
                                        type="number"
                                        value={redeemInput}
                                        onChange={(e) => setRedeemInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleApplyRedemption()}
                                    />
                                    <button
                                        onClick={handleApplyRedemption}
                                        disabled={!redeemInput}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!redeemInput ? 'text-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
                                    >
                                        {t('checkout.apply')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                        {/* Coupon / Discount Code Row */}
                        <div className="mx-4 mb-1 p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeSession?.couponCode ? 'bg-orange-500 text-white shadow-orange-premium' : 'bg-white text-slate-300'}`}>
                            <Ticket size={14} strokeWidth={2.5} />
                        </div>
                        {activeSession?.couponCode ? (
                            <div className="flex-1 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Promo Applied</p>
                                    <h4 className="font-black text-slate-900 tracking-tight text-xs uppercase">{activeSession.couponCode}</h4>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-black text-orange-500">-฿{activeSession.couponDiscount?.toLocaleString()}</span>
                                    <button onClick={removeCoupon} className="text-slate-300 hover:text-red-500 transition-colors">
                                        <X size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex gap-2">
                                <input
                                    className="flex-1 bg-transparent border-none outline-none text-sm font-black text-slate-700 placeholder:text-slate-400"
                                    placeholder="COUPON CODE"
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    disabled={!couponInput || isApplyingCoupon}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!couponInput || isApplyingCoupon ? 'text-slate-300' : 'bg-slate-900 text-white hover:bg-black active:scale-95'}`}
                                >
                                    {isApplyingCoupon ? '...' : t('checkout.apply')}
                                </button>
                            </div>
                        )}
                    </div>

                        {/* Manual Discount Row */}
                        <div className="mx-4 mb-1 p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeSession?.manualDiscount ? 'bg-red-500 text-white shadow-red-premium' : 'bg-white text-slate-300'}`}>
                                <Tag size={14} strokeWidth={2.5} />
                            </div>
                            {activeSession?.manualDiscount ? (
                                <div className="flex-1 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">{t('discount_modal.title')}</p>
                                        <h4 className="font-black text-slate-900 tracking-tight text-xs uppercase truncate">{activeSession.discountReason || t('discount_modal.reasons.other')}</h4>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black text-red-500">-฿{activeSession.manualDiscount?.toLocaleString()}</span>
                                        <button onClick={removeManualDiscount} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex justify-between items-center">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('discount_modal.title')}</span>
                                    <button
                                        onClick={openDiscountModal}
                                        className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black active:scale-95 transition-all"
                                    >
                                        {t('checkout.modify')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="checkout-footer bg-white border-t border-slate-100">
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">{t('checkout.total_due')}</span>
                                <div className="flex flex-col items-end">
                                    {discountAmount > 0 && (
                                        <span className="text-sm font-black text-orange-500 uppercase tracking-widest mb-1">
                                            {t('checkout.discount_applied')} {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    )}
                                    <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                        ฿{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            {/* Applied Payments List (Restored) */}
                            {payments.length > 0 && (
                                <div className="flex flex-col gap-1.5 pt-2 items-stretch">
                                    {payments.map((p, idx) => (
                                        <div key={idx} className="applied-payment-chip-s justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black uppercase text-slate-400 tracking-widest">{p.method}</span>
                                                <span className="text-sm font-black text-slate-900">฿{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <button
                                                onClick={() => updatePayments(payments.filter((_, i) => i !== idx))}
                                                className="text-[#ef4444] hover:opacity-100 opacity-40"
                                            >
                                                <X size={10} strokeWidth={3} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${remainingAmount > 0 ? 'bg-white border-slate-100 hover:border-slate-300' : 'bg-emerald-50 border-emerald-100 shadow-none'}`}
                                onClick={openNumpad}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${remainingAmount > 0 ? 'bg-[#ef4444] text-white shadow-lg shadow-red-500/20' : 'bg-emerald-500 text-white'}`}>
                                    <PlusCircle size={22} />
                                </div>
                                <div className="flex-1 flex items-center justify-between">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block leading-tight mb-1">
                                            {remainingAmount > 0 ? t('checkout.remaining') : t('checkout.settled')}
                                        </label>
                                        <div className={`font-black text-2xl tracking-tighter ${remainingAmount > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                                            ฿{remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <HelpTooltip titleKey="help.payment.title" contentKey="help.payment.content" size={16} />
                                </div>
                            </div>

                            <div className="relative group">
                                <button
                                    onClick={handleCheckout}
                                    disabled={total === 0 || processing || remainingAmount > 0}
                                    className={`w-full py-6 rounded-2xl font-black flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${total === 0 || processing || remainingAmount > 0
                                        ? 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed'
                                        : 'bg-slate-900 text-white hover:bg-[#ef4444] hover:shadow-red-premium active:scale-[0.98]'
                                        }`}
                                >
                                    <Check size={20} strokeWidth={4} />
                                    <span className="uppercase tracking-[0.25em] text-xs font-black">{t('checkout.submit_protocol')}</span>
                                </button>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <HelpTooltip titleKey="help.sessions.title" contentKey="help.sessions.content" size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Session Switcher (Premium Restored Style) */}
                <div className="session-switcher custom-scrollbar py-10">
                    {sessions.map(s => (
                        <div key={s.id} className="session-tab-wrapper">
                            <button
                                onClick={() => setActiveSession(s.id)}
                                className={`session-tab ${activeSessionId === s.id ? 'active' : ''}`}
                            >
                                <span className="session-number">{s.id}</span>
                                {s.cart.length > 0 && (
                                    <div className="badge">
                                        {s.cart.length}
                                    </div>
                                )}
                            </button>
                            {sessions.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        showModal({
                                            title: t('checkout.cancel_order'),
                                            message: t('checkout.cancel_order_msg', { name: t('checkout.order_session', { id: s.id }) }),
                                            type: 'confirm',
                                            onConfirm: () => removeSession(s.id),
                                            confirmText: "Cancel Order",
                                            cancelText: "Go Back"
                                        });
                                    }}
                                    className="session-remove-btn"
                                >
                                    <X size={12} strokeWidth={4} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        className="session-add-btn"
                        onClick={addSession}
                        title={t('checkout.add_order')}
                    >
                        <Plus size={24} strokeWidth={3} />
                    </button>
                </div>
            </div>
            <ManagerAuthModal />

            {/* Customer Modal Rendering */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-white/40">
                    <div className="w-full max-w-[480px] bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col scale-in">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-blue-premium">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('checkout.customer_title')}</h2>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">{t('checkout.customer_subtitle')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCustomerModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <CustomerSelectorModal />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPage;
