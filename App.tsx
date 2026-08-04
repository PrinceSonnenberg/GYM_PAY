import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ClientGoalsPage from './pages/ClientGoalsPage';
import NewInvoicePage from './pages/NewInvoicePage';
import InvoicesPage from './pages/InvoicesPage';
import ExpensesPage from './pages/ExpensesPage';
import ClientsPage from './pages/ClientsPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import BottomNav from './components/BottomNav';

const App: React.FC = () => {
    const location = useLocation();

    const showBottomNav = ['/', '/clients', '/calendar', '/settings', '/invoices'].includes(location.pathname);

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
                <Route path="*" element={<HomePage />} />
            </Routes>
            {showBottomNav && <BottomNav />}
        </div>
    );
};

export default App;
