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
                style={{ backgroundColor: '#ffffff' }}
                onClick={e => e.stopPropagation()}
            >
                <div className={`modal-scrollable-content flex flex-col items-center justify-center text-center ${options.compactMode ? 'py-4 gap-2' : 'py-8 gap-6'}`}>
                    {/* Icon Header (PinCode Match) */}
                    {!options.compactMode && (
                        <div
                            className="w-24 h-24 rounded-4xl flex items-center justify-center relative shadow-red-premium shrink-0"
                            style={{ backgroundColor: '#ef4444' }}
                        >
                            <div className="relative z-10">
                                {getIcon()}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <h2 className="text-4xl font-black text-slate-800 tracking-[0.01em] leading-tight">{title}</h2>
                        {typeof message === 'string' && (
                            <div className="text-slate-400 text-sm tracking-[0.3em] font-black uppercase opacity-60">
                                {message}
                            </div>
                        )}
                    </div>

                    <div className="w-full flex-1 flex flex-col items-center justify-center overflow-visible min-h-0">
                        {typeof message !== 'string' && message}
                    </div>

                    {!options.hideFooter && (
                        <div className="flex gap-4 w-full mt-4 shrink-0 px-2">
                            {type === 'confirm' && (
                                <button
                                    onClick={onCancel}
                                    className="btn-cancel-modal flex-1"
                                >
                                    {cancelText}
                                </button>
                            )}
                            <button
                                onClick={onConfirm}
                                className="btn-primary-modal flex-1"
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
