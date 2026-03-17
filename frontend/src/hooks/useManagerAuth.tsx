import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PinCodeModal from '../components/PinCodeModal';

export const useManagerAuth = () => {
    const { currentUser } = useAuth();
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const checkManager = useCallback((action: () => void) => {
        if (currentUser?.role === 'Manager') {
            action();
        } else {
            setPendingAction(() => action);
            setIsModalOpen(true);
        }
    }, [currentUser]);

    const handleSuccess = (staff: any) => {
        if (staff.role === 'Manager') {
            setIsModalOpen(false);
            if (pendingAction) {
                pendingAction();
                setPendingAction(null);
            }
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setPendingAction(null);
    };

    const ManagerAuthModal = () => (
        <>
            {isModalOpen && (
                <PinCodeModal
                    requireManager={true}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            )}
        </>
    );

    return {
        checkManager,
        ManagerAuthModal
    };
};
