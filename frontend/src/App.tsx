import React, { Component, ErrorInfo } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import OrderPage from './pages/OrderPage';
import CheckoutPage from './pages/CheckoutPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import StockPage from './pages/StockPage';
import CustomerPage from './pages/CustomerPage';
import CampaignPage from './pages/CampaignPage';
import DeliveryPage from './pages/DeliveryPage';
import DrawerPage from './pages/DrawerPage';
import QrPaymentPage from './pages/QrPaymentPage';
import FinalProcessPage from './pages/FinalProcessPage';
import AdminPage from './pages/AdminPage';
import PinCodePage from './pages/PinCodePage';
import ReportsPage from './pages/ReportsPage';
import CustomerDisplay from './pages/CustomerDisplay';
import UpdateNotification from './components/UpdateNotification';
import './App.css';

import { ModalProvider } from './context/ModalContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

import { useEffect } from 'react';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ 
                    padding: '2rem', 
                    background: '#1e293b', 
                    color: '#f8fafc', 
                    height: '100vh', 
                    width: '100vw', 
                    zIndex: 999999, 
                    position: 'fixed', 
                    top: 0, 
                    left: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontFamily: 'sans-serif'
                }}>
                    <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>Something went wrong</h1>
                    <p style={{ marginBottom: '2rem', opacity: 0.8 }}>The application encountered an unexpected error.</p>
                    <div style={{ 
                        background: '#0f172a', 
                        padding: '1.5rem', 
                        borderRadius: '0.75rem', 
                        maxWidth: '80%', 
                        overflow: 'auto',
                        textAlign: 'left',
                        border: '1px solid #334155'
                    }}>
                        <pre style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '2rem',
                            padding: '0.75rem 1.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    const [isCustomer, setIsCustomer] = React.useState<boolean | null>(null);

    useEffect(() => {
        const checkMode = async () => {
            try {
                // @ts-ignore
                const mode = await window.go.main.App.GetIsCustomerDisplay();
                console.log("App: Detected mode isCustomer =", mode);
                setIsCustomer(mode);
            } catch (err) {
                console.error("Failed to check display mode", err);
                setIsCustomer(false);
            }
        };
        checkMode();
    }, []);

    // Don't render until we know the mode
    if (isCustomer === null) return null;

    return (
        <ErrorBoundary>
            <AuthProvider>
                <ThemeProvider>
                    <ModalProvider>
                        <CartProvider>
                            <UpdateNotification />
                            <Router>
                                <Routes>
                                    {/* If in customer mode, default to CustomerDisplay */}
                                    <Route path="/" element={isCustomer ? <CustomerDisplay /> : <PinCodePage />} />
                                    <Route path="/pincode" element={<PinCodePage />} />
                                    <Route path="/customer" element={<CustomerDisplay />} />

                                    {/* All other routes are wrapped in MainLayout (Sidebar/Header) */}
                                    <Route element={<MainLayout />}>
                                        <Route path="/dashboard" element={<DashboardPage />} />
                                        <Route path="/orders" element={<OrderPage />} />
                                        <Route path="/checkout" element={<CheckoutPage />} />
                                        <Route path="/settings" element={<SettingsPage />} />
                                        <Route path="/stock" element={<StockPage />} />
                                        <Route path="/customers" element={<CustomerPage />} />
                                        <Route path="/campaigns" element={<CampaignPage />} />
                                        <Route path="/delivery" element={<DeliveryPage />} />
                                        <Route path="/drawer" element={<DrawerPage />} />
                                        <Route path="/reports" element={<ReportsPage />} />
                                        <Route path="/qr-payment" element={<QrPaymentPage />} />
                                        <Route path="/final" element={<FinalProcessPage />} />
                                        <Route path="/admin" element={<AdminPage />} />
                                    </Route>
                                </Routes>
                            </Router>
                        </CartProvider>
                    </ModalProvider>
                </ThemeProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
