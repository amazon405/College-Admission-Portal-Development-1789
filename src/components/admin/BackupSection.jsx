import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiDownload, FiUpload, FiSave, FiRefreshCw, FiDatabase } = FiIcons;

const BackupSection = ({ data, onNotification }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const exportToCSV = (sectionData, filename) => {
    if (!sectionData || sectionData.length === 0) {
      onNotification('No data to export', 'error');
      return;
    }

    const headers = Object.keys(sectionData[0]);
    const csvContent = [
      headers.join(','),
      ...sectionData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAllData = async () => {
    setIsExporting(true);
    
    try {
      // Export each section as separate CSV
      const sections = [
        { key: 'colleges', name: 'colleges_data' },
        { key: 'institutes', name: 'institutes_data' },
        { key: 'programs', name: 'programs_data' },
        { key: 'categories', name: 'categories_data' },
        { key: 'rounds', name: 'rounds_data' }
      ];

      for (const section of sections) {
        if (data[section.key] && data[section.key].length > 0) {
          exportToCSV(data[section.key], section.name);
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between downloads
        }
      }

      onNotification('All data exported successfully!', 'success');
    } catch (error) {
      onNotification('Error exporting data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const exportBackupJSON = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: data
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `josaa_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    onNotification('Backup file created successfully!', 'success');
  };

  const importBackupJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        
        if (backupData.data) {
          // Validate backup structure
          const requiredSections = ['colleges', 'institutes', 'programs', 'categories', 'rounds'];
          const hasValidStructure = requiredSections.every(section => 
            Array.isArray(backupData.data[section])
          );

          if (hasValidStructure) {
            localStorage.setItem('josaaAdminData', JSON.stringify(backupData.data));
            onNotification('Backup imported successfully! Please refresh the page.', 'success');
          } else {
            onNotification('Invalid backup file structure', 'error');
          }
        } else {
          onNotification('Invalid backup file format', 'error');
        }
      } catch (error) {
        onNotification('Error reading backup file', 'error');
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('josaaAdminData');
      onNotification('All data cleared. Please refresh the page.', 'success');
    }
  };

  const getDataSummary = () => {
    return {
      colleges: data.colleges?.length || 0,
      institutes: data.institutes?.length || 0,
      programs: data.programs?.length || 0,
      categories: data.categories?.length || 0,
      rounds: data.rounds?.length || 0
    };
  };

  const summary = getDataSummary();
  const totalRecords = Object.values(summary).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Backup & Export</h2>
        <p className="text-gray-600">Manage your data backups and exports</p>
      </div>

      {/* Data Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.colleges}</div>
            <div className="text-sm text-gray-500">Colleges</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.institutes}</div>
            <div className="text-sm text-gray-500">Institutes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{summary.programs}</div>
            <div className="text-sm text-gray-500">Programs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.categories}</div>
            <div className="text-sm text-gray-500">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.rounds}</div>
            <div className="text-sm text-gray-500">Rounds</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalRecords}</div>
            <div className="text-sm text-gray-500">Total Records</div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
          <div className="space-y-4">
            <button
              onClick={exportAllData}
              disabled={isExporting || totalRecords === 0}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <SafeIcon icon={FiRefreshCw} className="animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <SafeIcon icon={FiDownload} className="mr-2" />
                  Export All as CSV
                </>
              )}
            </button>

            <div className="text-sm text-gray-500">
              Exports each data section as separate CSV files
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Individual Exports</h4>
              <div className="space-y-2">
                {Object.entries(summary).map(([key, count]) => (
                  <button
                    key={key}
                    onClick={() => exportToCSV(data[key], `${key}_data`)}
                    disabled={count === 0}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="capitalize">{key}</span>
                    <span className="text-sm">({count} records)</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Management</h3>
          <div className="space-y-4">
            <button
              onClick={exportBackupJSON}
              disabled={totalRecords === 0}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={FiSave} className="mr-2" />
              Create Full Backup
            </button>

            <div className="text-sm text-gray-500">
              Creates a JSON backup file with all data
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restore from Backup
              </label>
              <input
                type="file"
                accept=".json"
                onChange={importBackupJSON}
                disabled={isImporting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              {isImporting && (
                <div className="mt-2 text-sm text-blue-600">
                  <SafeIcon icon={FiRefreshCw} className="animate-spin inline mr-1" />
                  Importing backup...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-700 font-medium">Clear All Data</p>
            <p className="text-sm text-red-600">This will permanently delete all stored data</p>
          </div>
          <button
            onClick={clearAllData}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <SafeIcon icon={FiDatabase} className="mr-2" />
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupSection;