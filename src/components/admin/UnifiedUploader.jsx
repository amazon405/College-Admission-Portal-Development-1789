import React, { useState, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiUpload, FiCheck, FiX, FiAlertCircle, FiFile, FiLoader, FiDownload, FiZap, FiInfo } = FiIcons;

const UnifiedUploader = ({ sections, onUploadComplete, onCancel }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [processingStatus, setProcessingStatus] = useState({
    stage: null, // 'extracting', 'parsing', 'validating', 'complete'
    currentFile: null,
    processedFiles: [],
    results: {}
  });

  const handleFileSelect = useCallback((event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && (selectedFile.type === 'application/zip' || 
                         selectedFile.type === 'application/x-zip-compressed' || 
                         selectedFile.name.endsWith('.zip'))) {
      setFile(selectedFile);
      setErrors([]);
      setProcessingStatus({
        stage: null,
        currentFile: null,
        processedFiles: [],
        results: {}
      });
    } else {
      setErrors(['Please select a valid ZIP file containing CSV data files']);
    }
  }, []);

  const parseCSV = (text, sectionId) => {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return { 
          success: false, 
          error: `CSV file for ${sectionId} must contain at least a header row and one data row` 
        };
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Find the matching section configuration
      const sectionConfig = sections.find(s => s.id === sectionId);
      if (!sectionConfig) {
        return { 
          success: false, 
          error: `Unknown section type: ${sectionId}` 
        };
      }
      
      // Check required fields
      const missingFields = sectionConfig.fields.filter(field => !headers.includes(field));
      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Missing required fields in ${sectionId}: ${missingFields.join(', ')}`
        };
      }

      // Parse data rows
      const data = [];
      let skippedRows = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          skippedRows++;
          continue;
        }
        
        const values = parseCSVLine(line);
        if (values.length !== headers.length) {
          skippedRows++;
          continue;
        }
        
        const row = {};
        headers.forEach((header, index) => {
          let value = values[index] || '';
          
          // Type conversion based on field names
          if (header.includes('rank') || header.includes('Rank')) {
            value = parseInt(value) || 0;
          } else if (header.includes('date') || header.includes('Date')) {
            // Keep date as string for now
            value = value.toString();
          } else {
            value = value.replace(/"/g, '').trim();
          }
          
          row[header] = value;
        });
        
        // Only add row if it has some non-empty values
        if (Object.values(row).some(val => val !== '' && val !== 0)) {
          data.push(row);
        } else {
          skippedRows++;
        }
      }
      
      return {
        success: true,
        data,
        skippedRows,
        totalRows: lines.length - 1
      };
    } catch (error) {
      console.error(`Error parsing CSV for ${sectionId}:`, error);
      return {
        success: false,
        error: `Failed to parse ${sectionId} data: ${error.message}`
      };
    }
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const processZipFile = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setErrors([]);
    setProcessingStatus({
      stage: 'extracting',
      currentFile: null,
      processedFiles: [],
      results: {}
    });
    
    try {
      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default;
      
      // Read the zip file
      const zip = await JSZip.loadAsync(file);
      const results = {};
      const errors = [];
      
      // Process each file in the zip
      const fileEntries = Object.entries(zip.files).filter(([name, file]) => !file.dir);
      
      for (const [name, zipEntry] of fileEntries) {
        // Update processing status
        setProcessingStatus(prev => ({
          ...prev,
          stage: 'parsing',
          currentFile: name
        }));
        
        // Skip files that don't match our section names or aren't CSV
        const fileNameWithoutExt = name.split('/').pop().split('.')[0].toLowerCase();
        const matchingSection = sections.find(s => s.id === fileNameWithoutExt);
        
        if (!matchingSection || !name.toLowerCase().endsWith('.csv')) {
          // Not a recognized data file - skip it
          setProcessingStatus(prev => ({
            ...prev,
            processedFiles: [...prev.processedFiles, {
              name,
              status: 'skipped',
              reason: 'Not a recognized data file'
            }]
          }));
          continue;
        }
        
        // Extract and parse the CSV content
        const content = await zipEntry.async('text');
        
        setProcessingStatus(prev => ({
          ...prev,
          stage: 'validating'
        }));
        
        // Parse the CSV data for this section
        const parseResult = parseCSV(content, fileNameWithoutExt);
        
        if (parseResult.success) {
          results[fileNameWithoutExt] = parseResult.data;
          setProcessingStatus(prev => ({
            ...prev,
            processedFiles: [...prev.processedFiles, {
              name,
              status: 'success',
              recordCount: parseResult.data.length,
              skippedRows: parseResult.skippedRows,
              totalRows: parseResult.totalRows
            }],
            results: { ...prev.results, [fileNameWithoutExt]: parseResult.data }
          }));
        } else {
          errors.push(parseResult.error);
          setProcessingStatus(prev => ({
            ...prev,
            processedFiles: [...prev.processedFiles, {
              name,
              status: 'error',
              error: parseResult.error
            }]
          }));
        }
        
        // Small delay to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Update final status
      setProcessingStatus(prev => ({
        ...prev,
        stage: 'complete'
      }));
      
      if (errors.length > 0) {
        setErrors(errors);
      } else if (Object.keys(results).length === 0) {
        setErrors(['No valid data files found in the ZIP. Please ensure CSV files are named correctly (e.g., colleges.csv, institutes.csv, etc.)']);
      } else {
        // Success! Pass the data up to the parent component
        onUploadComplete(results);
      }
    } catch (error) {
      console.error('Error processing ZIP file:', error);
      setErrors([`Failed to process ZIP file: ${error.message}`]);
      
      setProcessingStatus(prev => ({
        ...prev,
        stage: 'error'
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'skipped': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return FiCheck;
      case 'error': return FiX;
      case 'skipped': return FiAlertCircle;
      default: return FiInfo;
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select ZIP File Containing Data Files
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            className="hidden"
            id="zip-upload"
            disabled={isProcessing}
          />
          <label
            htmlFor="zip-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <SafeIcon icon={FiFile} className="text-3xl text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              {isProcessing ? 'Processing...' : 'Click to select ZIP file or drag and drop'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              ZIP file should contain CSV files named after data sections (e.g., colleges.csv)
            </span>
          </label>
        </div>
        
        {file && !isProcessing && (
          <div className="mt-2 text-sm text-gray-600 flex items-center">
            <SafeIcon icon={FiFile} className="mr-1" />
            <span>Selected file: {file.name} ({Math.round(file.size / 1024)} KB)</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <SafeIcon icon={FiInfo} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-700">Instructions</h4>
            <ul className="mt-1 text-sm text-blue-600 list-disc list-inside space-y-1">
              <li>ZIP file should contain separate CSV files for each data type</li>
              <li>Each CSV file must be named exactly after its data type (e.g., <code>colleges.csv</code>, <code>institutes.csv</code>)</li>
              <li>Each CSV must have the required column headers for its data type</li>
              <li>Download the templates to see the required format for each file</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <SafeIcon icon={FiAlertCircle} className="text-red-500 mr-2" />
            <span className="text-red-700 font-medium">Errors:</span>
          </div>
          <ul className="mt-2 text-sm text-red-600">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Processing Status */}
      {processingStatus.stage && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="font-medium text-gray-900 mb-3">Processing Status</h4>
          
          {processingStatus.stage !== 'complete' && (
            <div className="flex items-center mb-4">
              <SafeIcon icon={FiLoader} className="animate-spin text-blue-500 mr-2" />
              <span className="text-blue-700">
                {processingStatus.stage === 'extracting' && 'Extracting files from ZIP...'}
                {processingStatus.stage === 'parsing' && `Parsing ${processingStatus.currentFile}...`}
                {processingStatus.stage === 'validating' && `Validating ${processingStatus.currentFile}...`}
              </span>
            </div>
          )}
          
          {processingStatus.processedFiles.length > 0 && (
            <div className="space-y-2 text-sm">
              <h5 className="font-medium text-gray-700">Processed Files:</h5>
              <div className="max-h-40 overflow-y-auto">
                {processingStatus.processedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <div className="flex items-center">
                      <SafeIcon icon={getStatusIcon(file.status)} className={`mr-2 ${getStatusColor(file.status)}`} />
                      <span className="text-gray-700">{file.name}</span>
                    </div>
                    <div>
                      {file.status === 'success' && (
                        <span className="text-green-600">
                          {file.recordCount} records processed 
                          {file.skippedRows > 0 && ` (${file.skippedRows} rows skipped)`}
                        </span>
                      )}
                      {file.status === 'error' && (
                        <span className="text-red-600">Failed</span>
                      )}
                      {file.status === 'skipped' && (
                        <span className="text-yellow-600">Skipped: {file.reason}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {processingStatus.stage === 'complete' && (
            <div className="flex items-center text-green-600">
              <SafeIcon icon={FiCheck} className="mr-2" />
              <span>Processing complete!</span>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {processingStatus.stage === 'complete' && Object.keys(processingStatus.results).length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h4 className="font-medium text-green-800 mb-2 flex items-center">
            <SafeIcon icon={FiZap} className="mr-2" />
            Upload Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(processingStatus.results).map(([section, data]) => (
              <div key={section} className="bg-white rounded-md p-3 shadow-sm">
                <h5 className="font-medium text-gray-700 capitalize">{section}</h5>
                <div className="text-green-600 text-sm">
                  {data.length} records ready to upload
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          disabled={isProcessing}
        >
          Cancel
        </button>
        
        <button
          onClick={processZipFile}
          disabled={!file || isProcessing || processingStatus.stage === 'complete'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {isProcessing ? (
            <>
              <SafeIcon icon={FiLoader} className="animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiUpload} className="mr-2" />
              Process ZIP File
            </>
          )}
        </button>
        
        {processingStatus.stage === 'complete' && Object.keys(processingStatus.results).length > 0 && (
          <button
            onClick={() => onUploadComplete(processingStatus.results)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <SafeIcon icon={FiCheck} className="mr-2" />
            Complete Upload
          </button>
        )}
      </div>
    </div>
  );
};

export default UnifiedUploader;