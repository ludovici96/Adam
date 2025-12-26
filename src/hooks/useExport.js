import { useCallback } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { useUI } from '../context/UIContext';

export function useExport() {
  const { matches, stats } = useAnalysis();
  const { setExportState } = useUI();

  const exportCSV = useCallback(() => {
    setExportState(true, 'csv');

    try {
      const headers = [
        'RSID',
        'Chromosome',
        'Position',
        'Genotype',
        'Magnitude',
        'Repute',
        'Category',
        'Summary'
      ];

      const rows = matches.map(match => [
        match.rsid || '',
        match.chrom || '',
        match.pos || '',
        match.userGenotype || '',
        match.magnitude || 0,
        match.repute || '',
        match.category || '',
        `"${(match.summary || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dna-genesis-results-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportState(false);
    }
  }, [matches, setExportState]);

  const exportJSON = useCallback(() => {
    setExportState(true, 'json');

    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        stats,
        matches: matches.map(match => ({
          rsid: match.rsid,
          chromosome: match.chrom,
          position: match.pos,
          genotype: match.userGenotype,
          magnitude: match.magnitude,
          repute: match.repute,
          category: match.category,
          summary: match.summary
        }))
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dna-genesis-results-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportState(false);
    }
  }, [matches, stats, setExportState]);

  const exportPDF = useCallback(async () => {
    setExportState(true, 'pdf');

    try {
      // Dynamic import to keep bundle size small
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Title
      doc.setFontSize(24);
      doc.text('DNA Genesis Report', 20, 20);

      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Variants Analyzed: ${stats.totalVariants.toLocaleString()}`, 20, 35);
      doc.text(`Significant Matches: ${matches.filter(m => (m.magnitude || 0) >= 2).length}`, 20, 40);

      let yPos = 55;
      const pageHeight = doc.internal.pageSize.height;

      // Filter for notable matches first
      const notableMatches = matches
        .filter(m => (m.magnitude || 0) >= 2)
        .sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0));

      doc.setFontSize(16);
      doc.text('Notable Findings', 20, 50);

      doc.setFontSize(12);

      notableMatches.forEach((match, index) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }

        // Rsid and Magnitude
        doc.setFont(undefined, 'bold');
        doc.text(`${match.rsid} (Mag: ${match.magnitude})`, 20, yPos);

        // Genotype and Repute
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        const reputeText = match.repute ? ` - Impact: ${match.repute}` : '';
        doc.text(`Genotype: ${match.userGenotype}${reputeText}`, 20, yPos + 5);

        // Summary - wrap text
        const summary = doc.splitTextToSize(match.summary || 'No summary available.', 170);
        doc.text(summary, 20, yPos + 10);

        yPos += 15 + (summary.length * 4);
      });

      doc.save(`dna-genesis-report-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportState(false);
    }
  }, [matches, stats, setExportState]);

  return { exportCSV, exportJSON, exportPDF };
}

export default useExport;
