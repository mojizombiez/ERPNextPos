import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { X } from 'lucide-react';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose }) => {
    const { activeTheme } = useTheme();
    if (!isOpen) return null;

    return (
        <div className={activeTheme} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 'var(--z-modal-base)'
        }}>
            <div className="card glass flex flex-col gap-6" style={{ width: '400px' }}>
                <div className="flex justify-between items-center">
                    <h2 style={{ margin: 0 }}>Apply Discount</h2>
                    <button onClick={onClose} className="btn-icon"><X /></button>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label style={{ color: 'var(--text-secondary)' }}>Discount Amount</label>
                        <input className="glass" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }} placeholder="0.00" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label style={{ color: 'var(--text-secondary)' }}>Reason</label>
                        <select className="glass" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            <option>Staff Discount</option>
                            <option>Promotion</option>
                            <option>Damaged Item</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <button className="btn" style={{ marginTop: '1rem' }}>Apply Discount</button>
                </div>
            </div>
        </div>
    );
};

export default DiscountModal;
