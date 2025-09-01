import React from 'react';
import { FaDownload, FaFilePdf } from 'react-icons/fa';

const ExportButtons = ({ 
  onCSVExport, 
  onPDFExport, 
  csvLabel = 'CSV', 
  pdfLabel = 'PDF',
  size = 'default', // 'small', 'default', 'large'
  variant = 'primary' // 'primary', 'secondary', 'chart'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-1 text-xs';
      case 'large':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return {
          csv: 'bg-coffee-cream text-coffee-brown hover:bg-coffee-ivory',
          pdf: 'bg-coffee-mist text-coffee-espresso hover:bg-coffee-ivory'
        };
      case 'chart':
        return {
          csv: 'bg-coffee-cream text-coffee-brown hover:bg-coffee-ivory',
          pdf: 'bg-coffee-mocha text-white hover:bg-coffee-dark'
        };
      default: // primary
        return {
          csv: 'bg-coffee-brown text-white hover:bg-coffee-dark',
          pdf: 'bg-coffee-mocha text-white hover:bg-coffee-dark'
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <div className="flex gap-2">
      <button 
        onClick={onCSVExport}
        className={`${getSizeClasses()} ${variantClasses.csv} rounded-lg transition-colors flex items-center gap-2 font-medium`}
      >
        <FaDownload />
        {csvLabel}
      </button>
      <button 
        onClick={onPDFExport}
        className={`${getSizeClasses()} ${variantClasses.pdf} rounded-lg transition-colors flex items-center gap-2 font-medium`}
      >
        <FaFilePdf />
        {pdfLabel}
      </button>
    </div>
  );
};

export default ExportButtons;
