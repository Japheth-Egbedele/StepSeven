// src/context/BudgetContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { budgetAPI } from '../api/budgetAPI';
import { useAuth } from './AuthContext';

const BudgetContext = createContext();

export const useBudgets = () => {
    const context = useContext(BudgetContext);
    if (!context) {
        throw new Error('useBudgets must be used within BudgetProvider');
    }
    return context;
};

export const BudgetProvider = ({ children }) => {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const getMonthlyPeriodKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

    const getWeeklyPeriodKey = (date) => {
        const d = new Date(date);
        d.setUTCHours(0, 0, 0, 0);
        // ISO week-year
        const thursday = new Date(d);
        thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
        const isoYear = thursday.getUTCFullYear();
        const yearStart = new Date(Date.UTC(isoYear, 0, 1));
        const week = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
        return `${isoYear}-W${String(week).padStart(2, '0')}`;
    };

    const now = new Date();
    const [currentPeriod, setCurrentPeriod] = useState({
        periodType: 'MONTHLY',
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        cursorDate: now.toISOString(),
        periodKey: getMonthlyPeriodKey(now.getFullYear(), now.getMonth() + 1)
    });
    const [summary, setSummary] = useState(null);
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBudgets = useCallback(async (periodKey) => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const data = await budgetAPI.getBudgets({ periodKey });
            // ✅ DEFENSIVE: Force array type
            const budgetList = data?.budgets || data?.data || (Array.isArray(data) ? data : []);
            setBudgets(budgetList);
        } catch (err) {
            setError(err.message || 'Failed to fetch budgets');
            setBudgets([]); // ✅ Prevents .reduce() crashes on the page
            console.error('Error fetching budgets:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchSummary = useCallback(async () => {
        if (!user) return;

        try {
            setSummary(null);
        } catch (err) {
            console.error('Error fetching budget summary:', err);
        }
    }, [user]);

    const fetchComparison = useCallback(async () => {
        if (!user) return;

        try {
            setComparison(null);
        } catch (err) {
            console.error('Error fetching budget comparison:', err);
        }
    }, [user]);

    const createBudget = async (budgetData) => {
        try {
            const newBudget = await budgetAPI.createBudget(budgetData);
            setBudgets(prev => [...prev, newBudget.budget || newBudget]);
            await refreshBudgets();
            return newBudget;
        } catch (err) {
            throw new Error(err.message || 'Failed to create budget');
        }
    };

    const updateBudget = async (id, budgetData) => {
        try {
            const updated = await budgetAPI.updateBudget(id, budgetData);
            setBudgets(prev =>
                prev.map(b => b._id === id ? (updated.budget || updated) : b)
            );
            await refreshBudgets();
            return updated;
        } catch (err) {
            throw new Error(err.message || 'Failed to update budget');
        }
    };

    const deleteBudget = async (id) => {
        try {
            await budgetAPI.deleteBudget(id);
            setBudgets(prev => prev.filter(b => b._id !== id));
            await refreshBudgets();
        } catch (err) {
            throw new Error(err.message || 'Failed to delete budget');
        }
    };

    const refreshBudgets = useCallback(async () => {
        const { periodKey } = currentPeriod;
        await Promise.all([
            fetchBudgets(periodKey),
            fetchSummary(),
            fetchComparison()
        ]);
    }, [currentPeriod, fetchBudgets, fetchSummary, fetchComparison]);

    const changePeriod = useCallback((next) => {
        const periodType = (next?.periodType || currentPeriod.periodType || 'MONTHLY').toUpperCase();

        if (periodType === 'WEEKLY') {
            const cursorDate = next?.cursorDate || currentPeriod.cursorDate || new Date().toISOString();
            const periodKey = getWeeklyPeriodKey(cursorDate);
            const updated = { ...currentPeriod, periodType: 'WEEKLY', cursorDate, periodKey };
            setCurrentPeriod(updated);
            fetchBudgets(periodKey);
            fetchSummary();
            fetchComparison();
            return;
        }

        const year = next?.year ?? currentPeriod.year;
        const month = next?.month ?? currentPeriod.month;
        const cursorDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
        const periodKey = getMonthlyPeriodKey(year, month);
        const updated = { ...currentPeriod, periodType: 'MONTHLY', year, month, cursorDate, periodKey };
        setCurrentPeriod(updated);
        fetchBudgets(periodKey);
        fetchSummary();
        fetchComparison();
    }, [currentPeriod, fetchBudgets, fetchSummary, fetchComparison]);

    const value = {
        budgets,
        currentPeriod,
        summary,
        comparison,
        loading,
        error,
        createBudget,
        updateBudget,
        deleteBudget,
        refreshBudgets,
        changePeriod
    };

    return (
        <BudgetContext.Provider value={value}>
            {children}
        </BudgetContext.Provider>
    );
};