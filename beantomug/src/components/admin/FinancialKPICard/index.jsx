import React from 'react';
import {
  FaDollarSign,
  FaChartLine,
  FaReceipt,
  FaBriefcase,
  FaArrowUp,
  FaArrowDown,
  FaArrowRight,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaPercent,
  FaShoppingCart,
  FaBullseye
} from 'react-icons/fa';

const FinancialKPICard = ({ kpi }) => {
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <FaArrowUp className="text-coffee-crystal" />;
      case 'down': return <FaArrowDown className="text-coffee-mocha" />;
      default: return <FaArrowRight className="text-coffee-medium" />;
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
      case "Online Orders":
        return <FaChartLine className="text-2xl filter drop-shadow-lg" />;
      default:
        return <FaChartLine className="text-2xl filter drop-shadow-lg" />;
    }
  };

  const getChangeColorClass = (color) => {
    switch (color) {
      case 'success': return 'bg-coffee-crystal/90';
      case 'warning': return 'bg-coffee-warm/90';
      case 'danger': return 'bg-coffee-mocha/90';
      default: return 'bg-coffee-medium/90';
    }
  };

  const getDataQualityIndicator = (quality) => {
    switch (quality) {
      case 'high':
        return { icon: <FaCheckCircle className="text-coffee-crystal" />, color: 'text-coffee-crystal' };
      case 'medium':
        return { icon: <FaExclamationTriangle className="text-coffee-warm" />, color: 'text-coffee-warm' };
      case 'low':
        return { icon: <FaExclamationTriangle className="text-coffee-mocha" />, color: 'text-coffee-mocha' };
      default:
        return { icon: <FaClock className="text-coffee-medium" />, color: 'text-coffee-medium' };
    }
  };

  const dataQuality = getDataQualityIndicator(kpi.dataQuality);

  return (
    <div className="relative overflow-hidden rounded-2xl min-h-[140px] p-6
                    bg-dashboard-card
                    border-2 border-coffee-crystal/40
                    shadow-xl shadow-coffee-espresso/20
                    backdrop-blur-sm
                    hover:shadow-2xl hover:scale-[1.02]
                    transition-all duration-300 ease-out
                    group">

      {/* Crystal coffee shimmer effect */}
      <div className="absolute -top-1/2 -right-1/2 w-48 h-48
                      bg-gradient-radial from-coffee-pearl/40 via-coffee-ivory/20 to-transparent
                      rounded-full
                      animate-pulse
                      group-hover:animate-ping"></div>

      {/* Coffee accent border */}
      <div className="absolute bottom-0 left-0 right-0 h-1
                      bg-gradient-to-r from-coffee-mocha via-coffee-medium to-coffee-warm"></div>

      {/* Header with Data Quality */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          {getKPIIcon(kpi.title)}
          <h3 className="text-sm font-semibold uppercase tracking-wider
                         text-coffee-espresso drop-shadow-sm">
            {kpi.title}
          </h3>
        </div>
        
        {/* Data Quality Indicator */}
        <div className={`${dataQuality.color} text-xs`} title={`Data Quality: ${kpi.dataQuality}`}>
          {dataQuality.icon}
        </div>
      </div>

      {/* Main Value */}
      <div className="text-4xl font-bold mb-2 relative z-10
                      bg-gradient-to-r from-coffee-rich to-coffee-mocha
                      bg-clip-text text-transparent
                      drop-shadow-lg">
        {kpi.value}
      </div>

      {/* Target and Percentage */}
      {kpi.target && (
        <div className="text-xs text-coffee-mocha/90 mb-2 drop-shadow-sm flex items-center gap-1">
          <FaBullseye className="text-xs" />
          Target: {kpi.target} ({kpi.percentage}%)
        </div>
      )}

      {/* Additional Info for specific KPIs */}
      {kpi.title === "Daily Profit" && kpi.margin && (
        <div className="text-xs text-coffee-mocha/80 mb-2 drop-shadow-sm flex items-center gap-1">
          <FaPercent className="text-xs" />
          Margin: {kpi.margin}
        </div>
      )}

      {kpi.title === "Average Order Value" && kpi.orderCount && (
        <div className="text-xs text-coffee-mocha/80 mb-2 drop-shadow-sm flex items-center gap-1">
          <FaShoppingCart className="text-xs" />
          Orders: {kpi.orderCount}
        </div>
      )}

      {/* Change Indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                       text-sm font-semibold backdrop-blur-md
                       shadow-lg border border-coffee-crystal/30
                       text-coffee-espresso
                       ${getChangeColorClass(kpi.color)}`}>
        {getTrendIcon(kpi.trend)}
        <span>{kpi.change}</span>
        <span className="text-xs opacity-80">{kpi.comparison}</span>
      </div>

      {/* Progress Bar */}
      {kpi.percentage && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5
                        bg-coffee-medium/30 overflow-hidden">
          <div
            className={`h-full shadow-sm transition-all duration-500 ease-out
                       ${kpi.percentage >= 80 ? 'bg-coffee-crystal' : 
                         kpi.percentage >= 60 ? 'bg-coffee-warm' : 'bg-coffee-mocha'}`}
            style={{ width: `${Math.min(kpi.percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default FinancialKPICard;
