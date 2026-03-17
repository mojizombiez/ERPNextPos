import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HelpTooltipProps {
    titleKey: string;
    contentKey: string;
    size?: number;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ titleKey, contentKey, size = 18 }) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);

    const updatePosition = useCallback(() => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        setCoords({
            top: rect.top + window.scrollY - 12,   // Slightly more gap for larger button
            left: rect.left + rect.width / 2,
        });
    }, []);

    const show = () => {
        updatePosition();
        setVisible(true);
    };

    const hide = () => setVisible(false);

    // Close on outside click
    useEffect(() => {
        if (!visible) return;
        const handler = (e: MouseEvent) => {
            if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
                setVisible(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [visible]);

    // Recompute on scroll/resize so it never drifts
    useEffect(() => {
        if (!visible) return;
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [visible, updatePosition]);

    const tooltip = visible ? createPortal(
        <div
            style={{
                position: 'fixed',
                // "top" here is the top of the button; shift up by tooltip height via transform
                top: coords.top,
                left: coords.left,
                transform: 'translateX(-50%) translateY(-100%)',
                zIndex: 2147483647,   // max z-index, above everything
                minWidth: '260px',
                maxWidth: '320px',
                background: '#ffffff', // Solid white
                border: '1px solid #f1f5f9',
                borderRadius: '16px',
                boxShadow: '0 20px 40px -8px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.02)',
                padding: '14px 16px',
                pointerEvents: 'none',
                animation: 'htIn 0.15s ease-out',
            }}
        >
            {/* Arrow pointing downward */}
            <div style={{
                position: 'absolute',
                bottom: '-7px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '12px',
                height: '12px',
                background: '#ffffff', // Solid white
                border: '1px solid #f1f5f9',
                borderTop: 'none',
                borderLeft: 'none',
            }} />

            <p style={{
                fontSize: '0.7rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--accent-primary)',
                marginBottom: '6px',
                margin: '0 0 6px 0',
            }}>
                {t(titleKey)}
            </p>
            <p style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: 0,
            }}>
                {t(contentKey)}
            </p>

            <style>{`
                @keyframes htIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(calc(-100% + 6px)); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(-100%); }
                }
            `}</style>
        </div>,
        document.body
    ) : null;

    return (
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button
                ref={btnRef}
                onClick={(e) => { e.stopPropagation(); setVisible(v => !v); }}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    margin: '-8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    opacity: 1,
                    transition: 'all 0.2s',
                    borderRadius: '50%',
                    flexShrink: 0,
                    width: '40px',
                    height: '40px',
                }}
                title={t(titleKey)}
                aria-label={t(titleKey)}
            >
                <HelpCircle size={size} />
            </button>
            {tooltip}
        </span>
    );
};

export default HelpTooltip;
