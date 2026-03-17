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
import CustomerDisplay from './pages/CustomerDisplay';
import UpdateNotification from './components/UpdateNotification';
import './App.css';

import { ModalProvider } from './context/ModalContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

import { useEffect } from 'react';

function App() {
    useEffect(() => {
        // Detect if this instance is the customer display
        const checkMode = async () => {
            try {
                const isCustomer = await window.go.main.App.GetIsCustomerDisplay();
                if (isCustomer) {
                    // Force navigation to customer display if we are on the wrong route
                    if (window.location.hash !== '#/customer') {
                        window.location.hash = '#/customer';
                    }
                }
            } catch (err) {
                console.error("Failed to check display mode", err);
            }
        };
        checkMode();
    }, []);

    return (
        <AuthProvider>
            <ThemeProvider>
                <ModalProvider>
                    <CartProvider>
                        <UpdateNotification />
                        <Router>
                            <Routes>
                                {/* PinCodePage is standalone, outside MainLayout chrome */}
                                <Route path="/" element={<PinCodePage />} />
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
    );
}

export default App;
