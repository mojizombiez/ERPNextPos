import React, { useEffect, useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Heart, Store, Clock, Sparkles, Package, Smartphone } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useTheme } from '../context/ThemeContext';

const CustomerDisplay: React.FC = () => {
    const { activeSession } = useCart();
    const { t } = useTranslation();
    const { activeTheme } = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [playlist, setPlaylist] = useState<string[]>([]);
    const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
    const [folderPath, setFolderPath] = useState<string>('');
    const [videoError, setVideoError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const cart = activeSession?.cart || [];
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const vat = subtotal * 0.07; // Assuming 7% VAT
    const total = subtotal + vat;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let lastHeartbeat = Date.now();
        const checkInterval = setInterval(() => {
            // If no heartbeat for 15 seconds, close this process
            if (Date.now() - lastHeartbeat > 15000) {
                console.log("No heartbeat from main app. Closing...");
                // @ts-ignore
                if (window.go && window.go.main && window.go.main.App && window.go.main.App.Quit) {
                    // @ts-ignore
                    window.go.main.App.Quit();
                } else {
                    window.close();
                }
            }
        }, 5000);

        // Listen for heartbeat events
        // @ts-ignore
        if (window.runtime && window.runtime.EventsOn) {
            // @ts-ignore
            window.runtime.EventsOn('main-app-heartbeat', () => {
                lastHeartbeat = Date.now();
            });
        }

        return () => clearInterval(checkInterval);
    }, []);

    const handleVideoEnd = () => {
        setCurrentVideoIdx((prev) => (prev + 1) % playlist.length);
    };

    useEffect(() => {
        const loadMedia = async () => {
            try {
                const goApp = (window as any).go.main.App;
                console.log("CustomerDisplay: Checking Go bindings...", !!goApp);
                const folder = await goApp.GetSetting('AdVideoFolder');
                console.log("CustomerDisplay: Setting AdVideoFolder =", folder);
                setFolderPath(folder || 'NOT SET');
                
                const linksRaw = await goApp.GetSetting('AdVideoLinks');
                const playbackMode = await goApp.GetSetting('AdPlaybackMode');
                
                let allMedia: string[] = [];
                
                // Add online links
                if (linksRaw) {
                    try {
                        const links = JSON.parse(linksRaw);
                        if (Array.isArray(links)) allMedia = [...links];
                    } catch (e) {}
                }

                // Add local files
                if (folder) {
                    console.log("CustomerDisplay: Requesting videos for folder:", folder);
                    const localFiles = await goApp.GetVideoFiles(folder);
                    console.log("CustomerDisplay: Backend returned", localFiles?.length, "files");
                    if (Array.isArray(localFiles)) {
                        // Using dedicated video server on port 34999
                        const localUrls = localFiles.map(path => `http://localhost:34999/stream-video?path=${encodeURIComponent(path)}`);
                        allMedia = [...allMedia, ...localUrls];
                    }
                }

                if (playbackMode === 'random') {
                    allMedia.sort(() => Math.random() - 0.5);
                }

                console.log("CustomerDisplay: Final Playlist:", allMedia);
                setPlaylist(allMedia);
            } catch (err) {
                console.error("Failed to load media", err);
            }
        };

        loadMedia();
    }, []);

    // Idle Screen with Video Ad
    if (cart.length === 0) {
        return (
            <div className={`relative flex flex-col items-center justify-center min-h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] ${activeTheme}`}>
                {/* Background Video or Image */}
                {playlist.length > 0 ? (
                    <div className="absolute inset-0 z-0">
                        <video
                            ref={videoRef}
                            key={playlist[currentVideoIdx]}
                            src={playlist[currentVideoIdx]}
                            autoPlay
                            muted
                            onEnded={handleVideoEnd}
                            onError={(e) => {
                                console.error("Video Playback Error:", e);
                                setVideoError("Format error. Skipping in 2s...");
                                setTimeout(() => {
                                    handleVideoEnd();
                                }, 2000);
                            }}
                            onLoadedData={() => setVideoError(null)}
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)]/50" />
                    </div>
                ) : (
                    <div className="absolute inset-0 z-0">
                        <div className="w-full h-full bg-gradient-to-br from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--bg-secondary)] animate-gradient" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--accent-primary),transparent_70%)] opacity-20" />
                    </div>
                )}

                {/* Floating Elements - Centered */}
                <div className="relative z-10 flex flex-col items-center p-12 text-center max-w-4xl mx-auto">
                    <div className="mb-10 relative animate-bounce-slow">
                        <div className="absolute inset-0 bg-[var(--accent-primary)]/30 blur-[60px] rounded-full" />
                        <div className="relative p-8 rounded-[40px] bg-[var(--glass-bg)] backdrop-blur-3xl border border-[var(--border-color)] shadow-2xl">
                            <Store size={80} className="text-[var(--accent-primary)]" strokeWidth={1} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-[var(--text-primary)] via-[var(--text-primary)] to-[var(--text-primary)]/20">
                            MoltoPos
                        </h1>
                        <div className="flex items-center justify-center gap-3 text-2xl text-[var(--accent-primary)] font-light tracking-[0.4em] uppercase">
                            <Sparkles size={24} className="animate-pulse" />
                            <span>Premium Experience</span>
                            <Sparkles size={24} className="animate-pulse" />
                        </div>
                    </div>

                    <div className="mt-12 bg-[var(--glass-bg)] backdrop-blur-2xl px-10 py-5 rounded-[28px] border border-[var(--border-color)] shadow-2xl flex items-center gap-5">
                        <Clock size={28} className="text-[var(--accent-primary)] animate-pulse" />
                        <span className="text-4xl font-mono font-black tracking-widest text-[var(--text-primary)]">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                <div className="absolute bottom-10 left-0 right-0 px-12 flex flex-col items-center gap-2 text-[var(--text-secondary)] opacity-40 uppercase tracking-widest text-[10px] font-black">
                    <div className="flex justify-between w-full">
                        <span>Powering the future of retail</span>
                        <div className="flex gap-6">
                            <span>Reliability</span>
                            <span>Speed</span>
                            <span>Innovation</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Active Cart Screen
    return (
        <div className={`flex h-screen w-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans ${activeTheme} justify-center`}>
            <div className="flex w-full h-full max-w-[1600px] border-x border-[var(--border-color)] shadow-2xl">
                {/* Left Side: Cart Items */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    {/* Dynamic Background Blur */}
                    <div className="absolute top-0 left-0 w-full h-full -z-10">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent-primary)]/10 blur-[120px] rounded-full animate-pulse" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent-primary)]/10 blur-[120px] rounded-full animate-pulse-slow" />
                    </div>

                    {/* Header */}
                    <header className="px-8 py-6 flex justify-between items-center bg-[var(--glass-bg)] backdrop-blur-2xl border-b border-[var(--border-color)]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[var(--accent-gradient)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20">
                                <ShoppingCart size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight leading-none uppercase text-[var(--text-primary)]">
                                    {t('checkout.current_order', 'Current Order')}
                                </h1>
                                <div className="flex items-center gap-2 mt-1 opacity-50 font-bold uppercase tracking-widest text-[9px] text-[var(--text-secondary)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Live Session #{activeSession?.id || '---'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-[var(--glass-bg)] px-5 py-2 rounded-xl border border-[var(--border-color)]">
                            <Clock size={16} className="text-[var(--accent-primary)]" />
                            <span className="text-lg font-mono font-black text-[var(--text-primary)]">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </header>

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-3 scrollbar-hide">
                        {cart.map((item: any, index: number) => (
                            <div
                                key={`${item.id}-${index}`}
                                className="group relative p-4 bg-[var(--glass-bg)] hover:bg-white/10 backdrop-blur-md border border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 rounded-[24px] flex items-center gap-5 transition-all duration-500 animate-in slide-in-from-left-8 fade-in fill-mode-backwards"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--border-color)] group-hover:scale-105 transition-transform duration-500">
                                    <Package size={24} className="text-[var(--accent-primary)]/70" strokeWidth={1.5} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-black tracking-tight mb-0.5 group-hover:text-[var(--accent-primary)] transition-colors truncate text-[var(--text-primary)]">
                                        {item.nameTH || item.name}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className="bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] px-2 py-0.5 rounded text-[10px] font-black border border-[var(--accent-primary)]/20">
                                            x{item.quantity}
                                        </span>
                                        <span className="text-sm text-[var(--text-secondary)] font-medium">@ ฿{item.price.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-xl font-black tracking-tighter text-[var(--text-primary)]">
                                        ฿{(item.price * item.quantity).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Totals & Summary */}
                <aside className="w-[350px] bg-[var(--glass-bg)] backdrop-blur-3xl border-l border-[var(--border-color)] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full -z-10 bg-gradient-to-b from-[var(--accent-primary)]/5 to-transparent" />
                    
                    <div className="flex-1 p-8 flex flex-col">
                        <div className="mb-auto">
                            <div className="flex items-center gap-2 mb-8 opacity-30 text-[var(--text-secondary)]">
                                <Store size={16} />
                                <span className="font-black uppercase tracking-[0.2em] text-[9px]">Order Summary</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
                                    <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('checkout.subtotal', 'Subtotal')}</span>
                                    <span className="text-xl font-mono font-black text-[var(--text-primary)]">฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
                                    <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('checkout.vat', 'VAT')}</span>
                                    <span className="text-xl font-mono font-black text-[var(--text-primary)]">฿{vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* QR Code or Status */}
                        {activeSession?.currentQrString ? (
                            <div className="mb-6 p-5 bg-white rounded-[28px] shadow-2xl animate-in zoom-in-95 duration-500">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-slate-950 text-xs font-black uppercase tracking-tighter">Scan to Pay</span>
                                        <span className="text-slate-400 text-[9px] font-bold">PromptPay QR</span>
                                    </div>
                                    <Smartphone size={20} className="text-purple-600 animate-bounce" />
                                </div>
                                <div className="flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <QRCodeCanvas
                                        value={activeSession.currentQrString}
                                        size={160}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                                <div className="mt-5 text-center text-2xl font-black text-slate-900 tracking-tighter">
                                    ฿{(activeSession.currentQrAmount || total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6 p-6 bg-gradient-to-br from-white/5 to-transparent rounded-[28px] border border-[var(--border-color)] flex flex-col items-center gap-3 shadow-inner">
                                <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
                                    <Heart size={24} className="text-[var(--accent-primary)] animate-pulse fill-[var(--accent-primary)]/20" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-base font-black uppercase tracking-[0.2em] mb-0.5 bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-primary)]/60">Thank You</h4>
                                    <p className="text-[var(--text-secondary)] text-[10px] font-medium italic opacity-60">Premium Experience</p>
                                </div>
                            </div>
                        )}

                        {/* Total Section */}
                        <div className="relative group mt-auto">
                            <div className="absolute inset-0 bg-[var(--accent-gradient)] rounded-[32px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
                            <div className="relative bg-[var(--accent-gradient)] rounded-[32px] p-6 overflow-hidden border border-white/20 shadow-2xl">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-[30px] -mr-12 -mt-12 rounded-full" />
                                
                                <span className="text-white/60 text-[9px] font-black uppercase tracking-[0.3em] mb-2 block">
                                    {t('checkout.total_amount', 'Total Amount')}
                                </span>
                                <div className="flex items-baseline gap-2 text-white">
                                    <span className="text-2xl font-black opacity-80">฿</span>
                                    <span className="text-5xl font-black tracking-tighter leading-none animate-pulse-slow">
                                        {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CustomerDisplay;
