import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useTheme } from './ThemeContext';
import { AlertCircle, CheckCircle2, Info, HelpCircle, XCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ModalType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

interface ModalOptions {
    title: string;
    message: ReactNode;
    type?: ModalType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    hideFooter?: boolean;
    maxWidthClass?: string;
    compactMode?: boolean;
}

interface ModalContextType {
    showModal: (options: ModalOptions) => void;
    hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ModalOptions | null>(null);
    const { activeTheme } = useTheme();

    const showModal = (opts: ModalOptions) => {
        setOptions(opts);
        setIsOpen(true);
    };

    const hideModal = () => {
        setIsOpen(false);
        setOptions(null);
    };

    const handleConfirm = () => {
        if (options?.onConfirm) options.onConfirm();
        hideModal();
    };

    const handleCancel = () => {
        if (options?.onCancel) options.onCancel();
        hideModal();
    };

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            {isOpen && options && (
                <GlobalModalComponent
                    options={options}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    theme={activeTheme}
                />
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

// Internal Component to keep focus
const GlobalModalComponent: React.FC<{
    options: ModalOptions;
    onConfirm: () => void;
    onCancel: () => void;
    theme: string;
}> = ({ options, onConfirm, onCancel, theme }) => {
    const { t } = useTranslation();
    const { title, message, type = 'info', confirmText = t('common.confirm'), cancelText = t('common.cancel') } = options;

    const getIcon = () => {
        const iconSize = 40;
        const iconColor = "white";
        switch (type) {
            case 'success': return <CheckCircle2 size={iconSize} color={iconColor} />;
            case 'error': return <XCircle size={iconSize} color={iconColor} />;
            case 'warning': return <AlertCircle size={iconSize} color={iconColor} />;
            case 'confirm': return <HelpCircle size={iconSize} color={iconColor} />;
            default: return <Info size={iconSize} color={iconColor} />;
        }
    };

    return (
        <div className={`${theme} modal-overlay-standard`} onClick={onCancel}>
            <div
                className={`modal-card-standard modal-viewport-constraint animate-in fade-in zoom-in duration-400 ${options.maxWidthClass || 'max-w-2xl'}`}
                style={{ backgroundColor: '#ffffff', position: 'relative' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Emergency Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 z-[1000] p-2 text-slate-400 hover:text-red-500 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-slate-100 transition-all hover:scale-110 active:scale-95"
                    title="Close Modal"
                >
                    <X size={24} />
                </button>

                <div className={`modal-scrollable-content flex flex-col items-center justify-center text-center ${options.compactMode ? 'py-4 px-4 gap-2' : 'py-clamp px-clamp gap-clamp'}`}>
                    <style dangerouslySetInnerHTML={{ __html: `
                        :root {
                            --py-modal: clamp(1.5rem, 6vh, 4rem);
                            --px-modal: clamp(1rem, 5vw, 3rem);
                            --gap-modal: clamp(1rem, 4vh, 2.5rem);
                        }
                        .py-clamp { padding-top: var(--py-modal); padding-bottom: var(--py-modal); }
                        .px-clamp { padding-left: var(--px-modal); padding-right: var(--px-modal); }
                        .gap-clamp { gap: var(--gap-modal); }
                    `}} />
                    
                    {/* Icon Header (PinCode Match) */}
                    {!options.compactMode && (
                        <div
                            className="w-clamp-icon h-clamp-icon rounded-4xl flex items-center justify-center relative shadow-red-premium shrink-0"
                            style={{ backgroundColor: '#ef4444' }}
                        >
                            <style dangerouslySetInnerHTML={{ __html: `
                                .w-clamp-icon { width: clamp(60px, 15vh, 96px); }
                                .h-clamp-icon { height: clamp(60px, 15vh, 96px); }
                            `}} />
                            <div className="relative z-10 scale-clamp-icon">
                                <style dangerouslySetInnerHTML={{ __html: `
                                    .scale-clamp-icon { transform: scale(clamp(0.7, 2vh, 1)); }
                                `}} />
                                {getIcon()}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <h2 className="text-clamp-title font-black text-slate-800 tracking-[0.01em] leading-tight">
                            <style dangerouslySetInnerHTML={{ __html: `
                                .text-clamp-title { font-size: clamp(1.5rem, 5vh, 2.25rem); }
                            `}} />
                            {title}
                        </h2>
                        {typeof message === 'string' && (
                            <div className="text-slate-400 text-clamp-msg tracking-[0.2em] font-black uppercase opacity-60">
                                <style dangerouslySetInnerHTML={{ __html: `
                                    .text-clamp-msg { font-size: clamp(0.7rem, 2vh, 0.875rem); }
                                `}} />
                                {message}
                            </div>
                        )}
                    </div>

                    <div className="w-full flex-1 flex flex-col items-center justify-center overflow-visible min-h-0">
                        {typeof message !== 'string' && message}
                    </div>

                    {!options.hideFooter && (
                        <div className="flex gap-4 w-full mt-2 shrink-0 px-2">
                            {type === 'confirm' && (
                                <button
                                    onClick={onCancel}
                                    className="btn-cancel-modal flex-1 py-4 text-sm font-black"
                                >
                                    {cancelText}
                                </button>
                            )}
                            <button
                                onClick={onConfirm}
                                className="btn-primary-modal flex-1 py-4 text-sm font-black"
                            >
                                {confirmText}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};
