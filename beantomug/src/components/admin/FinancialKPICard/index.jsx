import React from 'react';
import { 
  FaDollarSign, 
  FaChartLine, 
  FaReceipt, 
  FaBriefcase,
  FaArrowUp,
  FaArrowDown,
  FaArrowRight
} from 'react-icons/fa';

const FinancialKPICard = ({ kpi }) => {
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <FaArrowUp className="text-green-500" />;
      case 'down':
        return <FaArrowDown className="text-red-500" />;
      default:
        return <FaArrowRight className="text-gray-500" />;
    }
  };

  const getKPIIcon = (title) => {
    switch (title) {
      case "Today's Revenue":
      case "Weekly Revenue":
        return <FaDollarSign className="text-2xl filter drop-shadow-lg" />;
      case "Average Order Value":
        return <FaReceipt className="text-2xl filter drop-shadow-lg" />;
      case "Daily Profit":
        return <FaBriefcase className="text-2xl filter drop-shadow-lg" />;
      default:
        return <FaChartLine className="text-2xl filter drop-shadow-lg" />;
    }
  };

        const getChangeColorClass = (color) => {
    switch (color) {
      case 'success':
        return 'bg-green-500/90 text-crystal-shine';
      case 'warning':
        return 'bg-amber-500/90 text-crystal-shine';
      case 'danger':
        return 'bg-red-500/90 text-crystal-shine';
      default:
        return 'bg-crystal-clear/90 text-mocha-dark';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl min-h-[140px] p-6 
                    bg-mocha-gradient
                    border-2 border-crystal-ice/30 
                    shadow-2xl shadow-mocha-dark/30
                    backdrop-blur-sm
                    hover:shadow-3xl hover:scale-[1.02] 
                    transition-all duration-300 ease-out
                    group">
      
      {/* Crystal shimmer effect */}
      <div className="absolute -top-1/2 -right-1/2 w-48 h-48 
                      bg-gradient-radial from-crystal-clear/30 via-crystal-clear/10 to-transparent 
                      rounded-full 
                      animate-pulse
                      group-hover:animate-ping"></div>
      
      {/* Mocha accent border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 
                      bg-gradient-to-r from-mocha-dark via-mocha-medium to-mocha-light"></div>
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 relative z-10">
        {getKPIIcon(kpi.title)}
        <h3 className="text-sm font-semibold uppercase tracking-wider 
                       text-crystal-clear drop-shadow-md">
          {kpi.title}
        </h3>
      </div>
      
      {/* Main Value */}
      <div className="text-4xl font-bold mb-2 relative z-10
                      bg-gradient-to-r from-crystal-clear to-crystal-ice 
                      bg-clip-text text-transparent
                      drop-shadow-lg">
        {kpi.value}
      </div>
      
      {/* Target (if exists) */}
      {kpi.target && (
        <div className="text-xs text-crystal-ice/90 mb-2 drop-shadow-sm">
          Target: {kpi.target} ({kpi.percentage}%)
        </div>
      )}
      
      {/* Change Indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
                       text-sm font-semibold backdrop-blur-md
                       shadow-lg border border-crystal-clear/20
                       ${getChangeColorClass(kpi.color)}`}>
        {getTrendIcon(kpi.trend)}
        <span>{kpi.change}</span>
        <span className="text-xs opacity-80">{kpi.comparison}</span>
      </div>
      
      {/* Progress Bar (if percentage exists) */}
      {kpi.percentage && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 
                        bg-mocha-dark/30 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-crystal-clear via-crystal-ice to-crystal-clear 
                       shadow-sm transition-all duration-500 ease-out
                       animate-pulse"
            style={{ width: `${kpi.percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default FinancialKPICard;
