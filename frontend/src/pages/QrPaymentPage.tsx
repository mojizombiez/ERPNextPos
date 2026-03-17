import React from 'react';
import { X, Check } from 'lucide-react';

const QrPaymentPage = () => {
    return (
        <div className="flex flex-col items-center justify-center gap-8 h-full">
            <div className="card glass flex flex-col items-center gap-6" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
                <h2 style={{ margin: 0 }}>QR Payment</h2>

                <div style={{
                    background: 'white',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    width: '250px',
                    height: '250px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* QR Code placeholder */}
                    <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=M-PAYMENT-MOCK"
                        alt="QR Code"
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>฿120.00</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Scan to pay</div>
                </div>

                <div className="flex gap-4 w-full">
                    <button className="btn w-full" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                        <X size={20} /> Cancel
                    </button>
                    <button className="btn w-full">
                        <Check size={20} /> Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QrPaymentPage;
