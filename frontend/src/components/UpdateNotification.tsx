import React, { useEffect, useState } from 'react';
import { CheckForUpdate, DownloadAndInstallUpdate } from '../../wailsjs/go/main/App';
import { services } from '../../wailsjs/go/models';

const UpdateNotification: React.FC = () => {
    const [updateInfo, setUpdateInfo] = useState<services.UpdateInfo | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const check = async () => {
            try {
                const skipCheck = await window.go.main.App.GetSetting('SkipUpdateCheck');
                if (skipCheck === 'true') {
                    console.log("Auto-update check is disabled");
                    return;
                }

                const info = await CheckForUpdate();
                if (info) {
                    setUpdateInfo(info);
                }
            } catch (err) {
                console.error("Update check failed", err);
            }
        };

        const timeoutId = setTimeout(check, 3000); // Check after 3 seconds
        return () => clearTimeout(timeoutId);
    }, []);

    const handleUpdate = async () => {
        if (!updateInfo) return;
        setIsUpdating(true);
        setError(null);
        try {
            await DownloadAndInstallUpdate(updateInfo.url);
        } catch (err) {
            console.error("Update failed", err);
            setError("Update failed. Please try again later.");
            setIsUpdating(false);
        }
    };

    if (!updateInfo) return null;

    return (
        <div className="update-notification-overlay">
            <div className="update-notification-card">
                <div className="update-header">
                    <h3>Update Available</h3>
                    <span className="version-tag">v{updateInfo.version}</span>
                </div>
                <div className="update-body">
                    <p>{updateInfo.description || "A new version of MWinPOS is available. Would you like to update now?"}</p>
                </div>
                {error && <div className="update-error">{error}</div>}
                <div className="update-actions">
                    <button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className="btn-update"
                    >
                        {isUpdating ? (
                            <>
                                <span className="spinner"></span>
                                Updating...
                            </>
                        ) : 'Update Now'}
                    </button>
                    <button
                        onClick={() => setUpdateInfo(null)}
                        className="btn-later"
                        disabled={isUpdating}
                    >
                        Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateNotification;
