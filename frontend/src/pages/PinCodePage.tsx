import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Delete, X, Unlock, Lock } from 'lucide-react';
import HelpTooltip from '../components/HelpTooltip';
import Keypad from '../components/Keypad';

const PinCodePage = () => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

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
        try {
            const staff = await window.go.main.App.ValidatePin(pin);
            if (staff) {
                login(staff);
                navigate('/checkout');
            } else {
                setPin('');
                setError(true);
            }
        } catch (err) {
            console.error("PIN validation error:", err);
            setPin('');
            setError(true);
        }
    };

    useEffect(() => {
        if (pin.length === 6) {
            validatePin();
        }
    }, [pin]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 999999
        }}>
            {/* Background decorative elements */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', backgroundColor: 'rgba(139, 92, 246, 0.1)', filter: 'blur(120px)', borderRadius: '9999px' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', backgroundColor: 'rgba(99, 102, 241, 0.1)', filter: 'blur(120px)', borderRadius: '9999px' }} />

            <div style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                padding: '2.5rem',
                borderRadius: '40px',
                boxShadow: '0 32px 64px -16px rgba(0,0,0,0.4)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2.5rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className={`transition-all duration-500`} style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: error ? '#ef4444' : 'var(--accent-primary)',
                        boxShadow: error ? '0 0 30px rgba(239,68,68,0.4)' : '0 20px 40px -10px rgba(139,92,246,0.5)',
                        animation: error ? 'bounce 1s infinite' : 'none'
                    }}>
                        {error ? <X size={40} color="white" /> : <Lock size={40} color="white" />}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.875rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>Enter PIN <HelpTooltip titleKey="help.pin.title" contentKey="help.pin.content" /></h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginTop: '0.25rem' }}>Authorized Access Only</p>
                    </div>
                </div>

                <Keypad
                    value={pin}
                    onValueChange={(val) => {
                        setPin(val);
                        setError(false);
                    }}
                    maxLength={6}
                    mode="passcode"
                />

                {error && (
                    <div style={{
                        position: 'absolute',
                        bottom: '1.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <p style={{ color: '#f87171', fontWeight: 'bold', fontSize: '0.75rem', margin: 0, animation: 'pulse 2s infinite' }}>Invalid Passcode</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PinCodePage;
