import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import SingleCSVUploader from './SingleCSVUploader';
import { processCSVData } from '../../services/supabaseService';

const { FiUpload, FiDownload, FiDatabase, FiInfo, FiCheck, FiPlus, FiRefreshCw } = FiIcons;

const DataUploadSection = ({ data, onDataUpdate, onNotification, onRefresh }) => {
  const [showUploader, setShowUploader] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadComplete = async (csvData) => {
    setIsProcessing(true);
    try {
      // Process and save CSV data to Supabase
      const results = await processCSVData(csvData);
      
      // Refresh data from database
      onRefresh();
      
      // Show summary message
      const totalRecords = Object.values(results).reduce((sum, count) => sum + count, 0);
      onNotification(
        `Upload complete! Added ${totalRecords} records: ${results.colleges} colleges, ${results.institutes} institutes, ${results.programs} programs, ${results.categories} categories, ${results.rounds} rounds.`,
        'success'
      );
      
      setShowUploader(false);
    } catch (error) {
      console.error('Error processing upload:', error);
      onNotification('Error processing upload: ' + error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSampleJOSAACSV = () => {
    const sampleData = [
      {
        Year: '2025',
        Round: '1',
        College: 'Indian Institute of Technology Bhubaneswar',
        Couse: 'Computer Science and Engineering (4 Years, Bachelor of Technology)',
        Quota: 'AI',
        'Seat Type': 'OPEN',
        Gender: 'Gender-Neutral',
        'Opening Rank': '2344',
        'Closing Rank': '3785'
      },
      {
        Year: '2025',
        Round: '1',
        College: 'Indian Institute of Technology Bhubaneswar',
        Couse: 'Computer Science and Engineering (4 Years, Bachelor of Technology)',
        Quota: 'AI',
        'Seat Type': 'OPEN',
        Gender: 'Female-only (including Supernumerary)',
        'Opening Rank': '4082',
        'Closing Rank': '6467'
      },
      {
        Year: '2025',
        Round: '1',
        College: 'Indian Institute of Technology Bhubaneswar',
        Couse: 'Electrical Engineering (4 Years, Bachelor of Technology)',
        Quota: 'AI',
        'Seat Type': 'OPEN',
        Gender: 'Gender-Neutral',
        'Opening Rank': '5585',
        'Closing Rank': '7242'
      },
      {
        Year: '2025',
        Round: '1',
        College: 'Indian Institute of Technology Bombay',
        Couse: 'Computer Science and Engineering (4 Years, Bachelor of Technology)',
        Quota: 'AI',
        'Seat Type': 'OPEN',
        Gender: 'Gender-Neutral',
        'Opening Rank': '1',
        'Closing Rank': '63'
      },
      {
        Year: '2025',
        Round: '1',
        College: 'Indian Institute of Technology Bombay',
        Couse: 'Aerospace Engineering (4 Years, Bachelor of Technology)',
        Quota: 'AI',
        'Seat Type': 'OPEN',
        Gender: 'Gender-Neutral',
        'Opening Rank': '1195',
        'Closing Rank': '2305'
      },
      {
        Year: '2025',
        Round: '1',
        College: 'Indian Institute of Technology Delhi',
        Couse: 'Computer Science and Engineering (4 Years, Bachelor of Technology)',
        Quota: 'AI',
        'Seat Type': 'OPEN',
        Gender: 'Gender-Neutral',
        'Opening Rank': '64',
        'Closing Rank': '118'
      },
      {
        Year: '2025',
        Round: '1',
        College: 'Indian Institute of Technology Madras',
        Couse: 'Computer Science and Engineering (4 Years, Bachelor of Technology)',
        Quota: 'AI',
        'Seat Type': 'OPEN',
        Gender: 'Gender-Neutral',
        'Opening Rank': '119',
        'Closing Rank': '184'
      },
      {
        Year: '2025',
        Round: '1',
        College: 'National Institute of Technology Tiruchirappalli',
        Couse: 'Computer Science and Engineering (4 Years, Bachelor of Technology)',
        Quota: 'AI',
        'Seat Type': 'OPEN',
        Gender: 'Gender-Neutral',
        'Opening Rank': '464',
        'Closing Rank': '589'
      },
      {
        Year: '2025',
        Round: '1',
        College: 'Indian Institute of Information Technology Allahabad',
        Couse: 'Information Technology (4 Years, Bachelor of Technology)',
        Quota: 'AI',
        'Seat Type': 'OPEN',
        Gender: 'Gender-Neutral',
        'Opening Rank': '1025',
        'Closing Rank': '1245'
      },
      {
        Year: '2025',
        Round: '2',
        College: 'Indian Institute of Technology Bhubaneswar',
        Couse: 'Computer Science and Engineering (4 Years, Bachelor of Technology)',
        Quota: 'AI',
        'Seat Type': 'EWS',
        Gender: 'Gender-Neutral',
        'Opening Rank': '426',
        'Closing Rank': '525'
      }
    ];

    const headers = ['Year', 'Round', 'College', 'Couse', 'Quota', 'Seat Type', 'Gender', 'Opening Rank', 'Closing Rank'];
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
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
    a.download = 'josaa_sample_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    onNotification('Sample JOSAA CSV file downloaded!', 'success');
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">JOSAA Data Upload Center</h2>
        <p className="text-gray-600">
          Upload your JOSAA cutoff data in the standard CSV format
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <SafeIcon icon={FiDatabase} className="text-2xl text-blue-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-blue-900 mb-2">
            📊 JOSAA CSV Upload (Append Mode)
          </h3>
          
          <p className="text-blue-700 mb-6 max-w-2xl mx-auto">
            Upload your JOSAA cutoff data directly from the official CSV format. 
            New data will be <strong>added</strong> to your existing database without replacing current records.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={() => setShowUploader(true)}
              className="flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <SafeIcon icon={FiRefreshCw} className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <SafeIcon icon={FiPlus} className="mr-2" />
                  Add JOSAA Data
                </>
              )}
            </button>
            
            <button
              onClick={generateSampleJOSAACSV}
              className="flex items-center justify-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
              disabled={isProcessing}
            >
              <SafeIcon icon={FiDownload} className="mr-2" />
              Download Sample CSV
            </button>
            
            <button
              onClick={onRefresh}
              className="flex items-center justify-center px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
              disabled={isProcessing}
            >
              <SafeIcon icon={FiRefreshCw} className="mr-2" />
              Refresh Data
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-blue-100 text-blue-800 text-sm rounded-full">
              ✓ Database Storage
            </span>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 text-sm rounded-full">
              ✓ Append Mode
            </span>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 text-sm rounded-full">
              ✓ Duplicate Detection
            </span>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 text-sm rounded-full">
              ✓ Smart Validation
            </span>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 text-sm rounded-full">
              ✓ Progress Tracking
            </span>
          </div>
        </div>
      </div>

      {/* Current Data Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SafeIcon icon={FiCheck} className="mr-2 text-green-500" />
          Current Data Summary
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.colleges}</div>
            <div className="text-sm text-gray-600">College Entries</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.institutes}</div>
            <div className="text-sm text-gray-600">Institutes</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{summary.programs}</div>
            <div className="text-sm text-gray-600">Programs</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{summary.categories}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.rounds}</div>
            <div className="text-sm text-gray-600">Rounds</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{totalRecords}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex">
          <SafeIcon icon={FiInfo} className="text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-amber-800 mb-2">JOSAA CSV Upload Guide (Append Mode)</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• <strong>Required Headers:</strong> Year, Round, College, Couse, Quota, Seat Type, Gender, Opening Rank, Closing Rank</li>
              <li>• <strong>Data Source:</strong> Use official JOSAA cutoff data from JoSAA website</li>
              <li>• <strong>Append Mode:</strong> New data is added to existing records, not replaced</li>
              <li>• <strong>Duplicate Handling:</strong> The system automatically detects and skips duplicate entries</li>
              <li>• <strong>Automatic Processing:</strong> The system will automatically:</li>
              <li className="ml-4">- Extract institute information from college names</li>
              <li className="ml-4">- Generate program codes from course names</li>
              <li className="ml-4">- Create category and round data</li>
              <li className="ml-4">- Assign institute types (IIT, NIT, IIIT, etc.)</li>
              <li>• <strong>Data Persistence:</strong> All data is now stored in a secure database</li>
              <li>• <strong>Manual Management:</strong> Use the Data Management section to edit or remove records</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New JOSAA CSV Data</h3>
              <button
                onClick={() => setShowUploader(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
                disabled={isProcessing}
              >
                ✕
              </button>
            </div>

            <SingleCSVUploader
              onUploadComplete={handleUploadComplete}
              onCancel={() => setShowUploader(false)}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DataUploadSection;