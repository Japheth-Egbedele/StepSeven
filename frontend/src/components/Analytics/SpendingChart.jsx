// src/components/Analytics/SpendingChart.jsx
import { formatMoney } from '../../utils/moneyUtils';
import '../../styles/SpendingChart.css';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const SpendingChart = ({ data, currency }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No spending data available for this period</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  // Calculate percentages and positions for donut chart
  let currentAngle = 0;
  const segments = data.map((item, idx) => {
    const percentage = (item.amount / total) * 100;
    const angle = (item.amount / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle,
      color: COLORS[idx % COLORS.length]
    };
  });

  return (
    <div className="spending-chart">
      {/* Donut Chart */}
      <div className="donut-chart">
        <svg viewBox="0 0 200 200" className="donut-svg">
          {segments.map((segment, idx) => {
            const startAngle = (segment.startAngle - 90) * (Math.PI / 180);
            const endAngle = (segment.endAngle - 90) * (Math.PI / 180);
            const innerRadius = 60;
            const outerRadius = 90;
            
            const x1 = 100 + outerRadius * Math.cos(startAngle);
            const y1 = 100 + outerRadius * Math.sin(startAngle);
            const x2 = 100 + outerRadius * Math.cos(endAngle);
            const y2 = 100 + outerRadius * Math.sin(endAngle);
            const x3 = 100 + innerRadius * Math.cos(endAngle);
            const y3 = 100 + innerRadius * Math.sin(endAngle);
            const x4 = 100 + innerRadius * Math.cos(startAngle);
            const y4 = 100 + innerRadius * Math.sin(startAngle);
            
            const largeArc = segment.percentage > 50 ? 1 : 0;
            
            const pathData = [
              `M ${x1} ${y1}`,
              `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
              `L ${x3} ${y3}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
              'Z'
            ].join(' ');
            
            return (
              <path
                key={idx}
                d={pathData}
                fill={segment.color}
                className="donut-segment"
              />
            );
          })}
          
          {/* Center text */}
          <text x="100" y="95" textAnchor="middle" className="donut-label">Total</text>
          <text x="100" y="110" textAnchor="middle" className="donut-value">
            {formatMoney(total, currency.symbol, currency.subunitToUnit, false)}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="chart-legend-list">
        {segments.map((segment, idx) => (
          <div key={idx} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: segment.color }} />
            <div className="legend-details">
              <span className="legend-category">{segment.category || 'Unknown'}</span>
              <span className="legend-amount">
                {formatMoney(segment.amount, currency.symbol, currency.subunitToUnit)}
              </span>
            </div>
            <span className="legend-percentage">{segment.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingChart;