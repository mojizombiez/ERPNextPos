import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Keypad from './Keypad';

interface AdminAuthWrapperProps {
    children: ReactNode;
}

const AdminAuthWrapper = ({ children }: AdminAuthWrapperProps) => {
    const navigate = useNavigate();
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [masterPin, setMasterPin] = useState('');
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showKeypad, setShowKeypad] = useState(false);
    const { activeTheme } = useTheme();

    const loadMasterPin = async () => {
        try {
            const mPin = await window.go.main.App.GetSetting('MasterPin');
            setMasterPin(mPin || '123456');
        } catch (err) {
            console.error("Failed to load master pin", err);
            setMasterPin('123456'); // Fallback
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMasterPin();
    }, []);

    const handlePinSubmit = () => {
        if (pinInput === masterPin) {
            setIsAdminAuthenticated(true);
            setPinError(false);
        } else {
            setPinError(true);
            setPinInput('');
        }
    };


    if (loading) {
        return <div className="p-10 text-center">Loading authentication...</div>;
    }

    if (!isAdminAuthenticated) {
        return (
            <div className={activeTheme} style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 'var(--z-auth)',
                padding: 'min(5vh, 2rem)'
            }}>
                <div className="animate-in fade-in zoom-in duration-300 scrollbar-hide" style={{
                    width: 'min(90vw, 440px)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: 'clamp(1.5rem, 5vh, 3.5rem) clamp(1rem, 5vw, 2.5rem)',
                    borderRadius: 'clamp(20px, 5vw, 40px)',
                    boxShadow: '0 32px 64px -16px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'clamp(1rem, 4vh, 2.5rem)',
                    border: '1px solid var(--glass-border)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(0.75rem, 3vh, 1.5rem)' }}>
                        <div style={{
                            width: 'clamp(60px, 15vh, 80px)',
                            height: 'clamp(60px, 15vh, 80px)',
                            backgroundColor: 'var(--accent-primary)',
                            borderRadius: 'clamp(16px, 4vh, 24px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 20px 40px -10px rgba(139,92,246,0.5)',
                        }}>
                            <Lock size={36} className="w-8 h-8 md:w-9 md:h-9" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 'clamp(1.25rem, 4vh, 1.875rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: 0 }}>
                                Admin Access Required
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.75rem, 2vh, 0.875rem)', fontWeight: 500, marginTop: '0.5rem' }}>
                                {pinError ? 'Incorrect Master PIN' : 'Enter Master PIN to continue'}
                            </p>
                        </div>
                    </div>

                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <Keypad
                            value={pinInput}
                            onValueChange={(val) => {
                                setPinInput(val);
                                if (pinError) setPinError(false);
                                if (val.length === masterPin.length && val === masterPin) {
                                    setIsAdminAuthenticated(true);
                                }
                            }}
                            onConfirm={handlePinSubmit}
                            confirmText="Authenticate Admin"
                            showConfirmButton={pinInput.length > 0}
                            mode="passcode"
                            maxLength={masterPin.length}
                        />
                    </div>

                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '0.5rem 1rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s',
                            marginTop: '-0.5rem'
                        }}
                        className="hover:bg-white/5"
                    >
                        Cancel and Go Back
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminAuthWrapper;
