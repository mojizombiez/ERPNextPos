import { useState, useEffect } from 'react';
import { Package, Search, Plus, Edit2, Trash2, X, Check, Printer, Info, Tag, Barcode, Eye, EyeOff, RefreshCw, LayoutGrid, List, AlignJustify } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import HelpTooltip from '../components/HelpTooltip';
import { useTranslation } from 'react-i18next';

const StockPage = () => {
    const { t } = useTranslation();
    const { showModal } = useModal();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'list'>(() => {
        return (localStorage.getItem('stockViewMode') as 'grid' | 'table' | 'list') || 'grid';
    });

    // Detailed form state
    const [editingProduct, setEditingProduct] = useState<any>({
        id: 0,
        itemCode: '',
        barcode: '',
        nameTH: '',
        nameEN: '',
        price: 0,
        cost: 0,
        remain: 0,
        productTypeId: 1,
        isAvailable: true,
        isPosSale: true,
        isVat: true
    });

    const [newCategoryName, setNewCategoryName] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([
                (window.go.main.App as any).LoadProducts(),
                (window.go.main.App as any).GetCategories()
            ]);
            setProducts(pRes || []);
            setCategories(cRes || []);
        } catch (err) {
            console.error("Load failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const saveProduct = async () => {
        try {
            // Convert price/cost to float effectively if they are handled as pointers in backend
            // Go models often use pointers for optional fields
            await (window.go.main.App as any).SaveProduct(editingProduct);
            setIsEditModalOpen(false);
            loadData();
            showModal({ title: t('common.success'), message: 'Product saved successfully', type: 'success' });
        } catch (err) {
            showModal({ title: t('common.error'), message: 'Failed to save: ' + err, type: 'error' });
        }
    };

    const handlePrintTag = async (product: any) => {
        try {
            await (window.go.main.App as any).PrintPriceTag(product);
            showModal({ title: 'Printing', message: 'Price tag sent to printer', type: 'success' });
        } catch (err) {
            showModal({ title: 'Print Failed', message: '' + err, type: 'error' });
        }
    };

    const toggleAvailability = async (product: any) => {
        const nextStatus = !(product.isAvailable === undefined || product.isAvailable === true);
        try {
            await (window.go.main.App as any).UpdateProductAvailability(product.itemCode, nextStatus);
            loadData();
        } catch (err) {
            showModal({ title: 'Update Failed', message: '' + err, type: 'error' });
        }
    };

    const deleteProduct = async (id: number) => {
        showModal({
            title: 'Delete Product',
            message: 'Are you sure you want to permanently delete this product?',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await (window.go.main.App as any).DeleteProduct(id);
                    loadData();
                } catch (err) {
                    showModal({ title: 'Delete Failed', message: '' + err, type: 'error' });
                }
            }
        });
    };

    const handleAddCategory = async () => {
        if (!newCategoryName) return;
        try {
            await (window.go.main.App as any).AddCategory(newCategoryName);
            setNewCategoryName('');
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleImageUpload = async () => {
        try {
            const fileName = await (window.go.main.App as any).SelectAndSaveImage();
            if (fileName) {
                setEditingProduct({ ...editingProduct, localImagePath: fileName });
            }
        } catch (err) {
            showModal({ title: t('common.error'), message: 'Failed to upload image: ' + err, type: 'error' });
        }
    };

    const handleDeleteCategory = async (id: number) => {
        try {
            await (window.go.main.App as any).DeleteCategory(id);
            loadData();
        } catch (err) { console.error(err); }
    };

    const filteredProducts = products.filter(p =>
        p.nameTH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nameEN?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.includes(searchTerm) ||
        p.itemCode?.includes(searchTerm)
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
                        <Package size={20} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.50rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                            {t('sidebar.stock', { defaultValue: 'Stock' })}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.7, margin: 0 }}>
                            {products.length} {t('stock_modal.items_total', { defaultValue: 'Items in Matrix' })}
                        </p>
                    </div>
                    <HelpTooltip titleKey="help.stock.title" contentKey="help.stock.content" />
                </div>

                <div className="flex gap-4">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
                        <button
                            onClick={() => {
                                setViewMode('grid');
                                localStorage.setItem('stockViewMode', 'grid');
                            }}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-lg text-slate-800' : 'text-slate-400 hover:text-white'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('list');
                                localStorage.setItem('stockViewMode', 'list');
                            }}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-lg text-slate-800' : 'text-slate-400 hover:text-white'}`}
                            title="List View"
                        >
                            <AlignJustify size={18} />
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('table');
                                localStorage.setItem('stockViewMode', 'table');
                            }}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-lg text-slate-800' : 'text-slate-400 hover:text-white'}`}
                            title="Table View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="glass-shine-wrap relative px-6 py-3 bg-white/5 hover:bg-white/10 rounded-[16px] border border-white/5 font-bold transition-all flex items-center gap-2 text-[var(--text-secondary)] text-sm"
                    >
                        <Tag size={16} />
                        Categories
                    </button>
                    <button
                        onClick={() => {
                            setEditingProduct({
                                id: 0,
                                itemCode: '',
                                barcode: '',
                                nameTH: '',
                                nameEN: '',
                                price: 0,
                                cost: 0,
                                remain: 0,
                                productTypeId: categories[0]?.id || 1,
                                isAvailable: true,
                                isPosSale: true,
                                isVat: true
                            });
                            setIsEditModalOpen(true);
                        }}
                        className="btn py-3 px-8 rounded-[16px] flex items-center gap-2 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                    >
                        <Plus size={18} strokeWidth={3} />
                        {t('stock.add_product')}
                    </button>
                </div>
            </header>

            <div className="flex items-center gap-3 glass p-3 rounded-full border border-[var(--border-color)] shadow-lg group shrink-0">
                <Search size={18} className="text-[var(--text-secondary)] opacity-50 group-focus-within:opacity-100 transition-opacity ml-1" />
                <input
                    className="bg-transparent border-none outline-none text-base w-full text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:opacity-40"
                    placeholder="Search by name, item code, or barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="p-2 hover:bg-white/5 rounded-full transition-all opacity-50 hover:opacity-100"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {viewMode === 'grid' ? (
                    <div className="grid gap-4 pb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
                        {loading ? (
                            <div className="col-span-full flex flex-col items-center justify-center gap-4 opacity-40 py-20">
                                <RefreshCw className="animate-spin" size={48} />
                                <span className="font-black uppercase tracking-widest text-sm">{t('stock.scanning')}</span>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center gap-6 opacity-30 py-32 border-2 border-dashed border-white/5 rounded-[40px]">
                                <Package size={80} strokeWidth={1} />
                                <div className="text-center">
                                    <p className="text-2xl font-black">{t('stock.no_items')}</p>
                                    <p className="text-sm font-bold mt-2">{t('stock.adjust_filters')}</p>
                                </div>
                            </div>
                        ) : filteredProducts.map(p => {
                            const available = p.isAvailable === undefined || p.isAvailable === true;
                            return (
                                <div
                                    key={p.id}
                                    className={`product-card group shadow-premium compact relative transition-all duration-300`}
                                >
                                    {/* Management Actions - Top Center Absolute */}
                                    <div className="absolute -top-3 inset-x-0 flex justify-center w-full z-[999] pointer-events-none">
                                        <div className={`flex flex-row gap-1 opacity-100 transition-all duration-300 pointer-events-auto bg-white p-1.5 rounded-full shadow-lg border border-slate-200 ${!available ? 'ring-2 ring-slate-100' : ''}`}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePrintTag(p); }}
                                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-full transition-all border border-slate-200"
                                                title="Print Tag"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleAvailability(p); }}
                                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-full transition-all border border-slate-200"
                                                title={available ? "Mark Sold Out" : "Mark Available"}
                                            >
                                                {available ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setIsEditModalOpen(true); }}
                                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-full transition-all border border-slate-200"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }}
                                                className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-500 hover:text-white shadow-sm rounded-full transition-all border border-red-200"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card Content Container (Grayscaled context if sold out) */}
                                    <div className={`flex-1 flex flex-col transition-all duration-300 ${!available ? 'opacity-40 grayscale' : ''}`}>
                                        {/* Image */}
                                        <div className="product-image-wrap relative bg-white transition-transform duration-300" style={{ height: '140px', overflow: 'hidden' }}>
                                            {p.localImagePath ? (
                                                <img
                                                    src={`/images/${p.localImagePath.split(/[\\/]/).pop()}`}
                                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                                    alt={p.nameTH}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9InN0ZWVsdmx1ZSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIyNCIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cG9seWdvbiBwb2ludHM9IjIxIDE1IDE2IDEwIDUgMjEgMjEgMjEiLz48L3N2Zz4=';
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center opacity-20">
                                                    <Package size={48} strokeWidth={1} />
                                                    <span className="text-sm font-black uppercase tracking-widest mt-2">{t('noImage', { defaultValue: 'No Image' })}</span>
                                                </div>
                                            )}

                                            {!available && (
                                                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none text-center">
                                                    <span className="bg-slate-800 text-white px-5 py-2 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl">SOLD OUT</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="px-1 flex flex-col gap-1 mt-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest truncate">{p.itemCode}</div>
                                                    {p.isBundle && (
                                                        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ml-2">BUNDLE</span>
                                                    )}
                                                </div>
                                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.remain > 0 ? 'bg-slate-50 text-slate-500' : 'bg-red-50 text-red-400'}`}>
                                                    {p.remain} {t('unit', { defaultValue: 'UNIT' })}
                                                </div>
                                            </div>
                                            <div className="font-black text-slate-900 text-base line-clamp-2 min-h-[1.5rem] tracking-tight leading-tight">{p.nameTH}</div>

                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                                                <div className="text-base font-black text-slate-900 tracking-tight">
                                                    ฿{p.price ? p.price.toLocaleString() : '0'}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {categories.find(c => c.id === p.productTypeId)?.name || 'General'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="flex flex-col gap-3 pb-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-4 opacity-40 py-20">
                                <RefreshCw className="animate-spin" size={48} />
                                <span className="font-black uppercase tracking-widest text-sm">{t('stock.scanning')}</span>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-6 opacity-30 py-32 border-2 border-dashed border-white/5 rounded-[40px]">
                                <Package size={80} strokeWidth={1} />
                                <div className="text-center">
                                    <p className="text-2xl font-black">{t('stock.no_items')}</p>
                                    <p className="text-sm font-bold mt-2">{t('stock.adjust_filters')}</p>
                                </div>
                            </div>
                        ) : filteredProducts.map(p => {
                            const available = p.isAvailable === undefined || p.isAvailable === true;
                            return (
                                <div
                                    key={p.id}
                                    className={`glass-card group overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 flex items-center p-3 gap-4 rounded-3xl ${!available ? 'opacity-50 grayscale' : ''}`}
                                >
                                    {/* Image Section */}
                                    <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 flex items-center justify-center relative">
                                        {p.localImagePath ? (
                                            <img
                                                src={`/images/${p.localImagePath.split(/[\\/]/).pop()}`}
                                                className="w-full h-full object-contain"
                                                alt={p.nameTH}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9InN0ZWVsdmx1ZSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIyNCIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cG9seWdvbiBwb2ludHM9IjIxIDE1IDE2IDEwIDUgMjEgMjEgMjEiLz48L3N2Zz4=';
                                                }}
                                            />
                                        ) : (
                                            <Package size={32} className="text-slate-200" />
                                        )}
                                        {!available && (
                                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                                                <span className="text-[8px] font-black text-white uppercase tracking-tighter">SOLD OUT</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details Section */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{p.itemCode}</span>
                                            {p.isBundle && (
                                                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">BUNDLE</span>
                                            )}
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {categories.find(c => c.id === p.productTypeId)?.name || 'General'}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-white text-lg leading-tight truncate">{p.nameTH}</h3>
                                        <div className="text-xs text-slate-400 mt-1 line-clamp-1 opacity-60">{p.nameEN || 'No English identifier'}</div>
                                    </div>

                                    {/* Inventory & Pricing */}
                                    <div className="flex items-center gap-8 px-4 border-l border-white/5">
                                        <div className="text-center">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Stock</div>
                                            <div className={`text-lg font-black ${p.remain <= 0 ? 'text-red-400' : 'text-white'}`}>
                                                {p.remain} <span className="text-[10px] opacity-40 font-bold">UNIT</span>
                                            </div>
                                        </div>
                                        <div className="text-right min-w-[100px]">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Unit Price</div>
                                            <div className="text-xl font-black text-[var(--accent-primary)]">
                                                ฿{p.price ? p.price.toLocaleString() : '0'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 pl-4 border-l border-white/5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlePrintTag(p); }}
                                            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5"
                                            title="Print Tag"
                                        >
                                            <Printer size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleAvailability(p); }}
                                            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5"
                                            title={available ? "Mark Sold Out" : "Mark Available"}
                                        >
                                            {available ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setIsEditModalOpen(true); }}
                                            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }}
                                            className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="p-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                    <th className="p-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Identity</th>
                                    <th className="p-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Name</th>
                                    <th className="p-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400 text-right">Inventory</th>
                                    <th className="p-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400 text-right">Price</th>
                                    <th className="p-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <RefreshCw className="animate-spin mx-auto mb-4 opacity-40" size={32} />
                                            <span className="text-xs font-black uppercase tracking-widest opacity-40">Syncing...</span>
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center opacity-30">
                                            <Package className="mx-auto mb-4" size={48} />
                                            <p className="font-black uppercase tracking-widest">No Products Identified</p>
                                        </td>
                                    </tr>
                                ) : filteredProducts.map(p => {
                                    const available = p.isAvailable === undefined || p.isAvailable === true;
                                    return (
                                        <tr key={p.id} className={`group hover:bg-white/[0.02] transition-colors ${!available ? 'opacity-40 grayscale' : ''}`}>
                                            <td className="p-5">
                                                <div className={`w-2.5 h-2.5 rounded-full ${available ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-black text-slate-500 uppercase tracking-widest">{p.itemCode}</span>
                                                    {p.barcode && <span className="text-xs font-bold text-slate-500 font-mono">{p.barcode}</span>}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-black text-[var(--text-primary)] text-base">{p.nameTH}</span>
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                                                        {categories.find(c => c.id === p.productTypeId)?.name || 'General'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <span className={`text-sm font-black ${p.remain <= 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                                    {p.remain} <span className="text-[10px] ml-0.5 opacity-60">UNIT</span>
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <span className="text-lg font-black text-[var(--accent-primary)]">
                                                    ฿{p.price ? p.price.toLocaleString() : '0'}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handlePrintTag(p)} className="p-2.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all" title="Print Tag"><Printer size={16} /></button>
                                                    <button onClick={() => toggleAvailability(p)} className="p-2.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all">{available ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                                                    <button onClick={() => { setEditingProduct(p); setIsEditModalOpen(true); }} className="p-2.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"><Edit2 size={16} /></button>
                                                    <button onClick={() => deleteProduct(p.id)} className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal - Standard Premium Aesthetic (Fixed Transparency) */}
            {
                isEditModalOpen && (
                    <div className="modal-overlay-standard" onClick={() => setIsEditModalOpen(false)}>
                        <div
                            className="modal-card-standard modal-viewport-constraint animate-in fade-in zoom-in duration-500 max-w-3xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center modal-header-sticky" style={{ backgroundColor: '#ffffff' }}>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight" style={{ color: '#1e293b' }}>
                                        {editingProduct.id ? t('stock_modal.title') : t('stock_modal.new_identity', { defaultValue: 'New Identity' })}
                                    </h2>
                                    <p className="text-sm font-black uppercase tracking-[0.2em] mt-1" style={{ color: '#94a3b8' }}>{t('stock_modal.subtitle')}</p>
                                </div>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all hover:bg-slate-100"
                                    style={{ backgroundColor: '#f8fafc', color: '#cbd5e1' }}
                                >
                                    <X size={28} />
                                </button>
                            </div>

                            <div className="modal-scrollable-content" style={{ backgroundColor: '#ffffff' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem 2rem' }}>
                                    {/* Section 0: Image Editor */}
                                    <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        <label className="text-sm font-black uppercase tracking-widest px-1" style={{ color: '#94a3b8' }}>{t('stock_modal.image_editor')}</label>
                                        <div className="flex items-center gap-8 p-6" style={{ backgroundColor: '#f8fafc', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
                                            <div className="w-32 h-32 rounded-[24px] overflow-hidden bg-white border border-slate-100 flex items-center justify-center relative group shadow-sm">
                                                {editingProduct.localImagePath ? (
                                                    <img
                                                        src={`/images/${editingProduct.localImagePath.split(/[\\/]/).pop()}`}
                                                        className="w-full h-full object-contain"
                                                        alt="Product"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9InN0ZWVsdmx1ZSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cG9seWdvbiBwb2ludHM9IjIxIDE1IDE2IDEwIDUgMjEgMjEgMjEiLz48L3N2Zz4=';
                                                        }}
                                                    />
                                                ) : (
                                                    <Package className="text-slate-200" size={48} strokeWidth={1.5} />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={handleImageUpload}
                                                    className="px-8 py-3 bg-white hover:bg-slate-50 text-slate-700 font-black text-sm uppercase tracking-widest rounded-2xl border border-slate-200 transition-all flex items-center gap-3 shadow-sm"
                                                >
                                                    <Plus size={16} strokeWidth={3} className="text-[var(--accent-primary)]" />
                                                    {t('stock_modal.upload_image')}
                                                </button>
                                                {editingProduct.localImagePath && (
                                                    <button
                                                        onClick={() => setEditingProduct({ ...editingProduct, localImagePath: '' })}
                                                        className="px-8 py-3 bg-white hover:bg-red-50 text-red-500 font-black text-sm uppercase tracking-widest rounded-2xl border border-red-100 transition-all flex items-center gap-3 shadow-sm"
                                                    >
                                                        <Trash2 size={16} />
                                                        {t('stock_modal.remove_image')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 1: Identifiers */}
                                    <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label className="text-sm font-black uppercase tracking-widest px-1" style={{ color: '#94a3b8' }}>{t('stock_modal.product_id')}</label>
                                        <input
                                            className="modal-input-standard font-bold text-sm"
                                            value={editingProduct.itemCode}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, itemCode: e.target.value })}
                                            placeholder="e.g. ITEM-001"
                                            autoFocus
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label className="text-sm font-black uppercase tracking-widest px-1" style={{ color: '#94a3b8' }}>{t('stock_modal.barcode')}</label>
                                        <input
                                            className="modal-input-standard font-bold text-sm"
                                            value={editingProduct.barcode}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                                            placeholder="Scan or Type..."
                                        />
                                    </div>

                                    {/* Section 2: Identity */}
                                    <div style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label className="text-sm font-black uppercase tracking-widest px-1" style={{ color: '#94a3b8' }}>{t('stock_modal.name_th')}</label>
                                        <input
                                            className="modal-input-standard font-black text-lg"
                                            value={editingProduct.nameTH}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, nameTH: e.target.value })}
                                            placeholder="ชื่อสินค้าภาษาไทย"
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label className="text-sm font-black uppercase tracking-widest px-1" style={{ color: '#94a3b8' }}>{t('stock_modal.name_en')}</label>
                                        <input
                                            className="modal-input-standard font-bold text-base"
                                            value={editingProduct.nameEN}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, nameEN: e.target.value })}
                                            placeholder="English Name"
                                        />
                                    </div>

                                    {/* Section 3: Financials & Logistics */}
                                    <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label className="text-sm font-black uppercase tracking-widest px-1" style={{ color: '#94a3b8' }}>{t('stock_modal.price')}</label>
                                        <input
                                            type="number"
                                            className="modal-input-standard font-black text-2xl"
                                            value={editingProduct.price}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label className="text-sm font-black uppercase tracking-widest px-1" style={{ color: '#94a3b8' }}>{t('stock_modal.cost')}</label>
                                        <input
                                            type="number"
                                            className="modal-input-standard font-black text-lg text-amber-500"
                                            value={editingProduct.cost}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, cost: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label className="text-sm font-black uppercase tracking-widest px-1" style={{ color: '#94a3b8' }}>{t('stock_modal.stock')}</label>
                                        <input
                                            type="number"
                                            className="modal-input-standard font-black text-2xl"
                                            value={editingProduct.remain}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, remain: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label className="text-sm font-black uppercase tracking-widest px-1" style={{ color: '#94a3b8' }}>{t('stock_modal.category')}</label>
                                        <select
                                            className="modal-input-standard font-bold appearance-none text-sm h-full"
                                            value={editingProduct.productTypeId}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, productTypeId: parseInt(e.target.value) })}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id} style={{ backgroundColor: '#ffffff', color: '#1e293b' }}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Section 4: Bundle Components */}
                                    {editingProduct.isBundle && editingProduct.bundleItems && editingProduct.bundleItems.length > 0 && (
                                        <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                                            <label className="text-sm font-black uppercase tracking-widest px-1" style={{ color: '#94a3b8' }}>{t('stock_modal.bundle_components', { defaultValue: 'Bundle Components' })}</label>
                                            <div className="flex flex-col gap-2 p-4" style={{ backgroundColor: '#f0f9ff', borderRadius: '24px', border: '1px solid #e0f2fe' }}>
                                                {editingProduct.bundleItems.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-blue-50">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-slate-900">{item.item_name || item.item_code}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.item_code}</span>
                                                        </div>
                                                        <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-black">{item.qty} Qty</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Flags */}
                                    <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
                                        <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <span className="text-sm font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>{t('stock_modal.availability')}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={editingProduct.isAvailable !== false} onChange={(e) => setEditingProduct({ ...editingProduct, isAvailable: e.target.checked })} />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                </div>
                                                <span className="text-sm font-bold uppercase" style={{ color: '#64748b' }}>{t('stock_modal.ready_sale')}</span>
                                            </div>
                                        </div>
                                        <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <span className="text-sm font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>{t('stock_modal.pos_service')}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={editingProduct.isPosSale !== false} onChange={(e) => setEditingProduct({ ...editingProduct, isPosSale: e.target.checked })} />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
                                                </div>
                                                <span className="text-sm font-bold uppercase" style={{ color: '#64748b' }}>{t('stock_modal.pos_permitted')}</span>
                                            </div>
                                        </div>
                                        <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <span className="text-sm font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>{t('stock_modal.vat_status')}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={editingProduct.isVat !== false} onChange={(e) => setEditingProduct({ ...editingProduct, isVat: e.target.checked })} />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                                </div>
                                                <span className="text-sm font-bold uppercase" style={{ color: '#64748b' }}>{t('stock_modal.vat_inclusive')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer-sticky flex gap-6">
                                <button
                                    className="flex-1 btn-cancel-modal"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    {t('stock_modal.discard')}
                                </button>
                                <button
                                    onClick={saveProduct}
                                    className="flex-[2] btn-primary-modal"
                                >
                                    <Check size={18} strokeWidth={3} className="inline-block mr-2" style={{ marginTop: '-2px' }} />
                                    <span>{t('stock_modal.commit')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Category Modal - Standard Premium Aesthetic (Fixed Transparency) */}
            {
                isCategoryModalOpen && (
                    <div className="modal-overlay-standard" onClick={() => setIsCategoryModalOpen(false)}>
                        <div
                            className="modal-card-standard modal-viewport-constraint animate-in fade-in zoom-in duration-500 max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center modal-header-sticky" style={{ backgroundColor: '#ffffff' }}>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight" style={{ color: '#1e293b' }}>Category Registry</h2>
                                    <p className="text-sm font-black uppercase tracking-[0.2em] mt-1" style={{ color: '#94a3b8' }}>Isolate Product Groups</p>
                                </div>
                                <button
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:bg-slate-100"
                                    style={{ backgroundColor: '#f8fafc', color: '#cbd5e1' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="shrink-0" style={{ padding: '1.5rem 2.5rem', backgroundColor: '#ffffff' }}>
                                <div className="flex gap-4">
                                    <input
                                        className="flex-1 modal-input-standard"
                                        placeholder="New Group Name..."
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleAddCategory}
                                        className="btn-primary-modal px-6 shadow-lg"
                                        style={{ padding: '1.25rem 1.5rem', borderRadius: '20px' }}
                                    >
                                        <Plus size={24} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            <div className="modal-scrollable-content py-0" style={{ backgroundColor: '#ffffff' }}>
                                <div className="flex flex-col gap-3">
                                    {categories.map(cat => (
                                        <div
                                            key={cat.id}
                                            className="flex justify-between items-center p-5 group transition-all"
                                            style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '20px' }}
                                        >
                                            <span className="font-bold" style={{ color: '#1e293b' }}>{cat.name}</span>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="p-3 text-red-500 opacity-20 group-hover:opacity-100 transition-all rounded-xl"
                                                style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="shrink-0 border-t" style={{ padding: '2.5rem', backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                                <button
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="w-full btn-cancel-modal py-4"
                                >
                                    Registry Sync Done
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default StockPage;
