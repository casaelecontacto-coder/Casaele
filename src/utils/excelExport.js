// src/utils/excelExport.js
// Utility functions for Excel export using native JavaScript (no external libraries)

/**
 * Convert JSON data to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Array of header objects with key and label
 * @returns {string} CSV formatted string
 */
function jsonToCSV(data, headers) {
  if (!data || data.length === 0) return '';

  // Create header row
  const headerRow = headers.map(h => `"${h.label}"`).join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(h => {
      let value = row[h.key];

      // Handle special cases
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else if (typeof value === 'string') {
        // Escape double quotes and wrap in quotes if contains comma or newline
        value = value.replace(/"/g, '""');
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = `"${value}"`;
        }
      }

      return value;
    }).join(',');
  }).join('\n');

  return `${headerRow}\n${dataRows}`;
}

/**
 * Download CSV file
 * @param {string} csvContent - CSV formatted string
 * @param {string} filename - Name of the file to download
 */
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export chapter data to Excel (CSV format)
 * @param {Object} chapterData - Chapter data from API
 */
export function exportChapterToExcel(chapterData) {
  if (!chapterData || !chapterData.embeds) {
    alert('No data to export');
    return;
  }

  const headers = [
    { key: 'sNo', label: 'S.No' },
    { key: 'title', label: 'Activity Title' },
    { key: 'type', label: 'Type' },
    { key: 'embedCode', label: 'Embed Code/URL' },
    { key: 'pageContext', label: 'Page Context' },
    { key: 'order', label: 'Order' },
    { key: 'createdAt', label: 'Created Date' },
    { key: 'updatedAt', label: 'Last Updated' },
    { key: 'id', label: 'ID' }
  ];

  const csvContent = jsonToCSV(chapterData.embeds, headers);
  const filename = `${chapterData.chapterName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

  downloadCSV(csvContent, filename);
}

/**
 * Export all chapters summary to Excel
 * @param {Array} chapters - Array of chapter objects
 */
export function exportAllChaptersToExcel(chapters) {
  if (!chapters || chapters.length === 0) {
    alert('No chapters to export');
    return;
  }

  const headers = [
    { key: 'sNo', label: 'S.No' },
    { key: 'name', label: 'Chapter Name' },
    { key: 'description', label: 'Description' },
    { key: 'embedCount', label: 'Total Activities' },
    { key: 'order', label: 'Order' },
    { key: 'isActive', label: 'Status' },
    { key: 'createdAt', label: 'Created Date' },
    { key: 'createdBy', label: 'Created By' }
  ];

  const data = chapters.map((chapter, index) => ({
    sNo: index + 1,
    name: chapter.name,
    description: chapter.description || '',
    embedCount: chapter.embedCount || 0,
    order: chapter.order,
    isActive: chapter.isActive ? 'Active' : 'Inactive',
    createdAt: new Date(chapter.createdAt).toLocaleString(),
    createdBy: chapter.createdBy
  }));

  const csvContent = jsonToCSV(data, headers);
  const filename = `All_Chapters_${new Date().toISOString().split('T')[0]}.csv`;

  downloadCSV(csvContent, filename);
}
