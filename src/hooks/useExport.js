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

  return { exportCSV, exportJSON };
}

export default useExport;
