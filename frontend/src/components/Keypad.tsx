import React from 'react';
import { Delete, X, Check } from 'lucide-react';

interface KeypadProps {
    value: string;
    onValueChange: (value: string) => void;
    onConfirm?: () => void;
    onClear?: () => void;
    maxLength?: number;
    mode?: 'passcode' | 'numeric'; // passcode = circles, numeric = display number
    showConfirmButton?: boolean;
    confirmText?: string;
    compact?: boolean;
    hideDisplay?: boolean;
}

const Keypad: React.FC<KeypadProps> = ({
    value,
    onValueChange,
    onConfirm,
    onClear,
    maxLength = 6,
    mode = 'passcode',
    showConfirmButton = false,
    confirmText = 'Confirm',
    compact = false,
    hideDisplay = false
}) => {
    const btnSize = compact ? 'clamp(56px, 14vh, 64px)' : 'clamp(56px, 15vh, 70px)';
    const gridGap = compact ? 'clamp(0.5rem, 1.5vh, 0.75rem)' : 'clamp(0.5rem, 2vh, 1.5rem)';
    const containerGap = compact ? 'clamp(0.75rem, 2.5vh, 1.5rem)' : 'clamp(1rem, 4vh, 2.5rem)';
    const displayHeight = compact ? 'clamp(50px, 10vh, 60px)' : 'clamp(60px, 12vh, 80px)';
    const btnFontSize = compact ? 'clamp(1.5rem, 4vh, 1.75rem)' : 'clamp(1.125rem, 3vh, 1.5rem)';
    const handleNumberClick = (num: number | string) => {
        if (value.length < maxLength) {
            onValueChange(value + num);
        }
    };

    const handleDelete = () => {
        onValueChange(value.slice(0, -1));
    };

    const handleClearInternal = () => {
        if (onClear) onClear();
        else onValueChange('');
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: containerGap,
            width: '100%',
            maxWidth: '300px'
        }}>
            {/* Display Area */}
            {!hideDisplay && (
                mode === 'passcode' ? (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {Array.from({ length: maxLength }).map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '0.875rem',
                                    height: '0.875rem',
                                    borderRadius: '9999px',
                                    border: '2px solid',
                                    transition: 'all 0.3s',
                                    backgroundColor: value.length > i ? 'var(--accent-primary)' : 'transparent',
                                    borderColor: value.length > i ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    transform: value.length > i ? 'scale(1.1)' : 'scale(1)',
                                    boxShadow: value.length > i ? '0 0 15px var(--accent-primary)' : 'none'
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div style={{
                        width: '100%',
                        padding: '1.5rem',
                        backgroundColor: 'var(--glass-bg)',
                        borderRadius: '24px',
                        border: '1px solid var(--glass-border)',
                        textAlign: 'center',
                        minHeight: displayHeight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span style={{
                            fontSize: '2.5rem',
                            fontWeight: 900,
                            color: 'var(--text-primary)',
                            letterSpacing: '0.05em'
                        }}>
                            {value || '0'}
                        </span>
                    </div>
                )
            )}

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: gridGap,
                width: '100%'
            }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleNumberClick(num)}
                        className="numpad-btn"
                        style={{
                            width: btnSize,
                            height: btnSize,
                            borderRadius: '9999px',
                            backgroundColor: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            fontSize: btnFontSize,
                            fontWeight: '900',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {num}
                    </button>
                ))}

                <button
                    onClick={handleClearInternal}
                    style={{
                        width: btnSize,
                        height: btnSize,
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: '#f87171',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        cursor: 'pointer',
                        background: 'transparent',
                        border: 'none',
                        transition: 'all 0.2s'
                    }}
                    className="hover:opacity-70"
                >
                    Clear
                </button>

                <button
                    onClick={() => handleNumberClick(0)}
                    className="numpad-btn"
                    style={{
                        width: btnSize,
                        height: btnSize,
                        borderRadius: '9999px',
                        backgroundColor: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        fontSize: btnFontSize,
                        fontWeight: '900',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    0
                </button>

                <button
                    onClick={handleDelete}
                    style={{
                        width: btnSize,
                        height: btnSize,
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        background: 'transparent',
                        border: 'none',
                        transition: 'all 0.2s'
                    }}
                    className="hover:opacity-70"
                >
                    <Delete size={32} />
                </button>

                {mode === 'numeric' && (
                    <button
                        key="dot"
                        onClick={() => handleNumberClick('.')}
                        className="numpad-btn"
                        style={{
                            width: btnSize,
                            height: btnSize,
                            borderRadius: '9999px',
                            backgroundColor: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            fontSize: '2rem',
                            fontWeight: '900',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            gridColumn: '1',
                            display: mode === 'numeric' ? 'flex' : 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingBottom: '0.75rem'
                        }}
                    >
                        .
                    </button>
                )}
            </div>

            {showConfirmButton && (
                <button
                    onClick={onConfirm}
                    style={{
                        width: '100%',
                        padding: '1.25rem',
                        borderRadius: '24px',
                        background: 'var(--accent-gradient)',
                        color: 'white',
                        border: 'none',
                        fontSize: '1.125rem',
                        fontWeight: '900',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: '0 10px 20px -5px rgba(139, 92, 246, 0.4)',
                        transition: 'all 0.2s'
                    }}
                    className="hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Check size={24} strokeWidth={3} />
                    {confirmText}
                </button>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .numpad-btn:hover {
                    background-color: var(--glass-border) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1);
                }
                .numpad-btn:active {
                    transform: translateY(0) scale(0.95);
                }
            `}} />
        </div>
    );
};

export default Keypad;
