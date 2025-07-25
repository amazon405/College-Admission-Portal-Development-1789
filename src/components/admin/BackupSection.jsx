import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { fetchAllData } from '../../services/supabaseService';

const { FiDownload, FiUpload, FiSave, FiRefreshCw, FiDatabase, FiServer } = FiIcons;

const BackupSection = ({ data, onNotification }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const exportToCSV = (sectionData, filename) => {
    if (!sectionData || sectionData.length === 0) {
      onNotification('No data to export', 'error');
      return;
    }

    const headers = Object.keys(sectionData[0]);
    const csvContent = [
      headers.join(','),
      ...sectionData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Properly escape values with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return `${value}`;
        }).join(',')
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
      console.error('Error exporting data:', error);
      onNotification('Error exporting data: ' + error.message, 'error');
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
            onNotification('Backup imported successfully to local cache! Please note this does not update the database.', 'success');
          } else {
            onNotification('Invalid backup file structure', 'error');
          }
        } else {
          onNotification('Invalid backup file format', 'error');
        }
      } catch (error) {
        onNotification('Error reading backup file: ' + error.message, 'error');
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const refreshFromDatabase = async () => {
    setIsRefreshing(true);
    try {
      const freshData = await fetchAllData();
      
      // Update local cache
      localStorage.setItem('josaaAdminData', JSON.stringify(freshData));
      
      onNotification('Data refreshed successfully from database!', 'success');
      
      // Reload the page to show the new data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing data:', error);
      onNotification('Error refreshing data: ' + error.message, 'error');
    } finally {
      setIsRefreshing(false);
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

      {/* Database Sync */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
          <SafeIcon icon={FiServer} className="mr-2" />
          Database Synchronization
        </h3>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-indigo-700 mb-2">Refresh data from the database to ensure you have the latest records.</p>
            <p className="text-sm text-indigo-600">This will update your local view with the current database state.</p>
          </div>
          <button
            onClick={refreshFromDatabase}
            disabled={isRefreshing}
            className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isRefreshing ? (
              <>
                <SafeIcon icon={FiRefreshCw} className="animate-spin mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <SafeIcon icon={FiRefreshCw} className="mr-2" />
                Refresh From Database
              </>
            )}
          </button>
        </div>
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
                    disabled={count === 0 || isExporting}
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
              disabled={totalRecords === 0 || isExporting}
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
                Import Local Backup (Cache Only)
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
              <div className="mt-2 text-xs text-amber-600">
                <strong>Note:</strong> This only updates your local cache, not the database. Use with caution.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <SafeIcon icon={FiDatabase} className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-md font-medium text-yellow-800 mb-2">Database Management</h4>
            <p className="text-sm text-yellow-700 mb-2">
              The admin dashboard is now connected to a database for persistent storage. All data is stored securely in the database.
            </p>
            <ul className="text-sm text-yellow-700 list-disc pl-5 space-y-1">
              <li>Use the <strong>Data Management</strong> section to add, edit, or delete records in the database</li>
              <li>Use the <strong>Refresh From Database</strong> button above to ensure you're viewing the latest data</li>
              <li>The local backup feature only updates your browser's local cache, not the actual database</li>
              <li>For full database management, please contact the system administrator</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupSection;