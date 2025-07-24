import React, { useState, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiUpload, FiCheck, FiX, FiAlertCircle, FiFile } = FiIcons;

const CSVUploader = ({ section, onUploadComplete, onCancel }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [validationResults, setValidationResults] = useState(null);

  const handleFileSelect = useCallback((event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setErrors([]);
      parseCSVPreview(selectedFile);
    } else {
      setErrors(['Please select a valid CSV file']);
    }
  }, []);

  const parseCSVPreview = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setErrors(['CSV file must contain at least a header row and one data row']);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const previewRows = lines.slice(1, 6).map(line => {
        const values = parseCSVLine(line);
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || '';
          return obj;
        }, {});
      });

      setPreview({
        headers,
        rows: previewRows,
        totalRows: lines.length - 1
      });

      validateCSVStructure(headers, lines.slice(1));
    };
    reader.readAsText(file);
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

  const validateCSVStructure = (headers, dataLines) => {
    const validation = {
      missingFields: [],
      extraFields: [],
      emptyRows: 0,
      invalidRows: [],
      totalRows: dataLines.length
    };

    // Check for required fields
    section.fields.forEach(field => {
      if (!headers.includes(field)) {
        validation.missingFields.push(field);
      }
    });

    // Check for extra fields
    headers.forEach(header => {
      if (!section.fields.includes(header)) {
        validation.extraFields.push(header);
      }
    });

    // Validate data rows
    dataLines.forEach((line, index) => {
      const values = parseCSVLine(line);
      if (values.length !== headers.length) {
        validation.invalidRows.push(index + 2); // +2 for header and 0-based index
      }
      if (values.every(val => !val.trim())) {
        validation.emptyRows++;
      }
    });

    setValidationResults(validation);
  };

  const processCSVData = () => {
    if (!file || !preview) return;

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const data = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
        const row = {};
        
        headers.forEach((header, headerIndex) => {
          let value = values[headerIndex] || '';
          
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
        
        return row;
      }).filter(row => Object.values(row).some(val => val !== '' && val !== 0));

      onUploadComplete(data);
      setIsProcessing(false);
    };
    
    reader.readAsText(file);
  };

  const canProceed = preview && validationResults && 
    validationResults.missingFields.length === 0 && 
    validationResults.invalidRows.length === 0;

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select CSV File
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <SafeIcon icon={FiFile} className="text-3xl text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              Click to select CSV file or drag and drop
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Maximum file size: 10MB
            </span>
          </label>
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

      {/* Validation Results */}
      {validationResults && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="font-medium text-gray-900 mb-2">Validation Results</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <SafeIcon icon={FiCheck} className="text-green-500 mr-2" />
              <span>Total rows: {validationResults.totalRows}</span>
            </div>
            
            {validationResults.missingFields.length > 0 && (
              <div className="flex items-center">
                <SafeIcon icon={FiX} className="text-red-500 mr-2" />
                <span className="text-red-600">
                  Missing required fields: {validationResults.missingFields.join(', ')}
                </span>
              </div>
            )}
            
            {validationResults.extraFields.length > 0 && (
              <div className="flex items-center">
                <SafeIcon icon={FiAlertCircle} className="text-yellow-500 mr-2" />
                <span className="text-yellow-600">
                  Extra fields (will be ignored): {validationResults.extraFields.join(', ')}
                </span>
              </div>
            )}
            
            {validationResults.invalidRows.length > 0 && (
              <div className="flex items-center">
                <SafeIcon icon={FiX} className="text-red-500 mr-2" />
                <span className="text-red-600">
                  Invalid rows: {validationResults.invalidRows.join(', ')}
                </span>
              </div>
            )}

            {validationResults.emptyRows > 0 && (
              <div className="flex items-center">
                <SafeIcon icon={FiAlertCircle} className="text-yellow-500 mr-2" />
                <span className="text-yellow-600">
                  Empty rows found: {validationResults.emptyRows} (will be skipped)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Preview (First 5 rows)</h4>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  {preview.headers.map((header, index) => (
                    <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {preview.headers.map((header, headerIndex) => (
                      <td key={headerIndex} className="px-4 py-2 text-sm text-gray-900">
                        {String(row[header] || '').length > 50 
                          ? `${String(row[header]).substring(0, 50)}...` 
                          : String(row[header] || '')
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Showing {Math.min(5, preview.rows.length)} of {preview.totalRows} total rows
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={processCSVData}
          disabled={!canProceed || isProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {isProcessing ? (
            <>
              <SafeIcon icon={FiUpload} className="animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiUpload} className="mr-2" />
              Upload Data
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CSVUploader;