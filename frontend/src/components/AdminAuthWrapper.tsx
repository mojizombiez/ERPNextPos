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
                padding: '1rem'
            }}>
                <div className="animate-in fade-in zoom-in duration-300" style={{
                    width: '100%',
                    maxWidth: '440px',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '3.5rem 2.5rem',
                    borderRadius: '40px',
                    boxShadow: '0 32px 64px -16px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2.5rem',
                    border: '1px solid var(--glass-border)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: 'var(--accent-primary)',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 20px 40px -10px rgba(139,92,246,0.5)',
                        }}>
                            <Lock size={36} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.875rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: 0 }}>
                                Admin Access Required
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginTop: '0.5rem' }}>
                                {pinError ? 'Incorrect Master PIN' : 'Enter Master PIN to continue'}
                            </p>
                        </div>
                    </div>

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
                            transition: 'all 0.2s'
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
