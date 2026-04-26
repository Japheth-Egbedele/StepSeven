import React, { useState, useEffect } from 'react';
import { babyStepAPI } from '../../api/babyStepAPI';
import { useCurrency } from '../../context/CurrencyContext';
import StepCard from './StepCard';
import SnowballVisualizer from './SnowballVisualizer';
import GazelleIntensityWidget from './GazelleIntensityWidget';
import EmergencyFundProgress from './EmergencyFundProgress';
import './BabyStepDashboard.css';

const BabyStepDashboard = () => {
  const [progress, setProgress] = useState(null);
  const [gazelleIntensity, setGazelleIntensity] = useState(null);
  const [loading, setLoading] = useState(true);
  const { formatMoney } = useCurrency();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [progressRes, gazelleRes] = await Promise.all([
        babyStepAPI.getProgress(),
        babyStepAPI.getGazelleIntensity()
      ]);
      // Axios response shape: { data: { success, data } }
      const progressData = progressRes?.data?.data ?? progressRes?.data ?? null;
      const gazelleData = gazelleRes?.data?.data ?? gazelleRes?.data ?? null;
      setProgress(progressData);
      setGazelleIntensity(gazelleData);
    } catch (error) {
      console.error('Error fetching Baby Steps data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading your Baby Steps progress...</div>;
  }

  if (!progress) {
    return <div className="error">Unable to load Baby Steps data</div>;
  }

  const steps = [
    {
      number: 1,
      title: 'Save ₦1,000 Starter Emergency Fund',
      description: 'Your first line of defense against life\'s unexpected expenses',
      completed: progress.step1.completed,
      current: progress.step1.currentAmount,
      target: progress.step1.targetAmount
    },
    {
      number: 2,
      title: 'Pay Off All Debt (Except the House)',
      description: 'Use the Debt Snowball method - smallest to largest',
      completed: progress.step2.completed,
      current: progress.step2.totalDebtOriginal - progress.step2.totalDebtRemaining,
      target: progress.step2.totalDebtOriginal
    },
    {
      number: 3,
      title: 'Save 3-6 Months of Expenses',
      description: 'Full emergency fund for complete peace of mind',
      completed: progress.step3.completed,
      current: progress.step3.currentAmount,
      target: progress.step3.targetAmount
    },
    {
      number: 4,
      title: 'Invest 15% for Retirement',
      description: 'Start building long-term wealth',
      completed: progress.step4.active,
      isManual: true
    },
    {
      number: 5,
      title: 'Save for Children\'s Education',
      description: 'Secure your children\'s future',
      completed: progress.step5.active,
      isManual: true
    },
    {
      number: 6,
      title: 'Pay Off Home Early',
      description: 'Become completely debt-free',
      completed: progress.step6.active,
      isManual: true
    },
    {
      number: 7,
      title: 'Build Wealth & Give',
      description: 'Live and give like no one else!',
      completed: progress.step7.active,
      isManual: true
    }
  ];

  return (
    <div className="babystep-dashboard">
      <div className="dashboard-header">
        <h1>Your Baby Steps Journey</h1>
        <p className="current-step">
          You're on <strong>Baby Step {progress.currentStep}</strong>
        </p>
      </div>

      {/* Gazelle Intensity Alert */}
      {gazelleIntensity && gazelleIntensity.shouldThrowAtDebt && (
        <GazelleIntensityWidget data={gazelleIntensity} />
      )}

      {/* Emergency Fund Progress (Steps 1 & 3) */}
      {(progress.currentStep === 1 || progress.currentStep === 3) && (
        <EmergencyFundProgress 
          step={progress.currentStep}
          data={progress.currentStep === 1 ? progress.step1 : progress.step3}
        />
      )}

      {/* Debt Snowball Visualizer (Step 2) */}
      {progress.currentStep === 2 && progress.step2.debts.length > 0 && (
        <SnowballVisualizer debts={progress.step2.debts} />
      )}

      {/* All Baby Steps */}
      <div className="steps-grid">
        {steps.map(step => (
          <StepCard 
            key={step.number}
            step={step}
            isCurrent={progress.currentStep === step.number}
            onRefresh={fetchData}
          />
        ))}
      </div>

      <div className="dashboard-actions">
        <button 
          className="btn-secondary"
          onClick={fetchData}
        >
          Refresh Progress
        </button>
      </div>
    </div>
  );
};

export default BabyStepDashboard;
