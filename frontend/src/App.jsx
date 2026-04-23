// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { AccountProvider } from './context/AccountContext';
import { BudgetProvider } from './context/BudgetContext';
import { BabyStepProvider } from './context/BabyStepContext'; // Added this
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Budgets from './pages/Budgets';
import BabySteps from './pages/BabySteps';
import Analytics from './pages/Analytics';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import ToastContainer from './components/Layout/ToastContainer';
import './styles/variables.css';
import './styles/Global.css';

// Fixed Layout to ensure full-width coverage and no "black void"
const AppLayout = ({ children }) => (
  <div className="app-shell">
    <ToastContainer />
    <Navbar /> 
    <div className="app-body">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
  </div>
);

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CurrencyProvider>
          <AccountProvider>
            <BudgetProvider>
              <BabyStepProvider> {/* Wrapped inside Providers */}
                <BrowserRouter>
                  <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected Routes */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Dashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/accounts" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Accounts />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/budgets" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Budgets />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/baby-steps" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <BabySteps />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Analytics />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Settings />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Transactions */}
                  <Route path="/transactions" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Transactions />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </BabyStepProvider>
            </BudgetProvider>
          </AccountProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;