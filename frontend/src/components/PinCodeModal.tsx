import React, { useState, useEffect } from 'react';
import { Delete, X, Lock, Check } from 'lucide-react';
import Keypad from './Keypad';
import { useTranslation } from 'react-i18next';

interface PinCodeModalProps {
    title?: string;
    onSuccess: (staff: any) => void;
    onCancel: () => void;
    requireManager?: boolean;
}

const PinCodeModal: React.FC<PinCodeModalProps> = ({ title, onSuccess, onCancel, requireManager = false }) => {
    const { t } = useTranslation();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleNumberClick = (num: number) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setPin('');
    };

    const validatePin = async () => {
        setLoading(true);
        try {
            const staff = await window.go.main.App.ValidatePin(pin);
            if (staff) {
                if (requireManager && staff.role !== 'Manager') {
                    setError(true);
                    setPin('');
                    // Maybe show a specific "Manager required" error?
                } else {
                    onSuccess(staff);
                }
            } else {
                setPin('');
                setError(true);
            }
        } catch (err) {
            console.error("PIN validation error:", err);
            setPin('');
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (pin.length === 6) {
            validatePin();
        }
    }, [pin]);

    return (
        <div className="modal-overlay-standard" onClick={onCancel}>
            <div
                className="modal-card-standard modal-viewport-constraint animate-in fade-in zoom-in duration-400"
                style={{ 
                    backgroundColor: '#ffffff', 
                    padding: 'clamp(1.5rem, 5vh, 3rem) clamp(1rem, 5vw, 2rem)',
                    width: 'min(90vw, 440px)',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-slate-400 hover:text-slate-600 transition-all rounded-full hover:bg-slate-50"
                >
                    <X size={20} className="md:w-6 md:h-6" />
                </button>

                <div className="flex flex-col items-center gap-4 md:gap-6 mb-6 md:mb-8 mt-2 md:mt-4">
                    <div className={`transition-all duration-300 ${error ? 'shake' : ''}`} style={{
                        width: 'clamp(60px, 12vh, 80px)',
                        height: 'clamp(60px, 12vh, 80px)',
                        borderRadius: 'clamp(16px, 3vh, 24px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: error ? '#ef4444' : 'var(--accent-primary)',
                        boxShadow: error ? '0 0 30px rgba(239,68,68,0.4)' : '0 20px 40px -10px rgba(139,92,246,0.5)',
                    }}>
                        {loading ? (
                            <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                        ) : error ? (
                            <X size={32} color="white" strokeWidth={3} className="md:w-10 md:h-10" />
                        ) : (
                            <Lock size={32} color="white" strokeWidth={2.5} className="md:w-10 md:h-10" />
                        )}
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                            {title || (requireManager ? 'Manager Only' : 'Enter PIN')}
                        </h2>
                        <p className="text-[10px] md:text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            {error ? (requireManager ? 'Authorized Manager Required' : 'Invalid Passcode') : 'Authorized Access Only'}
                        </p>
                    </div>
                </div>

                <div className="w-full flex justify-center">
                    <Keypad
                        value={pin}
                        onValueChange={(val) => {
                            setPin(val);
                            setError(false);
                        }}
                        maxLength={6}
                        mode="passcode"
                    />
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes modalSlideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `}} />
        </div>
    );
};

export default PinCodeModal;
