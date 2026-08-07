import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/lib/firebase';
import HomePage from './pages/HomePage';
import ClientGoalsPage from './pages/ClientGoalsPage';
import NewInvoicePage from './pages/NewInvoicePage';
import InvoicesPage from './pages/InvoicesPage';
import ExpensesPage from './pages/ExpensesPage';
import ClientsPage from './pages/ClientsPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import StatisticsPage from './pages/StatisticsPage';
import LoginPage from './pages/LoginPage';
import BottomNav from './components/BottomNav';

const App: React.FC = () => {
    const location = useLocation();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
            </div>
        );
    }

    if (!user && location.pathname !== '/login') {
        return <Navigate to="/login" replace />;
    }

    if (user && location.pathname === '/login') {
        return <Navigate to="/" replace />;
    }

    if (location.pathname === '/login') {
        return <LoginPage />;
    }

    const showBottomNav = ['/', '/clients', '/calendar', '/settings', '/invoices', '/statistics'].includes(location.pathname);

    // Expenses & Invoices manage their layout cleanly
    if (location.pathname === '/expenses') {
        return <ExpensesPage />;
    }
    if (location.pathname === '/invoices') {
        return <InvoicesPage />;
    }

    return (
        <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-background">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/clients/:clientId/goals" element={<ClientGoalsPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoice" element={<NewInvoicePage />} />
                <Route path="/invoice/:clientId" element={<NewInvoicePage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<HomePage />} />
            </Routes>
            {showBottomNav && <BottomNav />}
        </div>
    );
};

export default App;


