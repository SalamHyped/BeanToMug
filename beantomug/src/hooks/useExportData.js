import { useCallback } from 'react';

const useExportData = () => {
  // CSV Export functionality
  const downloadCSV = useCallback((data, filename, headers, summaryData = null) => {
    if (!data || data.length === 0) {
      alert('No data available to download');
      return;
    }

    // Prepare CSV data - handle both object arrays and regular arrays
    let csvData;
    if (data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
      // If data is array of objects, extract values
      csvData = data.map(item => Object.values(item));
    } else {
      // If data is already array of arrays
      csvData = data;
    }

    // Add summary data if provided
    if (summaryData) {
      csvData.push(['', '', '', '']);
      csvData.push(['SUMMARY', '', '', '']);
      summaryData.forEach(row => {
        csvData.push(row);
      });
    }

    // Convert to CSV string
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // PDF Export functionality
  const downloadPDF = useCallback(async (data, filename, options) => {
    if (!data || data.length === 0) {
      alert('No data available to download');
      return;
    }

    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(options.title || 'Analytics Report', 20, 20);
      
      // Subtitle with metadata
      if (options.subtitle) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(options.subtitle, 20, 30);
      }
      
      if (options.generatedDate) {
        doc.text(options.generatedDate, 20, 40);
      }
      
      // Summary section if provided
      if (options.summaryData) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(options.summaryTitle || 'Summary', 20, 60);
        
        autoTable(doc, {
          head: [options.summaryHeaders || ['Metric', 'Value', 'Change']],
          body: options.summaryData,
          startY: 70,
          theme: 'grid',
          headStyles: { fillColor: [139, 69, 19], textColor: 255 },
          styles: { fontSize: 10 }
        });
      }
      
      // Chart section if provided
      if (options.chartData) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const chartStartY = options.summaryData ? doc.lastAutoTable.finalY + 20 : 60;
        doc.text(options.chartTitle || 'Chart Visualization', 20, chartStartY);
        
        // Add chart image if provided
        if (options.chartImage) {
          try {
            doc.addImage(options.chartImage, 'PNG', 20, chartStartY + 10, 170, 80);
          } catch (chartError) {
            console.warn('Could not add chart image:', chartError);
            // Fallback to text description
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Chart data available in interactive dashboard', 20, chartStartY + 15);
          }
        }
      }
      
      // Main data table
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      let dataStartY;
      if (options.chartData) {
        dataStartY = options.chartImage ? 140 : 80;
      } else {
        dataStartY = options.summaryData ? doc.lastAutoTable.finalY + 20 : 60;
      }
      doc.text(options.dataTitle || 'Data Details', 20, dataStartY);
      
      autoTable(doc, {
        head: [options.dataHeaders || ['Date', 'Value']],
        body: data,
        startY: dataStartY + 10,
        theme: 'grid',
        headStyles: { fillColor: [139, 69, 19], textColor: 255 },
        styles: { fontSize: 9 }
      });
      
      // Save the PDF
      doc.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  }, []);

  return {
    downloadCSV,
    downloadPDF
  };
};

export default useExportData;
