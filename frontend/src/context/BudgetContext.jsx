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
    const [currentPeriod, setCurrentPeriod] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    });
    const [summary, setSummary] = useState(null);
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBudgets = useCallback(async (year, month) => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const data = await budgetAPI.getBudgets({ year, month });
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

    const fetchSummary = useCallback(async (year, month) => {
        if (!user) return;

        try {
            const data = await budgetAPI.getBudgetSummary(year, month);
            setSummary(data);
        } catch (err) {
            console.error('Error fetching budget summary:', err);
        }
    }, [user]);

    const fetchComparison = useCallback(async (year, month) => {
        if (!user) return;

        try {
            const data = await budgetAPI.getBudgetComparison(year, month);
            setComparison(data);
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
        const { year, month } = currentPeriod;
        await Promise.all([
            fetchBudgets(year, month),
            fetchSummary(year, month),
            fetchComparison(year, month)
        ]);
    }, [currentPeriod, fetchBudgets, fetchSummary, fetchComparison]);

    const changePeriod = useCallback((year, month) => {
        setCurrentPeriod({ year, month });
        fetchBudgets(year, month);
        fetchSummary(year, month);
        fetchComparison(year, month);
    }, [fetchBudgets, fetchSummary, fetchComparison]);

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