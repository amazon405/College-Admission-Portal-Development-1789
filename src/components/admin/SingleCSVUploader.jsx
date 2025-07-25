import React, { useState, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiUpload, FiCheck, FiX, FiAlertCircle, FiFile, FiLoader, FiInfo, FiPlus } = FiIcons;

const SingleCSVUploader = ({ onUploadComplete, onCancel, isProcessing = false }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Define the exact format based on your CSV structure
  const expectedHeaders = [
    'Year',
    'Round',
    'College',
    'Couse', // Note: keeping the original spelling from your CSV
    'Quota',
    'Seat Type',
    'Gender',
    'Opening Rank',
    'Closing Rank'
  ];

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
      
      const headers = parseCSVLine(lines[0]);
      
      const previewRows = lines.slice(1, 11).map(line => {
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
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        // Check if this is an escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip the next quote
        } else {
          inQuotes = false;
        }
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
      missingHeaders: [],
      extraHeaders: [],
      invalidRows: [],
      emptyRows: 0,
      totalRows: dataLines.length,
      validRows: 0,
      headerMismatch: false,
      dataPreview: []
    };

    // Check for required headers
    expectedHeaders.forEach(expectedHeader => {
      if (!headers.includes(expectedHeader)) {
        validation.missingHeaders.push(expectedHeader);
      }
    });

    // Check for extra headers
    headers.forEach(header => {
      if (!expectedHeaders.includes(header)) {
        validation.extraHeaders.push(header);
      }
    });

    // If headers don't match exactly, it's a mismatch
    if (validation.missingHeaders.length > 0 || validation.extraHeaders.length > 0) {
      validation.headerMismatch = true;
    }

    // Parse and validate each row
    dataLines.forEach((line, index) => {
      const values = parseCSVLine(line);
      
      if (values.length !== headers.length) {
        validation.invalidRows.push(index + 2); // +2 for header and 0-based index
        return;
      }

      if (values.every(val => !val.trim())) {
        validation.emptyRows++;
        return;
      }

      const row = {};
      headers.forEach((header, headerIndex) => {
        row[header] = values[headerIndex] || '';
      });

      // Basic validation for required fields
      if (row['College'] && row['Couse'] && row['Opening Rank'] && row['Closing Rank']) {
        validation.validRows++;
        
        // Add to preview if we have less than 5 samples
        if (validation.dataPreview.length < 5) {
          validation.dataPreview.push({
            college: row['College'],
            course: row['Couse'],
            category: row['Seat Type'],
            openingRank: row['Opening Rank'],
            closingRank: row['Closing Rank']
          });
        }
      } else {
        validation.invalidRows.push(index + 2);
      }
    });

    setValidationResults(validation);
  };

  const processCSVData = async () => {
    if (!file || !preview) return;
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = parseCSVLine(lines[0]);
        
        const parsedData = [];
        
        // Process each line
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const values = parseCSVLine(line);
          if (values.length !== headers.length) continue;
          
          const row = {};
          headers.forEach((header, headerIndex) => {
            row[header] = values[headerIndex] || '';
          });
          
          // Skip empty rows
          if (!row['College'] || !row['Couse']) continue;
          
          parsedData.push(row);
          
          // Update progress periodically
          if (i % 10 === 0) {
            setUploadProgress(Math.round((i / lines.length) * 100));
          }
        }
        
        // Ensure 100% at the end
        setUploadProgress(100);
        
        // Pass the parsed data to the parent component for further processing
        onUploadComplete(parsedData);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error processing CSV:', error);
      setErrors([`Error processing file: ${error.message}`]);
    }
  };

  const canProceed = preview && validationResults && 
    !validationResults.headerMismatch && 
    validationResults.invalidRows.length === 0 &&
    validationResults.validRows > 0;

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select JOSAA CSV File
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
            disabled={isProcessing}
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <SafeIcon icon={FiFile} className="text-3xl text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              {isProcessing ? 'Processing...' : 'Click to select JOSAA CSV file'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Expected format: Year, Round, College, Course, Quota, Seat Type, Gender, Opening Rank, Closing Rank
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

      {/* Append Mode Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <SafeIcon icon={FiPlus} className="text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">Database Persistence</h4>
            <div className="text-sm text-blue-700">
              <p className="mb-2">New data will be <strong>added</strong> to your database and stored securely.</p>
              <ul className="space-y-1 text-xs">
                <li>• All data is stored in a secure database for persistence</li>
                <li>• Duplicate entries will be automatically detected and skipped</li>
                <li>• New records will be assigned sequential rank numbers</li>
                <li>• Use the Data Management section to manually edit or delete records if needed</li>
              </ul>
            </div>
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

      {/* Validation Results */}
      {validationResults && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="font-medium text-gray-900 mb-2">Validation Results</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <SafeIcon icon={FiCheck} className="text-green-500 mr-2" />
              <span>Total rows: {validationResults.totalRows}</span>
            </div>
            
            <div className="flex items-center">
              <SafeIcon icon={FiCheck} className="text-green-500 mr-2" />
              <span>Valid rows: {validationResults.validRows}</span>
            </div>

            {validationResults.missingHeaders.length > 0 && (
              <div className="flex items-center">
                <SafeIcon icon={FiX} className="text-red-500 mr-2" />
                <span className="text-red-600">
                  Missing headers: {validationResults.missingHeaders.join(', ')}
                </span>
              </div>
            )}

            {validationResults.extraHeaders.length > 0 && (
              <div className="flex items-center">
                <SafeIcon icon={FiAlertCircle} className="text-yellow-500 mr-2" />
                <span className="text-yellow-600">
                  Extra headers: {validationResults.extraHeaders.join(', ')}
                </span>
              </div>
            )}

            {validationResults.invalidRows.length > 0 && (
              <div className="flex items-center">
                <SafeIcon icon={FiX} className="text-red-500 mr-2" />
                <span className="text-red-600">
                  Invalid rows: {validationResults.invalidRows.length > 10 
                    ? `${validationResults.invalidRows.slice(0, 10).join(', ')}... (${validationResults.invalidRows.length} total)`
                    : validationResults.invalidRows.join(', ')}
                </span>
              </div>
            )}

            {validationResults.emptyRows > 0 && (
              <div className="flex items-center">
                <SafeIcon icon={FiAlertCircle} className="text-yellow-500 mr-2" />
                <span className="text-yellow-600">
                  Empty rows: {validationResults.emptyRows} (will be skipped)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Preview */}
      {validationResults && validationResults.dataPreview.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-medium text-blue-800 mb-2">Data Preview</h4>
          <div className="space-y-2 text-sm">
            {validationResults.dataPreview.map((item, index) => (
              <div key={index} className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-800">{item.college}</div>
                <div className="text-gray-600">{item.course}</div>
                <div className="text-xs text-gray-500">
                  {item.category} • Ranks: {item.openingRank} - {item.closingRank}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Table */}
      {preview && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">CSV Preview (First 10 rows)</h4>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  {preview.headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b"
                    >
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
                        {String(row[header] || '').length > 30
                          ? `${String(row[header]).substring(0, 30)}...`
                          : String(row[header] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Showing {Math.min(10, preview.rows.length)} of {preview.totalRows} total rows
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-medium text-blue-800 mb-2">Processing JOSAA Data</h4>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {uploadProgress}% Complete
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div 
                style={{ width: `${uploadProgress}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
              ></div>
            </div>
            <div className="text-xs text-blue-600 flex items-center">
              <SafeIcon icon={FiLoader} className="animate-spin mr-2" />
              Adding new JOSAA data to database...
            </div>
          </div>
        </div>
      )}

      {/* Expected Format Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex">
          <SafeIcon icon={FiInfo} className="text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-amber-800 mb-2">Expected CSV Format</h4>
            <div className="text-sm text-amber-700">
              <p className="mb-2">Your CSV should have these exact headers:</p>
              <div className="bg-amber-100 p-2 rounded font-mono text-xs">
                Year, Round, College, Couse, Quota, Seat Type, Gender, Opening Rank, Closing Rank
              </div>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• <strong>Year:</strong> Year of admission (e.g., 2025)</li>
                <li>• <strong>Round:</strong> Round number (e.g., 1, 2, 3)</li>
                <li>• <strong>College:</strong> Full name of the institute</li>
                <li>• <strong>Couse:</strong> Course name with duration</li>
                <li>• <strong>Quota:</strong> Admission quota (e.g., AI, HS)</li>
                <li>• <strong>Seat Type:</strong> Category (OPEN, EWS, OBC-NCL, SC, ST, etc.)</li>
                <li>• <strong>Gender:</strong> Gender preference</li>
                <li>• <strong>Opening Rank:</strong> Opening rank for the course</li>
                <li>• <strong>Closing Rank:</strong> Closing rank for the course</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
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
              <SafeIcon icon={FiLoader} className="animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiPlus} className="mr-2" />
              Add JOSAA Data
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SingleCSVUploader;