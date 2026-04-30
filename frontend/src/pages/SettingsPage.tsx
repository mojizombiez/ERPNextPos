import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, RefreshCw, CheckCircle, AlertCircle, Lock, Palette, Printer, Barcode, Languages, Monitor, Trash2, Database, Download, Upload, PlaySquare, Plus, X, FolderOpen } from 'lucide-react';
import AdminAuthWrapper from '../components/AdminAuthWrapper';
import { useModal } from '../context/ModalContext';
import { useTranslation } from 'react-i18next';
import HelpTooltip from '../components/HelpTooltip';

const SettingsPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { showModal } = useModal();
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
    const [apiUrl, setApiUrl] = useState('');
    const [company, setCompany] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [cashierPrinter, setCashierPrinter] = useState('');
    const [kitchenPrinter, setKitchenPrinter] = useState('');
    const [useSamePrinter, setUseSamePrinter] = useState(false);
    const [syncInterval, setSyncInterval] = useState('5');
    const [syncBatchSize, setSyncBatchSize] = useState('5');
    const [autoLockTimeout, setAutoLockTimeout] = useState('300');
    const [masterPin, setMasterPin] = useState('');
    const [updateUrl, setUpdateUrl] = useState('');
    const [activeTab, setActiveTab] = useState<'general' | 'connection' | 'security' | 'devices' | 'appearance' | 'payments' | 'advertising'>('general');
    const [loading, setLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [testMessage, setTestMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });
    const [loginMessage, setLoginMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatusText, setSyncStatusText] = useState('');
    const [skipUpdateCheck, setSkipUpdateCheck] = useState(false);
    const [activeTheme, setActiveTheme] = useState('theme-midnight');
    const [detectedPrinters, setDetectedPrinters] = useState<string[]>([]);
    const [cashierStatus, setCashierStatus] = useState<string | null>(null);
    const [kitchenStatus, setKitchenStatus] = useState<string | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [isDetectingScreens, setIsDetectingScreens] = useState(false);
    const [detectedScreens, setDetectedScreens] = useState<any[]>([]);
    const [enableCustomerDisplay, setEnableCustomerDisplay] = useState(false);
    const [fullScreenMode, setFullScreenMode] = useState(false);
    const [appMode, setAppMode] = useState<'online' | 'standalone'>('online');
    const [scanLog, setScanLog] = useState<{ code: string, time: string, source: string }[]>([]);
    const [lastScan, setLastScan] = useState('');
    const [keyTimes, setKeyTimes] = useState<number[]>([]);
    const [selectedMonitor, setSelectedMonitor] = useState(-1);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [warehouse, setWarehouse] = useState('');
    const [modes, setModes] = useState<any[]>([]);
    const [posProfiles, setPosProfiles] = useState<string[]>([]);
    const [posProfile, setPosProfile] = useState('');
    const [writeOffAccount, setWriteOffAccount] = useState('');
    const [isFetchingWarehouses, setIsFetchingWarehouses] = useState(false);
    const [isFetchingProfiles, setIsFetchingProfiles] = useState(false);
    const [priceLists, setPriceLists] = useState<string[]>([]);
    const [priceList, setPriceList] = useState('');
    const [isFetchingPriceLists, setIsFetchingPriceLists] = useState(false);
    const [currentAppVersion, setCurrentAppVersion] = useState<string>('');
    const [latestUpdate, setLatestUpdate] = useState<any>(null);
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [isUpdatingApp, setIsUpdatingApp] = useState(false);
    const [updateMessage, setUpdateMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });
    const [showHistory, setShowHistory] = useState(false);
    const [debugMode, setDebugMode] = useState(false);
    const [selectedFont, setSelectedFont] = useState('inter');
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState<any>(null);
    const [promptPayIdInput, setPromptPayIdInput] = useState('');
    const [adVideoFolder, setAdVideoFolder] = useState('');
    const [adVideoLinks, setAdVideoLinks] = useState<string[]>([]);
    const [adLinkInput, setAdLinkInput] = useState('');
    const [adPlaybackMode, setAdPlaybackMode] = useState<'sequence' | 'random'>('sequence');

    const thaiFonts = [
        { id: 'inter', name: 'Default (Inter)', family: "'Inter', system-ui, -apple-system, sans-serif", source: 'local' },
        { id: 'kanit', name: 'Kanit', family: "'Kanit', sans-serif", source: 'local' },
        { id: 'prompt', name: 'Prompt', family: "'Prompt', sans-serif", source: 'local' },
        { id: 'noto-sans-thai', name: 'Noto Sans Thai', family: "'Noto Sans Thai', sans-serif", source: 'local' },
        { id: 'chakra-petch', name: 'Chakra Petch', family: "'Chakra Petch', sans-serif", source: 'local' },
        { id: 'sarabun', name: 'TH Sarabun New', family: "'TH Sarabun New', sans-serif", source: 'local' },
        { id: 'sukhumvit', name: 'Sukhumvit Set', family: "'Sukhumvit Set', 'Helvetica Neue', Helvetica, Arial, sans-serif", source: 'system' },
    ];

    const themes = [
        // Dark Themes
        { id: 'theme-midnight', name: 'Midnight', primary: '#8b5cf6', bg: '#0f172a', type: 'dark' },
        { id: 'theme-amethyst', name: 'Amethyst', primary: '#d946ef', bg: '#1e1b4b', type: 'dark' },
        { id: 'theme-emerald', name: 'Emerald', primary: '#10b981', bg: '#064e3b', type: 'dark' },
        { id: 'theme-oceanic', name: 'Oceanic', primary: '#0ea5e9', bg: '#0c4a6e', type: 'dark' },
        { id: 'theme-crimson', name: 'Crimson', primary: '#f43f5e', bg: '#450a0a', type: 'dark' },
        { id: 'theme-frost', name: 'Frost', primary: '#22d3ee', bg: '#083344', type: 'dark' },
        { id: 'theme-lava', name: 'Lava', primary: '#ef4444', bg: '#18181b', type: 'dark' },
        { id: 'theme-cyberpunk', name: 'Cyberpunk', primary: '#ff00ff', bg: '#000000', type: 'dark' },
        { id: 'theme-coffee', name: 'Coffee', primary: '#d97706', bg: '#292524', type: 'dark' },
        { id: 'theme-slate', name: 'Slate', primary: '#38bdf8', bg: '#334155', type: 'dark' },

        // Light Themes
        { id: 'theme-minimal', name: 'Minimal', primary: '#334155', bg: '#f8fafc', type: 'light' },
        { id: 'theme-snow', name: 'Snow', primary: '#0ea5e9', bg: '#ffffff', type: 'light' },
        { id: 'theme-sand', name: 'Sand', primary: '#92400e', bg: '#fefcfb', type: 'light' },
        { id: 'theme-mint', name: 'Mint', primary: '#10b981', bg: '#f0fdf4', type: 'light' },
        { id: 'theme-rose', name: 'Rose', primary: '#f43f5e', bg: '#fff1f2', type: 'light' },
        { id: 'theme-sky', name: 'Sky', primary: '#0284c7', bg: '#f0f9ff', type: 'light' },
        { id: 'theme-lilac', name: 'Lilac', primary: '#7c3aed', bg: '#f5f3ff', type: 'light' },
        { id: 'theme-citrus', name: 'Citrus', primary: '#d97706', bg: '#fffbeb', type: 'light' },
        { id: 'theme-pearl', name: 'Pearl', primary: '#64748b', bg: '#fcfcfd', type: 'light' },
        { id: 'theme-forest-light', name: 'Forest', primary: '#4d7c0f', bg: '#f7fee7', type: 'light' },
        { id: 'theme-makro', name: 'Makro', primary: '#e10600', bg: '#f5f5f5', type: 'light' },
    ];

    const loadSettings = async () => {
        try {
            const wh = await window.go.main.App.GetSetting('Warehouse');
            const url = await window.go.main.App.GetSetting('ApiUrl');
            const comp = await window.go.main.App.GetSetting('Company');
            const uName = await window.go.main.App.GetSetting('UserName');
            const pwd = await window.go.main.App.GetSetting('Password');
            const cpName = await window.go.main.App.GetSetting('CashierPrinter');
            const kpName = await window.go.main.App.GetSetting('KitchenPrinter');
            const oldPrinter = await window.go.main.App.GetSetting('PrinterName');
            const interval = await window.go.main.App.GetSetting('SyncIntervalSeconds');
            const batch = await window.go.main.App.GetSetting('SyncBatchSize');
            const lockTime = await window.go.main.App.GetSetting('AutoLockSeconds');
            const mPin = await window.go.main.App.GetSetting('MasterPin');
            const theme = await window.go.main.App.GetSetting('ActiveTheme');
            const lang = await window.go.main.App.GetSetting('SelectedLanguage');
            const upUrl = await window.go.main.App.GetSetting('UpdateUrl');
            const debug = await window.go.main.App.GetSetting('DebugMode');
            const font = await window.go.main.App.GetSetting('SelectedFont');

            setWarehouse(wh || '');
            setApiUrl(url || '');
            setCompany(comp || '');
            setUsername(uName);
            setPassword(pwd);
            const skipUpd = await window.go.main.App.GetSetting('SkipUpdateCheck');
            setSkipUpdateCheck(skipUpd === 'true');
            setUpdateUrl(upUrl || 'https://nuget.moltothailand.com/erpnext/windows/update.json');
            const isSame = await window.go.main.App.GetSetting('UseSamePrinter');
            setCashierPrinter(cpName || oldPrinter || '');
            setKitchenPrinter(kpName || '');
            setUseSamePrinter(isSame === 'true');
            setSyncInterval(interval || '5');
            setSyncBatchSize(batch || '5');
            setAutoLockTimeout(lockTime || '300');
            setMasterPin(mPin || '123456');
            setActiveTheme(theme || 'theme-midnight');
            setSelectedLanguage(lang || i18n.language || 'en');
            const opMode = await window.go.main.App.GetSetting('AppMode');
            setAppMode((opMode as any) || 'online');
            const enableDisp = await window.go.main.App.GetSetting('EnableCustomerDisplay');
            setEnableCustomerDisplay(enableDisp === 'true');
            const fsMode = await window.go.main.App.GetSetting('FullScreenMode');
            setFullScreenMode(fsMode === 'true');
            const monitorIdx = await window.go.main.App.GetSetting('CustomerScreenNumber');
            setSelectedMonitor(monitorIdx ? parseInt(monitorIdx) : -1);
            const pProfile = await window.go.main.App.GetSetting('PosProfile');
            setPosProfile(pProfile || '');
            const woa = await window.go.main.App.GetSetting('WriteOffAccount');
            setWriteOffAccount(woa || '');
            const pList = await window.go.main.App.GetSetting('Cached_PriceList');
            setPriceList(pList || 'Standard Selling');
            setDebugMode(debug === 'true');
            setSelectedFont(font || 'inter');
            const version = await (window.go.main.App as any).GetAppVersion();
            setCurrentAppVersion(version || 'Unknown');

            const videoFolder = await window.go.main.App.GetSetting('AdVideoFolder');
            const videoLinks = await window.go.main.App.GetSetting('AdVideoLinks');
            const playbackMode = await window.go.main.App.GetSetting('AdPlaybackMode');

            setAdVideoFolder(videoFolder || '');
            if (videoLinks) {
                try {
                    setAdVideoLinks(JSON.parse(videoLinks));
                } catch (e) { setAdVideoLinks([]); }
            }
            setAdPlaybackMode((playbackMode as any) || 'sequence');
        } catch (err) {
            console.error("Failed to load settings", err);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            await window.go.main.App.SaveSetting('Warehouse', warehouse, 3);
            await window.go.main.App.SaveSetting('Company', company, 3);
            await window.go.main.App.SaveSetting('ApiUrl', apiUrl, 3);
            await window.go.main.App.SaveSetting('UserName', username, 3);
            await window.go.main.App.SaveSetting('Password', password, 3);
            await window.go.main.App.SaveSetting('CashierPrinter', cashierPrinter, 3);
            await window.go.main.App.SaveSetting('KitchenPrinter', useSamePrinter ? cashierPrinter : kitchenPrinter, 3);
            await window.go.main.App.SaveSetting('UseSamePrinter', useSamePrinter.toString(), 6);
            await window.go.main.App.SaveSetting('PrinterName', cashierPrinter, 3); // Keep sync for now
            await window.go.main.App.SaveSetting('SyncIntervalSeconds', syncInterval, 1);
            await window.go.main.App.SaveSetting('SyncBatchSize', syncBatchSize, 1);
            await window.go.main.App.SaveSetting('AutoLockSeconds', autoLockTimeout, 1);
            await window.go.main.App.SaveSetting('MasterPin', masterPin, 3);
            await window.go.main.App.SaveSetting('ActiveTheme', activeTheme, 3);
            await window.go.main.App.SaveSetting('AppMode', appMode, 3);
            await window.go.main.App.SaveSetting('SelectedLanguage', selectedLanguage, 3);
            await window.go.main.App.SaveSetting('EnableCustomerDisplay', enableCustomerDisplay.toString(), 6);
            await window.go.main.App.SaveSetting('FullScreenMode', fullScreenMode.toString(), 6);
            await window.go.main.App.SaveSetting('UpdateUrl', updateUrl, 3);
            await window.go.main.App.SaveSetting('CustomerScreenNumber', selectedMonitor.toString(), 3);
            await window.go.main.App.SaveSetting('PosProfile', posProfile, 3);
            await window.go.main.App.SaveSetting('WriteOffAccount', writeOffAccount, 3);
            await window.go.main.App.SaveSetting('SkipUpdateCheck', skipUpdateCheck ? 'true' : 'false', 6);
            await window.go.main.App.SaveSetting('Cached_PriceList', priceList, 3);
            await window.go.main.App.SaveSetting('DebugMode', debugMode.toString(), 6);
            await window.go.main.App.SaveSetting('SelectedFont', selectedFont, 3);
            await window.go.main.App.SaveSetting('AdVideoFolder', adVideoFolder, 3);
            await window.go.main.App.SaveSetting('AdVideoLinks', JSON.stringify(adVideoLinks), 5); // DataTypeJSON
            await window.go.main.App.SaveSetting('AdPlaybackMode', adPlaybackMode, 3);

            // Apply language immediately if it changed
            if (i18n.language !== selectedLanguage) {
                await i18n.changeLanguage(selectedLanguage);
            }

            // Sync Customer Display (re-trigger to apply theme/settings changes)
            if (enableCustomerDisplay) {
                window.go.main.App.OpenCustomerDisplay(selectedMonitor);
            }

            // Notify header and other listeners
            // @ts-ignore
            if (window.runtime && window.runtime.EventsEmit) {
                // @ts-ignore
                window.runtime.EventsEmit('settings-updated');
            }

            showModal({
                title: t('common.success'),
                message: t('settings.save_success_msg', { defaultValue: 'Your settings have been saved successfully!' }),
                type: 'success',
                onConfirm: () => {
                    // No reload needed, as most settings are applied dynamically.
                    // If a reload is ever needed, it should be handled specifically.
                }
            });
        } catch (err) {
            showModal({
                title: 'Save Failed',
                message: 'There was an error saving your settings. Please try again.',
                type: 'error'
            });
        }
    };

    const handleHardReset = () => {
        showModal({
            title: t('settings.danger_zone.confirm_title'),
            message: t('settings.danger_zone.confirm_msg'),
            type: 'error',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await (window.go.main.App as any).HardReset();
                } catch (err) {
                    console.error("Hard reset failed", err);
                    setLoading(false);
                    showModal({
                        title: 'Reset Failed',
                        message: 'Could not perform hard reset. Please try deleting the data folder manually.',
                        type: 'error'
                    });
                }
            }
        });
    };

    const handleClearData = () => {
        showModal({
            title: 'Clear All Data?',
            message: 'This will delete all products, orders, and customers but KEEP your settings (API URL, Branch, etc). This cannot be undone.',
            type: 'error',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await (window.go.main.App as any).ClearAllData();
                    setLoading(false);
                    showModal({
                        title: 'Data Cleared',
                        message: 'All synced and local data has been removed. Settings were preserved.',
                        type: 'success',
                        onConfirm: () => window.location.reload()
                    });
                } catch (err) {
                    console.error("Clear data failed", err);
                    setLoading(false);
                    showModal({
                        title: 'Clear Failed',
                        message: 'There was an error clearing the data.',
                        type: 'error'
                    });
                }
            }
        });
    };

    const handleThemeSelect = (themeId: string) => {
        setActiveTheme(themeId);
        // Dispatch live preview event for MainLayout
        const event = new CustomEvent('theme-preview', { detail: { themeId } });
        window.dispatchEvent(event);
    };

    const testConnection = async () => {
        if (!apiUrl) {
            setTestMessage({ text: 'Please enter an API URL first', type: 'error' });
            return;
        }

        setIsTesting(true);
        setTestMessage({ text: 'Testing...', type: null });

        try {
            const res = await window.go.main.App.CheckApiUrl(apiUrl);
            setTestMessage({ text: t('settings.connection.saved'), type: 'success' });
        } catch (err: any) {
            setTestMessage({ text: err.toString(), type: 'error' });
        } finally {
            setIsTesting(false);
        }
    };

    const testLogin = async () => {
        if (!apiUrl || !username || !password) {
            setLoginMessage({ text: 'Please enter API URL, Username and Password', type: 'error' });
            return;
        }

        setIsLoggingIn(true);
        setLoginMessage({ text: 'Logging in...', type: null });

        try {
            // Login will also save settings if successful
            const res = await window.go.main.App.Login(username, password);
            setLoginMessage({ text: res, type: 'success' });
        } catch (err: any) {
            setLoginMessage({ text: err.toString(), type: 'error' });
        } finally {
            setIsLoggingIn(false);
        }
    };

    const runManualSync = async () => {
        setIsSyncing(true);
        try {
            await window.go.main.App.SyncAllData();
            showModal({
                title: 'Sync Complete',
                message: 'Data synchronization completed successfully!',
                type: 'success'
            });
        } catch (err: any) {
            showModal({
                title: 'Sync Failed',
                message: 'Synchronization failed: ' + err.toString(),
                type: 'error'
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const runPreCache = async () => {
        setIsSyncing(true);
        setSyncStatusText('Initializing...');
        try {
            await window.go.main.App.SyncAllData();

            // Start polling for status
            const interval = setInterval(async () => {
                try {
                    const status = await window.go.main.App.GetSyncStatus();
                    if (status.isSyncing) {
                        setSyncStatusText(status.syncStatus || 'Syncing...');
                    } else {
                        clearInterval(interval);
                        setIsSyncing(false);
                        setSyncStatusText('');
                        showModal({
                            title: 'Pre-caching Complete',
                            message: 'All data has been successfully downloaded for offline use.',
                            type: 'success'
                        });
                    }
                } catch (err) {
                    console.error("Status check failed", err);
                }
            }, 1000);
        } catch (err: any) {
            setIsSyncing(false);
            setSyncStatusText('');
            showModal({
                title: 'Pre-cache Failed',
                message: 'Could not start pre-caching: ' + err.toString(),
                type: 'error'
            });
        }
    };

    const detectPrinters = async () => {
        setIsDetecting(true);
        try {
            const list = await window.go.main.App.GetPrinters();
            setDetectedPrinters(list || []);
        } catch (err) {
            console.error("Failed to detect printers", err);
        } finally {
            setIsDetecting(false);
        }
    };

    const detectScreens = async () => {
        setIsDetectingScreens(true);
        try {
            const screens = await window.go.main.App.GetScreens();
            setDetectedScreens(screens || []);
        } catch (err) {
            console.error("Failed to detect screens", err);
        } finally {
            setIsDetectingScreens(false);
        }
    };

    const launchCustomerDisplay = () => {
        window.go.main.App.OpenCustomerDisplay(selectedMonitor);
    };

    const closeCustomerDisplay = () => {
        window.go.main.App.CloseCustomerDisplay();
    };

    const fetchWarehouses = async () => {
        setIsFetchingWarehouses(true);
        try {
            const list = await (window.go.main.App as any).GetWarehouses();
            setWarehouses(list || []);
        } catch (err) {
            console.error("Failed to fetch warehouses", err);
            setTestMessage({ text: 'Failed to fetch warehouses: ' + err, type: 'error' });
        } finally {
            setIsFetchingWarehouses(false);
        }
    };

    const fetchModes = async () => {
        try {
            const list = await (window.go.main.App as any).GetModeOfPayments();
            setModes(list || []);
        } catch (err) { console.error(err); }
    };

    const fetchPaymentMethods = async () => {
        try {
            const list = await window.go.main.App.GetPaymentMethods();
            setPaymentMethods(list || []);
        } catch (err) { console.error("Failed to fetch payment methods", err); }
    };

    const savePaymentMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPayment.id) {
                await window.go.main.App.UpdatePaymentMethod(editingPayment);
            } else {
                await window.go.main.App.AddPaymentMethod(editingPayment);
            }
            setShowPaymentModal(false);
            setEditingPayment(null);
            fetchPaymentMethods();
            showModal({ title: t('common.success'), message: 'Payment method saved successfully.', type: 'success' });
        } catch (err) {
            showModal({ title: t('common.error'), message: 'Failed to save payment method: ' + err, type: 'error' });
        }
    };

    const deletePaymentMethod = async (id: number) => {
        showModal({
            title: t('common.confirm'),
            message: t('settings.payments.delete_confirm'),
            type: 'error',
            onConfirm: async () => {
                try {
                    await window.go.main.App.DeletePaymentMethod(id);
                    fetchPaymentMethods();
                } catch (err) {
                    console.error("Failed to delete payment method", err);
                }
            }
        });
    };

    const handleGenerateTemplate = async () => {
        if (!promptPayIdInput) return;
        try {
            const template = await window.go.main.App.GeneratePromptPayTemplate(promptPayIdInput);
            setEditingPayment({ ...editingPayment, qrTemplate: template });
            setPromptPayIdInput('');
        } catch (err) {
            console.error("Failed to generate template", err);
        }
    };

    const fetchPriceLists = async () => {
        setIsFetchingPriceLists(true);
        try {
            const list = await (window.go.main.App as any).GetPriceLists();
            setPriceLists(list || []);
        } catch (err) {
            console.error("Failed to fetch price lists", err);
        } finally {
            setIsFetchingPriceLists(false);
        }
    };

    const fetchPosProfiles = async () => {
        setIsFetchingProfiles(true);
        try {
            const list = await (window.go.main.App as any).GetPosProfiles();
            setPosProfiles(list || []);
        } catch (err) {
            console.error("Failed to fetch POS profiles", err);
        } finally {
            setIsFetchingProfiles(false);
        }
    };

    const checkForUpdates = async () => {
        setIsCheckingUpdate(true);
        setUpdateMessage({ text: 'Checking for updates...', type: 'info' });
        try {
            const info = await (window.go.main.App as any).CheckForUpdate();
            if (info && info.version) {
                setLatestUpdate(info);
                setUpdateMessage({ text: `Update available: v${info.version}`, type: 'success' });
            } else {
                setLatestUpdate(null);
                setUpdateMessage({ text: 'You are on the latest version.', type: 'success' });
            }
        } catch (err: any) {
            setUpdateMessage({ text: 'Update check failed: ' + err.toString(), type: 'error' });
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    const installUpdate = async () => {
        if (!latestUpdate || !latestUpdate.url) return;
        setIsUpdatingApp(true);
        setUpdateMessage({ text: 'Downloading update... Please wait. The app will restart automatically.', type: 'info' });
        try {
            await (window.go.main.App as any).DownloadAndInstallUpdate(latestUpdate.url);
        } catch (err: any) {
            setUpdateMessage({ text: 'Failed to install update: ' + err.toString(), type: 'error' });
            setIsUpdatingApp(false);
        }
    };

    const checkStatus = async (type: 'cashier' | 'kitchen') => {
        const printerName = type === 'cashier' ? cashierPrinter : kitchenPrinter;
        if (!printerName) return;

        try {
            const status = await window.go.main.App.CheckPrinterStatus(printerName);
            if (type === 'cashier') setCashierStatus(status);
            else setKitchenStatus(status);
        } catch (err) {
            console.error("Failed to check printer status", err);
            if (type === 'cashier') setCashierStatus('Offline');
            else setKitchenStatus('Offline');
        }
    };

    const handleScanField = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const now = performance.now();

        if (e.key === 'Enter') {
            const code = (e.target as HTMLInputElement).value;
            if (code) {
                // Calculate average time between keystrokes
                // Most scanners send keys every 2-10ms. Humans are > 50ms.
                const intervals = [];
                for (let i = 1; i < keyTimes.length; i++) {
                    intervals.push(keyTimes[i] - keyTimes[i - 1]);
                }
                const avgSpeed = intervals.length > 0 ? intervals.reduce((a, b) => a + b) / intervals.length : 100;

                // If average speed is less than 30ms per char, it's almost certainly a hardware scanner
                const isScanner = avgSpeed < 30 || code.length > 5 && avgSpeed < 50;
                const source = isScanner ? 'Hardware Scanner' : 'Manual Keyboard';

                setLastScan(code);
                setScanLog(prev => [{ code, time: new Date().toLocaleTimeString(), source }, ...prev.slice(0, 9)]);
                (e.target as HTMLInputElement).value = '';
                setKeyTimes([]); // Reset for next scan
            }
        } else {
            // Log timestamp of each key press to calculate speed
            setKeyTimes(prev => [...prev, now].slice(-50)); // Keep last 50 for long barcodes
        }
    };

    useEffect(() => {
        const applyFont = (fontId: string) => {
            const font = thaiFonts.find(f => f.id === fontId);
            if (!font) return;
            document.documentElement.style.setProperty('--font-family', font.family);
        };
        applyFont(selectedFont);
    }, [selectedFont]);

    useEffect(() => {
        loadSettings();
        detectPrinters();
        detectScreens();
        fetchWarehouses();
        fetchModes();
        fetchPaymentMethods();
        fetchPosProfiles();
        fetchPriceLists();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading settings...</div>;

    return (
        <AdminAuthWrapper>
            <div className="flex flex-col gap-6 p-4 h-full overflow-hidden">
                <header className="flex justify-between items-end">
                    <div>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>{t('settings.title')}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{t('settings.subtitle')}</p>
                    </div>
                    <button className="btn rounded-full" style={{ padding: '0.8rem 2rem' }} onClick={saveSettings}>
                        {t('common.save')}
                    </button>
                </header>

                {/* Tab Bar */}
                <div className="flex gap-4 p-2 bg-[var(--glass-bg)] rounded-[24px] border border-[var(--border-color)] self-start shadow-xl">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-10 py-5 rounded-full font-black text-lg transition-all duration-300 ${activeTab === 'general' ? 'bg-[var(--accent-gradient)] text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] scale-105' : 'text-gray-500 hover:bg-white/50 hover:text-[var(--text-primary)]'}`}
                    >
                        {t('settings.tabs.general')}
                    </button>
                    <button
                        onClick={() => setActiveTab('connection')}
                        className={`px-10 py-5 rounded-full font-black text-lg transition-all duration-300 ${activeTab === 'connection' ? 'bg-[var(--accent-gradient)] text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] scale-105' : 'text-gray-500 hover:bg-white/50 hover:text-[var(--text-primary)]'}`}
                    >
                        {t('settings.tabs.connection', 'Connection')}
                    </button>
                    <button
                        onClick={() => setActiveTab('devices')}
                        className={`px-10 py-5 rounded-full font-black text-lg transition-all duration-300 ${activeTab === 'devices' ? 'bg-[var(--accent-gradient)] text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] scale-105' : 'text-gray-500 hover:bg-white/50 hover:text-[var(--text-primary)]'}`}
                    >
                        {t('settings.tabs.devices')}
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-10 py-5 rounded-full font-black text-lg transition-all duration-300 ${activeTab === 'security' ? 'bg-[var(--accent-gradient)] text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] scale-105' : 'text-gray-500 hover:bg-white/50 hover:text-[var(--text-primary)]'}`}
                    >
                        {t('settings.tabs.security')}
                    </button>
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`px-10 py-5 rounded-full font-black text-lg transition-all duration-300 ${activeTab === 'appearance' ? 'bg-[var(--accent-gradient)] text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] scale-105' : 'text-gray-500 hover:bg-white/50 hover:text-[var(--text-primary)]'}`}
                    >
                        {t('settings.tabs.appearance')}
                    </button>
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`px-10 py-5 rounded-full font-black text-lg transition-all duration-300 ${activeTab === 'payments' ? 'bg-[var(--accent-gradient)] text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] scale-105' : 'text-gray-500 hover:bg-white/50 hover:text-[var(--text-primary)]'}`}
                    >
                        {t('settings.tabs.payments')}
                    </button>
                    <button
                        onClick={() => setActiveTab('advertising')}
                        className={`px-10 py-5 rounded-full font-black text-lg transition-all duration-300 ${activeTab === 'advertising' ? 'bg-[var(--accent-gradient)] text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] scale-105' : 'text-gray-500 hover:bg-white/50 hover:text-[var(--text-primary)]'}`}
                    >
                        {t('settings.tabs.advertising', 'Advertising')}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-bottom-4">
                    {activeTab === 'general' && (
                        <div className="flex flex-col gap-6">

                            <div className="card flex flex-col p-8 bg-[var(--glass-bg)] border-[var(--border-color)] shadow-xl rounded-[32px]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                        <Globe size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">{t('settings.identity.title')} <HelpTooltip titleKey="help.settings_general.title" contentKey="help.settings_general.content" size={14} /></h2>
                                        <p className="text-sm text-gray-400">{t('settings.identity.subtitle')}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>ERPNext Company</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Default company for Sales Invoices</span>
                                        </div>
                                        <input
                                            className="glass"
                                            style={{ padding: '0.8rem 1.2rem', borderRadius: '14px', fontSize: '1rem', border: '2px solid #f1f5f9', width: '100%', maxWidth: '400px' }}
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            placeholder="e.g. My Company"
                                        />
                                    </div>


                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>ERPNext Warehouse</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stock location for this terminal</span>
                                        </div>
                                        <div className="flex gap-3 w-full" style={{ maxWidth: '600px' }}>
                                            <select
                                                className="glass flex-1"
                                                style={{ padding: '0.8rem 1.2rem', borderRadius: '14px', fontSize: '1rem', border: '2px solid #f1f5f9' }}
                                                value={warehouse}
                                                onChange={(e) => setWarehouse(e.target.value)}
                                            >
                                                <option value="">-- Select Warehouse --</option>
                                                {warehouses.map(w => (
                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                className="btn-icon p-3"
                                                onClick={fetchWarehouses}
                                                disabled={isFetchingWarehouses}
                                                title="Refresh Warehouses"
                                            >
                                                <RefreshCw size={18} className={isFetchingWarehouses ? 'animate-spin' : ''} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* POS Profile Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>POS Profile</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Associate local sessions with ERPNext Profile</span>
                                        </div>
                                        <div className="flex gap-3 w-full" style={{ maxWidth: '600px' }}>
                                            <select
                                                className="glass flex-1"
                                                style={{ padding: '0.8rem 1.2rem', borderRadius: '14px', fontSize: '1rem', border: '2px solid #f1f5f9' }}
                                                value={posProfile}
                                                onChange={async (e) => {
                                                    const profileName = e.target.value;
                                                    setPosProfile(profileName);
                                                    if (profileName) {
                                                        try {
                                                            const details = await (window.go.main.App as any).GetPosProfileDetails(profileName);
                                                            if (details) {
                                                                if (details.warehouse) setWarehouse(details.warehouse);
                                                                if (details.company) setCompany(details.company);

                                                                // Cache payment methods immediately
                                                                if (details.payments) {
                                                                    await window.go.main.App.SaveSetting('Cached_PosProfilePayments', details.payments, 5); // 5 for DataTypeJSON
                                                                }

                                                                // Cache taxes immediately
                                                                if (details.taxes) {
                                                                    await window.go.main.App.SaveSetting('Cached_PosProfileTaxes', details.taxes, 5); // 5 for DataTypeJSON
                                                                }

                                                                showModal({
                                                                    title: 'POS Profile Linked',
                                                                    message: `Successfully linked to "${profileName}". Warehouse, Company, Payment Methods, and Taxes have been updated.`,
                                                                    type: 'info'
                                                                });
                                                            }
                                                        } catch (err) {
                                                            console.error("Failed to fetch profile details", err);
                                                        }
                                                    }
                                                }}
                                            >
                                                <option value="">-- No Profile (Drawer Sync Disabled) --</option>
                                                {posProfiles.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                            <button
                                                className="btn-icon p-3"
                                                onClick={fetchPosProfiles}
                                                disabled={isFetchingProfiles}
                                                title="Refresh Profiles"
                                            >
                                                <RefreshCw size={18} className={isFetchingProfiles ? 'animate-spin' : ''} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price List Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Selling Price List</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prices for products will be fetched from this list (Wholesale/Retail)</span>
                                        </div>
                                        <div className="flex gap-3 w-full" style={{ maxWidth: '600px' }}>
                                            <select
                                                className="glass flex-1"
                                                style={{ padding: '0.8rem 1.2rem', borderRadius: '14px', fontSize: '1rem', border: '2px solid #f1f5f9' }}
                                                value={priceList}
                                                onChange={(e) => setPriceList(e.target.value)}
                                            >
                                                <option value="">-- No Price List (Standard) --</option>
                                                {priceLists.map(pl => (
                                                    <option key={pl} value={pl}>{pl}</option>
                                                ))}
                                            </select>
                                            <button
                                                className="btn-icon p-3"
                                                onClick={fetchPriceLists}
                                                disabled={isFetchingPriceLists}
                                                title="Refresh Price Lists"
                                            >
                                                <RefreshCw size={18} className={isFetchingPriceLists ? 'animate-spin' : ''} />
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Write-Off Account</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>GL account to absorb rounding differences (กำไร/ขาดทุนปัดเศษ)</span>
                                        </div>
                                        <input
                                            className="glass"
                                            style={{ padding: '0.8rem 1.2rem', borderRadius: '14px', fontSize: '1rem', border: '2px solid #f1f5f9', width: '100%', maxWidth: '400px' }}
                                            value={writeOffAccount}
                                            onChange={(e) => setWriteOffAccount(e.target.value)}
                                            placeholder="e.g. Write Off - TH"
                                        />
                                    </div>

                                    {/* Operation Mode Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '1.5rem 0' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>{t('settings.identity.mode')}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('settings.identity.mode_desc')}</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setAppMode('online')}
                                                className={`flex-1 max-w-[200px] p-4 rounded-2xl flex flex-col gap-1 transition-all border-2 ${appMode === 'online' ? 'bg-blue-500/10 border-blue-500' : 'bg-transparent border-[var(--border-color)] opacity-60'}`}
                                            >
                                                <span className="font-bold text-sm">{t('settings.identity.online')}</span>
                                                <span className="text-sm opacity-70">{t('settings.identity.online_desc')}</span>
                                            </button>
                                            <button
                                                onClick={() => setAppMode('standalone')}
                                                className={`flex-1 max-w-[200px] p-4 rounded-2xl flex flex-col gap-1 transition-all border-2 ${appMode === 'standalone' ? 'bg-amber-500/10 border-amber-500' : 'bg-transparent border-[var(--border-color)] opacity-60'}`}
                                            >
                                                <span className="font-bold text-sm">{t('settings.identity.standalone')}</span>
                                                <span className="text-sm opacity-70">{t('settings.identity.standalone_desc')}</span>
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>


                            {/* Advanced Settings Card */}
                            <div className="card flex flex-col p-8 bg-[var(--glass-bg)] border-[var(--border-color)] shadow-xl rounded-[32px] mt-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Advanced Settings</h2>
                                        <p className="text-sm text-gray-400">Developer tools and diagnostic options</p>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '1rem 0' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Debug Mode</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Show console logs for troubleshooting</span>
                                        </div>
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => setDebugMode(!debugMode)}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${debugMode ? 'bg-purple-500' : 'bg-slate-200'}`}
                                            >
                                                <span
                                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${debugMode ? 'translate-x-7' : 'translate-x-1'}`}
                                                />
                                            </button>
                                            <span className="ml-3 font-bold text-sm text-slate-600">{debugMode ? 'Enabled' : 'Disabled'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Application Updates Card */}

                            <div className="card flex flex-col p-8 bg-[var(--glass-bg)] backdrop-blur-xl border-[var(--border-color)] shadow-xl rounded-[32px] mt-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                        <RefreshCw size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{t('settings.updates.title')}</h2>
                                        <p className="text-sm text-gray-400">{t('settings.updates.subtitle_desc', { defaultValue: 'Configure remote update server' })}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <div
                                        onClick={() => setSkipUpdateCheck(!skipUpdateCheck)}
                                        style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                                    >
                                        <div className="flex flex-col">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Skip Auto-Update</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Disable update check on startup</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    display: 'inline-flex',
                                                    height: '1.5rem',
                                                    width: '2.75rem',
                                                    alignItems: 'center',
                                                    borderRadius: '9999px',
                                                    transition: 'background-color 0.2s',
                                                    backgroundColor: skipUpdateCheck ? 'var(--accent-primary)' : '#cbd5e1',
                                                    border: '2px solid rgba(0,0,0,0.05)',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        height: '1rem',
                                                        width: '1rem',
                                                        transform: skipUpdateCheck ? 'translateX(1.5rem)' : 'translateX(0.25rem)',
                                                        borderRadius: '9999px',
                                                        backgroundColor: 'white',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Manual Update Check */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Current Version</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>MoltoPos v{currentAppVersion}</span>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    onClick={checkForUpdates}
                                                    disabled={isCheckingUpdate || isUpdatingApp}
                                                    className="btn flex items-center gap-2"
                                                    style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', width: 'fit-content' }}
                                                >
                                                    <RefreshCw size={18} className={isCheckingUpdate ? 'animate-spin' : ''} />
                                                    {isCheckingUpdate ? 'Checking...' : 'Check for Updates'}
                                                </button>
                                                
                                                <button 
                                                    onClick={() => setShowHistory(true)}
                                                    disabled={!latestUpdate || !latestUpdate.history}
                                                    className="btn btn-secondary flex items-center gap-2"
                                                    style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', width: 'fit-content' }}
                                                >
                                                    <Lock size={18} />
                                                    View History
                                                </button>

                                                {updateMessage.text && (
                                                    <span className={`text-sm font-semibold flex items-center gap-2 ${
                                                        updateMessage.type === 'success' ? 'text-emerald-500' :
                                                        updateMessage.type === 'error' ? 'text-rose-500' : 'text-blue-500'
                                                    }`}>
                                                        {updateMessage.type === 'success' ? <CheckCircle size={16} /> :
                                                         updateMessage.type === 'error' ? <AlertCircle size={16} /> : null}
                                                        {updateMessage.text}
                                                    </span>
                                                )}
                                            </div>

                                            {latestUpdate && latestUpdate.version && latestUpdate.version !== currentAppVersion && (
                                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-inner">
                                                    <h4 className="font-bold text-lg mb-1 text-blue-600 dark:text-blue-400">Version {latestUpdate.version} is available!</h4>
                                                    <p className="text-sm opacity-80 mb-4">{latestUpdate.description || 'A new update is ready to be installed.'}</p>
                                                    <button 
                                                        onClick={installUpdate}
                                                        disabled={isUpdatingApp}
                                                        className="btn border-none shadow-lg text-white"
                                                        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', padding: '0.8rem 1.5rem', borderRadius: '12px' }}
                                                    >
                                                        {isUpdatingApp ? 'Installing Update...' : 'Download & Install Now'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 400px 1fr', alignItems: 'start', gap: '2rem', padding: '1.5rem 0' }}>
                                        <div className="flex flex-col mt-2">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>{t('settings.updates.endpoint')}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('settings.updates.endpoint_desc')}</span>
                                        </div>
                                        <div className="flex flex-col gap-3 w-100" style={{ maxWidth: '600px' }}>
                                            <input
                                                className="glass"
                                                style={{ padding: '0.8rem 1.2rem', borderRadius: '14px', fontSize: '1rem', border: '2px solid #f1f5f9' }}
                                                value={updateUrl}
                                                onChange={(e) => setUpdateUrl(e.target.value)}
                                                placeholder="https://raw.githubusercontent.com/.../update.json"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="flex flex-col gap-6">
                            <div className="card flex flex-col p-8 bg-[var(--glass-bg)] backdrop-blur-xl border-[var(--border-color)] shadow-xl rounded-[32px]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600">
                                        <Lock size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">Maintenance & Security <HelpTooltip titleKey="help.settings_security.title" contentKey="help.settings_security.content" size={14} /></h2>
                                        <p className="text-sm text-gray-400">Sync behavior and access control</p>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    {appMode === 'online' && (
                                        <>
                                            {/* Sync Row */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Sync Frequency</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Interval between auto-sync attempts (sec)</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    className="glass"
                                                    style={{ padding: '0.8rem 1.2rem', borderRadius: '14px', fontSize: '1rem', border: '2px solid #f1f5f9', width: '160px' }}
                                                    value={syncInterval}
                                                    onChange={(e) => setSyncInterval(e.target.value)}
                                                />
                                            </div>

                                            {/* Batch Size Row */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Batch Size</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Orders sent per sync cycle</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    className="glass"
                                                    style={{ padding: '0.8rem 1.2rem', borderRadius: '14px', fontSize: '1rem', border: '2px solid #f1f5f9', width: '160px' }}
                                                    value={syncBatchSize}
                                                    onChange={(e) => setSyncBatchSize(e.target.value)}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Auto-Lock Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Auto-Lock Timer</span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Seconds of inactivity before locking</span>
                                        </div>
                                        <input
                                            type="number"
                                            className="glass"
                                            style={{ padding: '0.8rem 1.2rem', borderRadius: '14px', fontSize: '1rem', border: '2px solid #fee2e2', width: '160px' }}
                                            value={autoLockTimeout}
                                            onChange={(e) => setAutoLockTimeout(e.target.value)}
                                        />
                                    </div>

                                    {/* Master PIN Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Master Password</span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Restricts access to these settings</span>
                                        </div>
                                        <input
                                            type="password"
                                            className="glass"
                                            style={{ padding: '0.8rem 1.2rem', borderRadius: '14px', fontSize: '1rem', border: '2px solid #fee2e2', width: '100%', maxWidth: '300px' }}
                                            value={masterPin}
                                            onChange={(e) => setMasterPin(e.target.value)}
                                        />
                                    </div>

                                    {appMode === 'online' && (
                                        /* Manual Operations Row */
                                        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '2rem', padding: '2rem 0' }}>
                                            <div className="flex flex-col">
                                                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Manual Sync</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Force update products & items</span>
                                            </div>
                                            <button
                                                className="btn-icon rounded-full"
                                                style={{ background: 'var(--accent-gradient)', color: 'white', fontWeight: 'bold', border: 'none', padding: '1rem 2rem', borderRadius: '9999px', justifyContent: 'center', gap: '0.8rem', width: 'fit-content' }}
                                                onClick={runManualSync}
                                                disabled={isSyncing}
                                            >
                                                <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                                                {isSyncing ? 'Syncing...' : 'Start Full Synchronize'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Danger Zone Card */}
                            <div className="card flex flex-col p-8 bg-red-500/5 backdrop-blur-xl border-red-500/20 shadow-xl rounded-[32px]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-red-600">{t('settings.danger_zone.title')}</h2>
                                        <p className="text-sm text-red-400/60">{t('settings.danger_zone.reset_desc')}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-red-700/80">Clear Transactions & Master Data</span>
                                            <span className="text-sm text-red-600/50">Wipe products, orders, and customers but keep settings.</span>
                                        </div>
                                        <button
                                            onClick={handleClearData}
                                            className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-600 rounded-xl font-bold transition-all border border-red-500/20 flex items-center gap-2"
                                        >
                                            <Trash2 size={18} />
                                            Clear Data
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-red-700/80">{t('settings.danger_zone.reset_button')}</span>
                                            <span className="text-sm text-red-600/50">{t('settings.danger_zone.reset_desc')}</span>
                                        </div>
                                        <button
                                            onClick={handleHardReset}
                                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/30 flex items-center gap-2"
                                        >
                                            <RefreshCw size={18} />
                                            {t('settings.danger_zone.reset_button')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'connection' && (
                        <div className="flex flex-col gap-6">
                            {appMode === 'online' ? (
                                <div className="card flex flex-col p-8 bg-[var(--glass-bg)] backdrop-blur-xl border-[var(--border-color)] shadow-xl rounded-[32px]">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                            <RefreshCw size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold flex items-center gap-2">ERPNext Connection <HelpTooltip titleKey="help.settings_connection.title" contentKey="help.settings_connection.content" size={14} /></h2>
                                            <p className="text-sm text-gray-400">Server endpoints and token authentication</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        {/* API URL Row */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'start', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                            <div className="flex flex-col mt-2">
                                                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>ERPNext URL</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Base URL for data synchronization</span>
                                            </div>
                                            <div className="flex flex-col gap-3 w-100" style={{ maxWidth: '600px' }}>
                                                <div className="flex gap-3">
                                                    <input
                                                        className="glass flex-1"
                                                        style={{ padding: '0.8rem 1.2rem', borderRadius: '14px', fontSize: '1rem', border: '2px solid #f1f5f9' }}
                                                        value={apiUrl}
                                                        onChange={(e) => setApiUrl(e.target.value)}
                                                        placeholder="https://your-erpnext-site.com"
                                                    />
                                                    <button
                                                        className="btn-icon rounded-full"
                                                        style={{ width: '120px', fontSize: '0.9rem', gap: '0.5rem', borderRadius: '9999px', height: '48px' }}
                                                        onClick={testConnection}
                                                        disabled={isTesting}
                                                    >
                                                        {isTesting ? <RefreshCw size={18} className="animate-spin" /> : <Globe size={18} />}
                                                        Test
                                                    </button>
                                                </div>
                                                {testMessage.text && (
                                                    <div className={`flex items-center gap-2 text-sm font-semibold p-3 rounded-xl ${testMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {testMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                                        {testMessage.text}
                                                    </div>
                                                )}
                                            </div>
                                        </div>


                                        {/* Credentials Row */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'start', gap: '2rem', padding: '1.5rem 0' }}>
                                            <div className="flex flex-col mt-2">
                                                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Authentication</span>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>API Keys for ERPNext access</span>
                                            </div>
                                            <div className="flex flex-col gap-4 w-100" style={{ maxWidth: '600px' }}>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-sm font-black text-[var(--text-secondary)] opacity-60 uppercase tracking-widest ml-1">API Key</label>
                                                        <input
                                                            className="glass bg-white"
                                                            style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                                            value={username}
                                                            onChange={(e) => setUsername(e.target.value)}
                                                            placeholder="Your API Key"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">API Secret</label>
                                                        <input
                                                            type="password"
                                                            className="glass bg-white"
                                                            style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            placeholder="••••••••"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn w-full py-3 text-sm flex items-center justify-center gap-2 rounded-full"
                                                    style={{ background: 'var(--accent-gradient)', color: 'white' }}
                                                    onClick={testLogin}
                                                    disabled={isLoggingIn}
                                                >
                                                    {isLoggingIn ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                                    Validate Connection & Save
                                                </button>
                                                {loginMessage.text && (
                                                    <div className={`flex items-center gap-2 text-sm font-semibold p-3 rounded-xl ${loginMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {loginMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                                        {loginMessage.text}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Offline Resilience Section */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'start', gap: '2rem', padding: '1.5rem 0', borderTop: '1px solid var(--border-color)' }}>
                                        <div className="flex flex-col mt-2">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Offline Resilience</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prepare for network outages</span>
                                        </div>
                                        <div className="flex flex-col gap-4 w-100" style={{ maxWidth: '600px' }}>
                                            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col gap-3">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                                                        <CheckCircle size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-blue-900">Pre-cache All Data</h4>
                                                        <p className="text-sm text-blue-700 mt-1">Download all products, customer records, and images to ensure the POS works fully without internet.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn w-full mt-2"
                                                    style={{ padding: '0.8rem', borderRadius: '12px' }}
                                                    onClick={runPreCache}
                                                    disabled={isSyncing}
                                                >
                                                    {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                                    {isSyncing ? (syncStatusText || 'Preparing...') : 'Start Full Pre-caching'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center card bg-amber-50/20 border-amber-200">
                                    <Globe size={48} className="mx-auto mb-4 text-amber-500 opacity-50" />
                                    <h3 className="text-xl font-bold text-amber-900">Online Features Disabled</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">Switch to 'Online Mode' in General settings to configure ERPNext connection.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'devices' && (
                        <div className="flex flex-col gap-6">
                            {/* Printer Setup Card */}
                            <div className="card flex flex-col p-8 bg-[var(--glass-bg)] backdrop-blur-xl border-[var(--border-color)] shadow-xl rounded-[32px]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <Printer size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">Printer Configuration <HelpTooltip titleKey="help.settings_printers.title" contentKey="help.settings_printers.content" size={14} /></h2>
                                        <p className="text-sm text-gray-400">Manage receipt and order preparation printers</p>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    {/* Sync Checkbox */}
                                    <div
                                        className="p-6 mb-6 transition-colors"
                                        onClick={() => setUseSamePrinter(!useSamePrinter)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            backgroundColor: useSamePrinter ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0,0,0,0.02)',
                                            borderRadius: '16px',
                                            border: '1px solid',
                                            borderColor: useSamePrinter ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0,0,0,0.05)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{
                                            width: '1.5rem',
                                            height: '1.5rem',
                                            borderRadius: '6px',
                                            border: '2px solid',
                                            borderColor: useSamePrinter ? '#3b82f6' : '#cbd5e1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: useSamePrinter ? '#3b82f6' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}>
                                            {useSamePrinter && <CheckCircle size={14} color="white" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-blue-900">Use single printer for all purposes</span>
                                            <span className="text-sm text-blue-700/60 uppercase tracking-widest font-black">Sync Kitchen with Cashier</span>
                                        </div>
                                    </div>

                                    {/* Cashier Printer Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'start', gap: '2rem', padding: '2rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>{useSamePrinter ? 'Primary Printer' : 'Cashier Printer'}</span>
                                                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-sm font-black uppercase tracking-tighter">Receipts</span>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Used for customer payment receipts {useSamePrinter && '& kitchen slips'}</span>

                                            <div className="flex items-center gap-2 mt-4">
                                                <button
                                                    onClick={() => checkStatus('cashier')}
                                                    className="text-sm font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 flex items-center gap-1 bg-blue-500/5 px-3 py-1.5 rounded-full transition-all"
                                                >
                                                    <RefreshCw size={10} /> Check Status
                                                </button>
                                                {cashierStatus && (
                                                    <span className={`text-sm font-black px-2 py-1 rounded-lg uppercase tracking-widest ${cashierStatus === 'Normal' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {cashierStatus}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full" style={{ maxWidth: '500px' }}>
                                            <div className="relative">
                                                <input
                                                    list="cashier-printers"
                                                    className="glass w-full"
                                                    style={{ padding: '1rem 1.5rem', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 'bold', border: '2px solid #f1f5f9' }}
                                                    value={cashierPrinter}
                                                    onChange={(e) => setCashierPrinter(e.target.value)}
                                                    placeholder="Select or type printer name"
                                                />
                                                <datalist id="cashier-printers">
                                                    {detectedPrinters.map(p => <option key={p} value={p} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kitchen Printer Row */}
                                    {!useSamePrinter && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'start', gap: '2rem', padding: '2rem 0' }}>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Kitchen Printer</span>
                                                    <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-sm font-black uppercase tracking-tighter">Kitchen</span>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Used for prep station order slips</span>

                                                <div className="flex items-center gap-2 mt-4">
                                                    <button
                                                        onClick={() => checkStatus('kitchen')}
                                                        className="text-sm font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 flex items-center gap-1 bg-orange-500/5 px-3 py-1.5 rounded-full transition-all"
                                                    >
                                                        <RefreshCw size={10} /> Check Status
                                                    </button>
                                                    {kitchenStatus && (
                                                        <span className={`text-sm font-black px-2 py-1 rounded-lg uppercase tracking-widest ${kitchenStatus === 'Normal' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            {kitchenStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 w-full" style={{ maxWidth: '500px' }}>
                                                <div className="relative">
                                                    <input
                                                        list="kitchen-printers"
                                                        className="glass w-full"
                                                        style={{ padding: '1rem 1.5rem', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 'bold', border: '2px solid #f1f5f9' }}
                                                        value={kitchenPrinter}
                                                        onChange={(e) => setKitchenPrinter(e.target.value)}
                                                        placeholder="Select or type printer name"
                                                    />
                                                    <datalist id="kitchen-printers">
                                                        {detectedPrinters.map(p => <option key={p} value={p} />)}
                                                    </datalist>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex items-center justify-between p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                    <div className="flex items-start gap-4">
                                        <AlertCircle size={20} className="text-emerald-500 mt-0.5" />
                                        <div className="flex flex-col gap-1">
                                            <h4 className="font-bold text-sm text-emerald-800">Printer Detection</h4>
                                            <p className="text-sm text-emerald-700/70 leading-relaxed">
                                                Click refresh to scan for all printers currently installed on this Windows device.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={detectPrinters}
                                        disabled={isDetecting}
                                        className="btn-icon rounded-full"
                                        style={{ background: 'var(--accent-gradient)', color: 'white', borderRadius: '9999px', height: '48px', padding: '0 1.5rem' }}
                                    >
                                        <RefreshCw size={18} className={isDetecting ? 'animate-spin' : ''} />
                                        {isDetecting ? 'Scanning...' : 'Refresh Printer List'}
                                    </button>
                                </div>
                            </div>

                            {/* Scanner Card */}
                            <div className="card flex flex-col p-8 bg-[var(--glass-bg)] backdrop-blur-xl border-[var(--border-color)] shadow-xl rounded-[32px]">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                                        <Barcode size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">{t('settings.scanner.title')} <HelpTooltip titleKey="help.settings_scanner.title" contentKey="help.settings_scanner.content" size={14} /></h2>
                                        <p className="text-sm text-[var(--text-secondary)]">{t('settings.scanner.subtitle')}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-8">
                                    {/* Scanner Test Input Area */}
                                    <div className="p-8 bg-blue-500/5 rounded-3xl border-2 border-dashed border-blue-500/20 flex flex-col items-center gap-6 group hover:border-blue-500/40 transition-all">
                                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                            <Barcode size={32} />
                                        </div>
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <h3 className="font-black text-blue-900">{t('settings.scanner.test_area')}</h3>
                                            <p className="text-sm text-blue-700/60 max-w-md">{t('settings.scanner.test_desc')}</p>
                                        </div>

                                        <input
                                            onKeyDown={handleScanField}
                                            autoFocus
                                            className="w-full max-w-md bg-white/80 backdrop-blur-md border-2 border-blue-200 rounded-2xl p-4 text-center text-2xl font-black tracking-[0.2em] text-blue-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                            placeholder="SCAN HERE..."
                                        />

                                        {lastScan && (
                                            <div className="flex flex-col items-center gap-1 animate-in zoom-in-95 duration-300">
                                                <span className="text-sm font-black uppercase tracking-widest text-slate-400">Detected Barcode</span>
                                                <span className="text-xl font-black text-emerald-600">{lastScan}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Scan Log Table */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="font-bold text-slate-700">{t('settings.scanner.scan_log')}</h3>
                                            <span className="text-sm font-black uppercase tracking-widest text-slate-400">{scanLog.length} Records</span>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {scanLog.length === 0 ? (
                                                <div className="p-12 text-center text-slate-400 text-sm font-bold border-2 border-slate-100 rounded-3xl">
                                                    {t('settings.scanner.no_logs')}
                                                </div>
                                            ) : (
                                                scanLog.map((log, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-2xl hover:bg-white transition-colors animate-in slide-in-from-left-2"
                                                        style={{ animationDelay: `${i * 50}ms` }}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.source.includes('Scanner') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}`}>
                                                                <Barcode size={16} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-700">{log.code}</span>
                                                                <span className="text-sm text-slate-400 font-bold uppercase">{log.source}</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{log.time}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="flex flex-col gap-6">
                            {/* Theme Selection Card */}
                            <div className="card flex flex-col p-8 bg-white/80 backdrop-blur-xl border-white shadow-xl rounded-[32px]">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                                        <Palette size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">{t('settings.appearance.title')} <HelpTooltip titleKey="help.settings_appearance.title" contentKey="help.settings_appearance.content" size={14} /></h2>
                                        <p className="text-sm text-[var(--text-secondary)]">{t('settings.appearance.subtitle')}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-8">
                                    {[
                                        { type: 'dark', title: 'Dark Themes' },
                                        { type: 'light', title: 'Light Themes' }
                                    ].map(group => (
                                        <div key={group.type} className="flex flex-col gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-6 rounded-full ${group.type === 'dark' ? 'bg-indigo-500' : 'bg-orange-400'}`}></div>
                                                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-80">{group.title}</h3>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                {themes.filter(t => t.type === group.type).map((theme) => (
                                                    <button
                                                        key={theme.id}
                                                        onClick={() => handleThemeSelect(theme.id)}
                                                        className={`group relative flex flex-col items-center gap-3 p-3 rounded-[24px] border-2 transition-all ${activeTheme === theme.id ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 shadow-lg' : 'border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
                                                    >
                                                        <div
                                                            className="w-full aspect-video rounded-xl shadow-inner border border-black/5 overflow-hidden flex"
                                                            style={{ background: theme.bg }}
                                                        >
                                                            <div className="w-1/3 h-full" style={{ background: theme.primary, opacity: 0.8 }}></div>
                                                        </div>
                                                        <span className={`text-sm font-bold ${activeTheme === theme.id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>{theme.name}</span>
                                                        {activeTheme === theme.id && (
                                                            <div className="absolute top-2 right-2 w-5 h-5 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-white shadow-sm">
                                                                <CheckCircle size={12} />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 p-6 bg-[var(--accent-primary)]/5 rounded-2xl border border-[var(--accent-primary)]/10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl shadow-lg flex items-center justify-center ${activeTheme}`} style={{ background: 'var(--bg-color)', color: 'var(--accent-primary)' }}>
                                            <Palette size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold">Previewing: {themes.find(t => t.id === activeTheme)?.name}</h4>
                                            <p className="text-sm text-gray-500">Theme will be applied globally after clicking 'Save All Changes'</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full shadow-md" style={{ background: themes.find(t => t.id === activeTheme)?.primary }}></div>
                                        <div className="w-8 h-8 rounded-full shadow-md" style={{ background: themes.find(t => t.id === activeTheme)?.bg }}></div>
                                    </div>
                                </div>

                                {/* Language Selection Section */}
                                <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                            <Languages size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">{t('settings.language.title')}</h2>
                                            <p className="text-sm text-gray-400">{t('settings.language.subtitle')}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1 flex flex-col gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('settings.language.regions.global')}</span>
                                            <button
                                                onClick={() => setSelectedLanguage('en')}
                                                className={`group relative flex items-center gap-4 p-4 rounded-[20px] transition-all duration-300 border-2 text-left ${selectedLanguage === 'en' 
                                                    ? 'bg-white border-blue-500/10 shadow-[0_10px_20px_-10px_rgba(59,130,246,0.15)]' 
                                                    : 'bg-slate-50/50 border-slate-100 hover:border-blue-200'}`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm transition-all duration-300 ${selectedLanguage === 'en' ? 'bg-blue-50' : 'bg-white'}`}>
                                                    🇺🇸
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-base font-black tracking-tight transition-colors ${selectedLanguage === 'en' ? 'text-blue-600' : 'text-slate-700'}`}>
                                                        {t('settings.language.languages.en')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">English (US)</span>
                                                </div>
                                                {selectedLanguage === 'en' && (
                                                    <div className="ml-auto w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 animate-in zoom-in duration-300">
                                                        <CheckCircle size={14} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('settings.language.regions.asia')}</span>
                                            <button
                                                onClick={() => setSelectedLanguage('th')}
                                                className={`group relative flex items-center gap-4 p-4 rounded-[20px] transition-all duration-300 border-2 text-left ${selectedLanguage === 'th' 
                                                    ? 'bg-white border-blue-500/10 shadow-[0_10px_20px_-10px_rgba(59,130,246,0.15)]' 
                                                    : 'bg-slate-50/50 border-slate-100 hover:border-blue-200'}`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm transition-all duration-300 ${selectedLanguage === 'th' ? 'bg-blue-50' : 'bg-white'}`}>
                                                    🇹🇭
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-base font-black tracking-tight transition-colors ${selectedLanguage === 'th' ? 'text-blue-600' : 'text-slate-700'}`}>
                                                        {t('settings.language.languages.th')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ไทย (TH)</span>
                                                </div>
                                                {selectedLanguage === 'th' && (
                                                    <div className="ml-auto w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 animate-in zoom-in duration-300">
                                                        <CheckCircle size={14} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Typography Section */}
                                <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-600">
                                            <Languages size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">{t('settings.appearance.typography')}</h2>
                                            <p className="text-sm text-gray-400">{t('settings.appearance.typography_desc')}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {thaiFonts.map(font => (
                                            <button
                                                key={font.id}
                                                onClick={() => setSelectedFont(font.id)}
                                                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-start gap-4 ${selectedFont === font.id ? 'border-violet-500 bg-violet-500/5 shadow-lg' : 'border-gray-100 bg-white hover:border-violet-200'}`}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">{font.source}</span>
                                                    {selectedFont === font.id && <CheckCircle size={16} className="text-violet-500" />}
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-2xl font-black mb-1" style={{ fontFamily: font.family }}>สวัสดี</span>
                                                    <span className="text-sm font-bold">{font.name}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-xs text-emerald-500 font-bold flex items-center gap-1">
                                        <CheckCircle size={12} /> {t('settings.appearance.local_fonts')}
                                    </p>
                                </div>
                            </div>

                            {/* Customer Display Card */}
                            <div className="card flex flex-col p-8 bg-[var(--glass-bg)] backdrop-blur-xl border-[var(--border-color)] shadow-xl rounded-[32px]">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                        <Monitor size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">{t('settings.display.title')} <HelpTooltip titleKey="help.settings_display.title" contentKey="help.settings_display.content" size={14} /></h2>
                                        <p className="text-sm text-[var(--text-secondary)]">{t('settings.display.subtitle')}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1.25rem',
                                            borderRadius: '16px',
                                            border: '2px solid',
                                            borderColor: enableCustomerDisplay ? '#6366f1' : 'rgba(0,0,0,0.05)',
                                            backgroundColor: enableCustomerDisplay ? 'rgba(99, 102, 241, 0.05)' : 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => {
                                            const newVal = !enableCustomerDisplay;
                                            setEnableCustomerDisplay(newVal);
                                            window.go.main.App.LogFrontend(`Toggle EnableCustomerDisplay: ${newVal}`);
                                        }}
                                    >
                                        <div style={{
                                            width: '2rem',
                                            height: '2rem',
                                            borderRadius: '8px',
                                            border: '2px solid',
                                            borderColor: enableCustomerDisplay ? '#6366f1' : '#cbd5e1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: enableCustomerDisplay ? '#6366f1' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}>
                                            {enableCustomerDisplay && <CheckCircle size={20} color="white" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span style={{ fontWeight: 'bold', fontSize: '1rem', color: enableCustomerDisplay ? '#312e81' : '#64748b' }}>{t('settings.display.enable')}</span>
                                            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 900, opacity: 0.5 }}>Automatic Launch on Startup</span>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '280px 1fr',
                                            alignItems: 'center',
                                            gap: '2rem',
                                            padding: '1.5rem 0',
                                            borderTop: '1px solid var(--border-color)',
                                            marginTop: '1rem'
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Fullscreen Interface</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Launch display in kiosk mode</span>
                                        </div>
                                        <div
                                            onClick={() => {
                                                const newVal = !fullScreenMode;
                                                setFullScreenMode(newVal);
                                                window.go.main.App.LogFrontend(`Toggle FullScreenMode: ${newVal}`);
                                            }}
                                            style={{
                                                position: 'relative',
                                                display: 'inline-flex',
                                                height: '1.5rem',
                                                width: '2.75rem',
                                                alignItems: 'center',
                                                borderRadius: '9999px',
                                                transition: 'background-color 0.2s',
                                                backgroundColor: fullScreenMode ? 'var(--accent-primary)' : '#cbd5e1',
                                                cursor: 'pointer',
                                                border: '2px solid rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    height: '1rem',
                                                    width: '1rem',
                                                    transform: fullScreenMode ? 'translateX(1.5rem)' : 'translateX(0.25rem)',
                                                    borderRadius: '9999px',
                                                    backgroundColor: 'white',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'start', gap: '2rem', padding: '1.5rem 0', borderTop: '1px solid var(--border-color)' }}>
                                        <div className="flex flex-col mt-2">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>{t('settings.display.monitor_list')}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('settings.display.monitor_desc')}</span>

                                            <button
                                                onClick={detectScreens}
                                                disabled={isDetectingScreens}
                                                className="mt-6 text-sm font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 flex items-center gap-1 bg-indigo-500/5 px-4 py-2.5 rounded-full transition-all w-fit"
                                            >
                                                <RefreshCw size={12} className={isDetectingScreens ? 'animate-spin' : ''} />
                                                Refresh Monitors
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            {detectedScreens.length === 0 ? (
                                                <div className="p-8 border-2 border-dashed border-[var(--border-color)] rounded-3xl flex flex-col items-center justify-center text-gray-400 gap-3">
                                                    <Monitor size={40} className="opacity-20" />
                                                    <p className="text-sm font-bold">{t('settings.display.no_monitors')}</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div
                                                        onClick={() => setSelectedMonitor(-1)}
                                                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedMonitor === -1 ? 'bg-indigo-500/10 border-indigo-500 shadow-sm' : 'bg-white/50 border-[var(--border-color)] hover:bg-white/80'}`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${selectedMonitor === -1 ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                                            A
                                                        </div>
                                                        <div className="flex flex-col flex-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-bold">Auto Selection</span>
                                                                {selectedMonitor === -1 && <CheckCircle size={16} className="text-indigo-500" />}
                                                            </div>
                                                            <span className="text-sm text-gray-400">Avoids main window screen automatically</span>
                                                        </div>
                                                    </div>

                                                    {detectedScreens.map((screen, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => setSelectedMonitor(i)}
                                                            className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedMonitor === i ? 'bg-indigo-500/10 border-indigo-500 shadow-sm' : 'bg-white/50 border-[var(--border-color)] hover:bg-white/80'}`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${selectedMonitor === i ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                                                {i + 1}
                                                            </div>
                                                            <div className="flex flex-col flex-1">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-bold">{screen.IsPrimary ? 'Primary Display' : `Secondary Display ${i}`}</span>
                                                                    {selectedMonitor === i && <CheckCircle size={16} className="text-indigo-500" />}
                                                                </div>
                                                                <span className="text-sm text-gray-400">{screen.Width} x {screen.Height} • {screen.IsPrimary ? 'Internal' : 'External'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-8 p-8 bg-[var(--accent-gradient)] rounded-[24px] text-white flex justify-between items-center shadow-2xl">
                                                <div className="flex flex-col gap-1">
                                                    <h4 className="text-xl font-black tracking-tighter">{t('settings.display.launch')}</h4>
                                                    <p className="text-sm opacity-70">{t('settings.display.launch_desc')}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={closeCustomerDisplay}
                                                        className="px-6 py-3 bg-red-500/20 text-white font-bold rounded-full hover:bg-red-500/30 transition-all text-sm border border-white/10"
                                                    >
                                                        Close Display
                                                    </button>
                                                    <button
                                                        onClick={launchCustomerDisplay}
                                                        className="px-8 py-3 bg-white text-[var(--accent-primary)] font-black rounded-full hover:scale-105 transition-all shadow-lg text-sm"
                                                    >
                                                        Launch Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="flex flex-col gap-6">
                            <div className="card flex flex-col p-8 bg-[var(--glass-bg)] border-[var(--border-color)] shadow-xl rounded-[32px]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                        <Database size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold">{t('settings.payments.title', 'Payment Methods')}</h2>
                                        <p className="text-sm text-gray-400">{t('settings.payments.subtitle', 'Manage acceptable payment types and dynamic QR generation')}</p>
                                    </div>
                                    <button
                                        onClick={() => { setEditingPayment({ name: '', type: 'cash', isActive: true, qrTemplate: '' }); setShowPaymentModal(true); }}
                                        className="btn bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-6 py-2 flex items-center gap-2 font-bold shadow-lg shadow-indigo-500/30"
                                    >
                                        + {t('settings.payments.add', 'Add Payment Method')}
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-[var(--border-color)] text-sm uppercase tracking-wider text-[var(--text-secondary)]">
                                                <th className="pb-4 font-black">{t('settings.payments.name', 'Name')}</th>
                                                <th className="pb-4 font-black">{t('settings.payments.type', 'Type')}</th>
                                                <th className="pb-4 font-black text-center">{t('settings.payments.active', 'Active')}</th>
                                                <th className="pb-4 font-black text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paymentMethods.map(method => (
                                                <tr key={method.id} className="border-b border-[var(--border-color)] hover:bg-[var(--glass-bg-hover)] transition-colors">
                                                    <td className="py-4 font-bold">{method.name}</td>
                                                    <td className="py-4">
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-500 uppercase tracking-widest">{method.type}</span>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <span className={`w-3 h-3 rounded-full inline-block ${method.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                    </td>
                                                    <td className="py-4 text-right flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => { setEditingPayment(method); setShowPaymentModal(true); }}
                                                            className="px-4 py-2 rounded-xl font-bold bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all text-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deletePaymentMethod(method.id)}
                                                            className="px-4 py-2 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {paymentMethods.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-8 text-center text-gray-400 font-bold">No payment methods configured.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'advertising' && (
                        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
                            <div className="card flex flex-col p-8 bg-[var(--glass-bg)] border-[var(--border-color)] shadow-xl rounded-[32px]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                                        <PlaySquare size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold">Advertising & Media</h2>
                                        <p className="text-sm text-gray-400">Manage videos and promotions for the customer display</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-8">
                                    {/* Local Folder Section */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)] opacity-80">Local Video Folder</span>
                                            <span className="text-xs text-[var(--text-secondary)]">Play all videos found in a local directory</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-1 glass p-3 rounded-xl border border-[var(--border-color)] flex items-center gap-2 overflow-hidden" style={{ minWidth: 0 }}>
                                                <FolderOpen size={18} className="text-[var(--text-secondary)] flex-shrink-0" />
                                                <span className="text-sm truncate text-[var(--text-primary)]">{adVideoFolder || 'No folder selected'}</span>
                                            </div>
                                            <button 
                                                onClick={async () => {
                                                    const folder = await (window as any).go.main.App.SelectFolder();
                                                    if (folder) setAdVideoFolder(folder);
                                                }}
                                                className="btn-secondary px-6 rounded-xl flex items-center gap-2 flex-shrink-0"
                                            >
                                                Browse
                                            </button>
                                            {adVideoFolder && (
                                                <button 
                                                    onClick={() => setAdVideoFolder('')}
                                                    className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex-shrink-0"
                                                >
                                                    <X size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Video Links Section */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)] opacity-80">Online Video Links</span>
                                            <span className="text-xs text-[var(--text-secondary)]">Direct links to mp4/webm videos or streaming URLs</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <input 
                                                className="glass flex-1 p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)]"
                                                placeholder="https://example.com/video.mp4"
                                                value={adLinkInput}
                                                onChange={(e) => setAdLinkInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && adLinkInput) {
                                                        setAdVideoLinks([...adVideoLinks, adLinkInput]);
                                                        setAdLinkInput('');
                                                    }
                                                }}
                                            />
                                            <button 
                                                onClick={() => {
                                                    if (adLinkInput) {
                                                        setAdVideoLinks([...adVideoLinks, adLinkInput]);
                                                        setAdLinkInput('');
                                                    }
                                                }}
                                                className="btn rounded-xl flex items-center justify-center p-3"
                                                disabled={!adLinkInput}
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-2 mt-2">
                                            {adVideoLinks.map((link, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                                    <span className="text-sm truncate max-w-[400px] text-[var(--text-secondary)]">{link}</span>
                                                    <button 
                                                        onClick={() => setAdVideoLinks(adVideoLinks.filter((_, i) => i !== idx))}
                                                        className="text-red-500 hover:text-red-600 p-1"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {adVideoLinks.length === 0 && (
                                                <div className="text-center py-4 text-xs text-gray-500 border border-dashed border-[var(--border-color)] rounded-xl">
                                                    No links added
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Playback Mode */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)] opacity-80">Playback Mode</span>
                                            <span className="text-xs text-[var(--text-secondary)]">How videos are selected from the pool</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setAdPlaybackMode('sequence')}
                                                className={`flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${adPlaybackMode === 'sequence' ? 'border-purple-500 bg-purple-500/10 text-purple-600' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}
                                            >
                                                <span className="font-bold">Sequential</span>
                                                <span className="text-[10px] opacity-60">Play in order</span>
                                            </button>
                                            <button 
                                                onClick={() => setAdPlaybackMode('random')}
                                                className={`flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${adPlaybackMode === 'random' ? 'border-purple-500 bg-purple-500/10 text-purple-600' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}
                                            >
                                                <span className="font-bold">Random</span>
                                                <span className="text-[10px] opacity-60">Shuffle playlist</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Backup & Restore Section */}
                    <div className="card mt-8" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.5rem', padding: '2rem', marginBottom: '4rem' }}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <Database size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Backup & Restore</h2>
                                <p className="text-sm text-gray-400">Export or import your application configuration</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 hover:border-amber-500/50 transition-colors">
                                <h3 className="font-bold text-lg">Export Settings</h3>
                                <p className="text-sm text-gray-400 mb-4">Save all your current settings to a JSON file for backup or migration.</p>
                                <button 
                                    onClick={async () => {
                                        try {
                                            await (window as any).go.main.App.ExportSettings();
                                        } catch (err: any) {
                                            console.error("Export failed:", err);
                                        }
                                    }}
                                    className="btn btn-secondary flex items-center justify-center gap-2 w-full"
                                >
                                    <Download size={18} />
                                    Export to JSON
                                </button>
                            </div>

                            <div className="flex flex-col gap-2 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 hover:border-amber-500/50 transition-colors">
                                <h3 className="font-bold text-lg">Import Settings</h3>
                                <p className="text-sm text-gray-400 mb-4">Restore settings from a JSON file. (Requires Restart)</p>
                                <button 
                                    onClick={async () => {
                                        try {
                                            const res = await (window as any).go.main.App.ImportSettings();
                                            if (res) {
                                                alert(res);
                                            }
                                        } catch (err: any) {
                                            alert("Import failed: " + err);
                                        }
                                    }}
                                    className="btn btn-primary flex items-center justify-center gap-2 w-full"
                                >
                                    <Upload size={18} />
                                    Import from JSON
                                </button>
                            </div>
                        </div>
                    </div>


                    {/* Update History Modal */}
                    {showHistory && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[80vh]">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <RefreshCw size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Update History</h3>
                                            <p className="text-sm opacity-60">Past versions and changelogs</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowHistory(false)}
                                        className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                                    >
                                        <Trash2 size={20} className="rotate-45" />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                    <div className="flex flex-col gap-6 relative">
                                        {/* Current/Latest */}
                                        {latestUpdate && (
                                            <div className="flex gap-4 relative">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                                                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-800 mt-2" />
                                                </div>
                                                <div className="flex-1 pb-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-lg">v{latestUpdate.version}</span>
                                                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wider">Latest</span>
                                                    </div>
                                                    <p className="text-sm opacity-80 leading-relaxed">{latestUpdate.description}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Historical Entries */}
                                        {latestUpdate?.history?.slice().reverse().map((entry: any, idx: number) => (
                                            <div key={idx} className="flex gap-4 relative">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700" />
                                                    {idx !== latestUpdate.history.length - 1 && (
                                                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-800 mt-2" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-lg">v{entry.version}</span>
                                                        <span className="text-xs opacity-50">{entry.date}</span>
                                                    </div>
                                                    <p className="text-sm opacity-80 leading-relaxed">{entry.description}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {!latestUpdate?.history && (
                                            <div className="text-center py-10 opacity-50">
                                                No historical data available.
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                    <button 
                                        onClick={() => setShowHistory(false)}
                                        className="btn btn-secondary px-8"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Method Modal */}
                    {showPaymentModal && editingPayment && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <div className="bg-[var(--bg-primary)] w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-[var(--border-color)] flex flex-col">
                                <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{editingPayment.id ? 'Edit Payment Method' : 'Add Payment Method'}</h3>
                                    <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 rounded-full bg-gray-500/10 flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white transition-colors">✕</button>
                                </div>
                                <form onSubmit={savePaymentMethod} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold opacity-70 uppercase tracking-wider text-[var(--text-primary)]">{t('settings.payments.name', 'Name')}</label>
                                        <input
                                            required
                                            className="glass p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)]"
                                            value={editingPayment.name}
                                            onChange={(e) => setEditingPayment({ ...editingPayment, name: e.target.value })}
                                            placeholder="e.g. PromptPay KBank"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold opacity-70 uppercase tracking-wider text-[var(--text-primary)]">{t('settings.payments.type', 'Type')}</label>
                                        <select
                                            className="glass p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)]"
                                            value={editingPayment.type}
                                            onChange={(e) => setEditingPayment({ ...editingPayment, type: e.target.value })}
                                        >
                                            <option value="cash">{t('settings.payments.cash', 'Cash')}</option>
                                            <option value="card">{t('settings.payments.card', 'Card')}</option>
                                            <option value="promptpay">{t('settings.payments.promptpay', 'PromptPay (Dynamic QR)')}</option>
                                            <option value="other">{t('settings.payments.other', 'Other')}</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3 py-2">
                                        <input
                                            type="checkbox"
                                            id="paymentActive"
                                            className="w-5 h-5 rounded"
                                            checked={editingPayment.isActive}
                                            onChange={(e) => setEditingPayment({ ...editingPayment, isActive: e.target.checked })}
                                        />
                                        <label htmlFor="paymentActive" className="font-bold text-[var(--text-primary)]">{t('settings.payments.active', 'Active')}</label>
                                    </div>

                                    {editingPayment.type === 'promptpay' && (
                                        <div className="flex flex-col gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 mt-2">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-bold opacity-70 uppercase tracking-wider text-indigo-500">{t('settings.payments.generate_template', 'Auto-Generate Template')}</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        className="glass p-3 rounded-xl border border-indigo-500/30 flex-1 text-[var(--text-primary)]"
                                                        value={promptPayIdInput}
                                                        onChange={(e) => setPromptPayIdInput(e.target.value)}
                                                        placeholder={t('settings.payments.promptpay_id', 'PromptPay ID (Phone/TaxID)')}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleGenerateTemplate}
                                                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl px-4 transition-colors"
                                                    >
                                                        {t('settings.payments.generate', 'Generate')}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-bold opacity-70 uppercase tracking-wider text-[var(--text-primary)]">{t('settings.payments.template', 'EMVCo Template String')}</label>
                                                <p className="text-xs text-[var(--text-secondary)] mb-1">{t('settings.payments.template_desc', 'Used for PromptPay. Contains {54} or {x54} for dynamic amount injection.')}</p>
                                                <textarea
                                                    required
                                                    rows={4}
                                                    className="glass p-3 rounded-xl border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)]"
                                                    value={editingPayment.qrTemplate || ''}
                                                    onChange={(e) => setEditingPayment({ ...editingPayment, qrTemplate: e.target.value })}
                                                    placeholder="000201010212..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-3 mt-4">
                                        <button type="button" onClick={() => setShowPaymentModal(false)} className="px-6 py-3 rounded-xl font-bold bg-gray-500/10 text-gray-500 hover:bg-gray-500 hover:text-white transition-colors">
                                            {t('common.cancel', 'Cancel')}
                                        </button>
                                        <button type="submit" className="px-6 py-3 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                                            {t('common.save', 'Save')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminAuthWrapper >
    );
};

export default SettingsPage;
