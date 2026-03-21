// src/context/BabyStepContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { babyStepAPI } from '../api/babyStepAPI';
import { useAuth } from './AuthContext';

const BabyStepContext = createContext();

export const useBabySteps = () => {
    const context = useContext(BabyStepContext);
    if (!context) {
        throw new Error('useBabySteps must be used within BabyStepProvider');
    }
    return context;
};

export const BabyStepProvider = ({ children }) => {
    const { user } = useAuth();
    const [progress, setProgress] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [emergencyFund, setEmergencyFund] = useState(null);
    const [debtSnowball, setDebtSnowball] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProgress = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const data = await babyStepAPI.getProgress();
            setProgress(data);
            setCurrentStep(data?.currentStep || 1);
        } catch (err) {
            setError(err.message || 'Failed to fetch progress');
            console.error('Error fetching baby steps progress:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchEmergencyFund = useCallback(async () => {
        if (!user) return;
        try {
            const data = await babyStepAPI.getEmergencyFund();
            // Ensure data has the expected structure, otherwise set a safe default
            setEmergencyFund(data?.success === false ? null : data);
        } catch (err) {
            console.error('Error fetching emergency fund:', err);
            setEmergencyFund(null);
        }
    }, [user]);

    const fetchDebtSnowball = useCallback(async () => {
        if (!user) return;
        try {
            const data = await babyStepAPI.getDebtSnowball();
            // Ensure 'debts' is always an array to prevent .map() crashes
            const safeData = {
                ...data,
                debts: Array.isArray(data?.debts) ? data.debts : []
            };
            setDebtSnowball(data?.success === false ? null : safeData);
        } catch (err) {
            console.error('Error fetching debt snowball:', err);
            setDebtSnowball({ debts: [], totalDebt: 0, paidOff: 0 });
        }
    }, [user]);

    const updateProgress = async (progressData) => {
        try {
            const updated = await babyStepAPI.updateProgress(progressData);
            setProgress(updated);
            setCurrentStep(updated?.currentStep || currentStep);
            return updated;
        } catch (err) {
            throw new Error(err.message || 'Failed to update progress');
        }
    };

    const completeStep = async (stepNumber) => {
        try {
            const result = await babyStepAPI.completeStep(stepNumber);
            setProgress(result);
            setCurrentStep(result?.currentStep || stepNumber + 1);
            await refreshAll();
            return result;
        } catch (err) {
            throw new Error(err.message || 'Failed to complete step');
        }
    };

    const refreshAll = useCallback(async () => {
        await Promise.all([
            fetchProgress(),
            fetchEmergencyFund(),
            fetchDebtSnowball()
        ]);
    }, [fetchProgress, fetchEmergencyFund, fetchDebtSnowball]);

    useEffect(() => {
        if (user) {
            refreshAll();
        }
    }, [user, refreshAll]);

    // Calculate step-specific data
    const getStepProgress = (stepNumber) => {
        if (!progress) return null;

        switch (stepNumber) {
            case 1:
                return {
                    completed: emergencyFund?.current >= 100000, // $1000 in kobo
                    percentage: emergencyFund ? (emergencyFund.current / emergencyFund.goal) * 100 : 0,
                    current: emergencyFund?.current || 0,
                    goal: emergencyFund?.goal || 100000
                };

            case 2:
                return {
                    completed: debtSnowball?.totalDebt === 0,
                    // ✅ Protect against division by zero or missing data
                    percentage: (debtSnowball?.totalDebt + debtSnowball?.paidOff) > 0
                        ? (debtSnowball.paidOff / (debtSnowball.totalDebt + debtSnowball.paidOff)) * 100
                        : (debtSnowball?.totalDebt === 0 ? 100 : 0),
                    totalDebt: debtSnowball?.totalDebt || 0,
                    paidOff: debtSnowball?.paidOff || 0,
                    debts: Array.isArray(debtSnowball?.debts) ? debtSnowball.debts : []
                };

            case 3:
                const fullGoal = emergencyFund ? emergencyFund.goal * 6 : 600000; // 3-6 months
                return {
                    completed: emergencyFund?.current >= fullGoal,
                    percentage: emergencyFund ? (emergencyFund.current / fullGoal) * 100 : 0,
                    current: emergencyFund?.current || 0,
                    goal: fullGoal
                };

            default:
                return progress?.steps?.[stepNumber - 1] || null;
        }
    };

    const isStepCompleted = (stepNumber) => {
        return stepNumber < currentStep;
    };

    const isStepCurrent = (stepNumber) => {
        return stepNumber === currentStep;
    };

    const value = {
        progress,
        currentStep,
        emergencyFund,
        debtSnowball,
        loading,
        error,
        updateProgress,
        completeStep,
        refreshAll,
        getStepProgress,
        isStepCompleted,
        isStepCurrent
    };

    return (
        <BabyStepContext.Provider value={value}>
            {children}
        </BabyStepContext.Provider>
    );
};