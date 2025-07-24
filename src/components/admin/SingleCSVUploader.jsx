import React, { useState, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiUpload, FiCheck, FiX, FiAlertCircle, FiFile, FiLoader, FiInfo, FiPlus } = FiIcons;

const SingleCSVUploader = ({ onUploadComplete, onCancel }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

    setIsProcessing(true);
    setUploadProgress(0);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = parseCSVLine(lines[0]);
        
        // Load existing data from localStorage
        const existingDataStr = localStorage.getItem('josaaAdminData');
        let existingData = {
          colleges: [],
          institutes: [],
          programs: [],
          categories: [],
          rounds: []
        };

        if (existingDataStr) {
          try {
            existingData = JSON.parse(existingDataStr);
          } catch (error) {
            console.error('Error parsing existing data:', error);
          }
        }

        const processedData = {
          colleges: [...existingData.colleges], // Start with existing data
          institutes: new Set(),
          programs: new Set(),
          categories: new Set(),
          rounds: new Set()
        };

        // Add existing unique values to Sets
        existingData.institutes?.forEach(item => {
          processedData.institutes.add(JSON.stringify(item));
        });
        existingData.programs?.forEach(item => {
          processedData.programs.add(JSON.stringify(item));
        });
        existingData.categories?.forEach(item => {
          processedData.categories.add(JSON.stringify(item));
        });
        existingData.rounds?.forEach(item => {
          processedData.rounds.add(JSON.stringify(item));
        });

        const totalLines = lines.length - 1; // Excluding header
        let processedLines = 0;
        let newRecordsAdded = 0;
        let duplicatesSkipped = 0;

        // Process in chunks to avoid UI freezing
        const CHUNK_SIZE = 100;
        const chunks = Math.ceil(totalLines / CHUNK_SIZE);

        // Get the current highest rank to continue numbering
        let currentMaxRank = Math.max(0, ...existingData.colleges.map(c => c.rank || 0));

        for (let chunk = 0; chunk < chunks; chunk++) {
          const start = chunk * CHUNK_SIZE + 1; // +1 to skip header
          const end = Math.min((chunk + 1) * CHUNK_SIZE + 1, lines.length);
          
          await new Promise(resolve => {
            setTimeout(() => {
              for (let i = start; i < end; i++) {
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

                // Check for duplicates based on key fields
                const isDuplicate = processedData.colleges.some(existing => 
                  existing.instituteName === row['College'] &&
                  existing.branch === row['Couse'] &&
                  existing.category === (row['Seat Type'] || 'OPEN') &&
                  existing.gender === (row['Gender'] || 'Gender-Neutral') &&
                  existing.round === (row['Round'] || 'Round-1') &&
                  existing.openingRank === parseRank(row['Opening Rank']) &&
                  existing.closingRank === parseRank(row['Closing Rank'])
                );

                if (isDuplicate) {
                  duplicatesSkipped++;
                  processedLines++;
                  continue;
                }

                // Transform the data to match your existing structure
                const collegeEntry = {
                  rank: ++currentMaxRank, // Increment rank for new entries
                  year: row['Year'] || '2025',
                  round: row['Round'] || 'Round-1',
                  instituteName: row['College'],
                  instituteCode: generateInstituteCode(row['College']),
                  location: extractLocation(row['College']),
                  instituteType: determineInstituteType(row['College']),
                  branch: row['Couse'],
                  duration: extractDuration(row['Couse']),
                  quota: row['Quota'] || 'AI',
                  category: row['Seat Type'] || 'OPEN',
                  gender: row['Gender'] || 'Gender-Neutral',
                  openingRank: parseRank(row['Opening Rank']),
                  closingRank: parseRank(row['Closing Rank'])
                };

                processedData.colleges.push(collegeEntry);
                newRecordsAdded++;

                // Collect unique values for other data types
                processedData.institutes.add(JSON.stringify({
                  value: collegeEntry.instituteCode,
                  label: collegeEntry.instituteName,
                  type: collegeEntry.instituteType,
                  location: collegeEntry.location
                }));

                processedData.programs.add(JSON.stringify({
                  value: generateProgramCode(row['Couse']),
                  label: row['Couse'],
                  duration: extractDuration(row['Couse']),
                  degree: extractDegree(row['Couse'])
                }));

                processedData.categories.add(JSON.stringify({
                  value: row['Seat Type'] || 'OPEN',
                  label: row['Seat Type'] || 'OPEN',
                  description: getCategoryDescription(row['Seat Type'] || 'OPEN')
                }));

                processedData.rounds.add(JSON.stringify({
                  value: `Round-${row['Round'] || '1'}`,
                  label: `Round ${row['Round'] || '1'}`,
                  year: row['Year'] || '2025',
                  status: 'Completed'
                }));

                processedLines++;
              }
              
              const progress = Math.round((processedLines / totalLines) * 100);
              setUploadProgress(progress);
              
              resolve();
            }, 0);
          });
        }

        // Convert Sets back to arrays
        const finalData = {
          colleges: processedData.colleges,
          institutes: Array.from(processedData.institutes).map(item => JSON.parse(item)),
          programs: Array.from(processedData.programs).map(item => JSON.parse(item)),
          categories: Array.from(processedData.categories).map(item => JSON.parse(item)),
          rounds: Array.from(processedData.rounds).map(item => JSON.parse(item))
        };

        // Ensure 100% at the end
        setUploadProgress(100);
        
        // Small delay to show 100% completion
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Show summary of what was added
        const summaryMessage = `Upload complete! Added ${newRecordsAdded} new records. ${duplicatesSkipped > 0 ? `Skipped ${duplicatesSkipped} duplicates.` : ''} Total records: ${finalData.colleges.length}`;
        
        onUploadComplete(finalData, summaryMessage);
        setIsProcessing(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error processing CSV:', error);
      setErrors([`Error processing file: ${error.message}`]);
      setIsProcessing(false);
    }
  };

  // Helper functions (same as before)
  const generateInstituteCode = (collegeName) => {
    if (collegeName.includes('IIT')) {
      const match = collegeName.match(/IIT\s+(\w+)/i);
      return match ? `IIT${match[1].substring(0, 3).toUpperCase()}` : 'IIT001';
    }
    if (collegeName.includes('NIT')) {
      const match = collegeName.match(/NIT\s+(\w+)/i);
      return match ? `NIT${match[1].substring(0, 3).toUpperCase()}` : 'NIT001';
    }
    if (collegeName.includes('IIIT')) {
      const match = collegeName.match(/IIIT\s+(\w+)/i);
      return match ? `IIIT${match[1].substring(0, 3).toUpperCase()}` : 'IIIT001';
    }
    return 'INST001';
  };

  const extractLocation = (collegeName) => {
    // Try to extract location from college name
    const locations = {
      'Bombay': 'Mumbai, Maharashtra',
      'Delhi': 'New Delhi, Delhi',
      'Madras': 'Chennai, Tamil Nadu',
      'Kanpur': 'Kanpur, Uttar Pradesh',
      'Kharagpur': 'Kharagpur, West Bengal',
      'Roorkee': 'Roorkee, Uttarakhand',
      'Guwahati': 'Guwahati, Assam',
      'Hyderabad': 'Hyderabad, Telangana',
      'Bhubaneswar': 'Bhubaneswar, Odisha',
      'Indore': 'Indore, Madhya Pradesh'
    };

    for (const [key, value] of Object.entries(locations)) {
      if (collegeName.includes(key)) {
        return value;
      }
    }
    return 'India';
  };

  const determineInstituteType = (collegeName) => {
    if (collegeName.includes('IIT')) return 'IIT';
    if (collegeName.includes('NIT')) return 'NIT';
    if (collegeName.includes('IIIT')) return 'IIIT';
    if (collegeName.includes('IIEST')) return 'IIEST';
    return 'GFTI';
  };

  const extractDuration = (courseName) => {
    if (courseName.includes('4 Years')) return '4 Years';
    if (courseName.includes('5 Years')) return '5 Years';
    if (courseName.includes('3 Years')) return '3 Years';
    if (courseName.includes('2 Years')) return '2 Years';
    return '4 Years'; // Default
  };

  const extractDegree = (courseName) => {
    if (courseName.includes('Bachelor of Technology')) return 'B.Tech';
    if (courseName.includes('Bachelor of Science')) return 'B.Sc';
    if (courseName.includes('Bachelor of Architecture')) return 'B.Arch';
    if (courseName.includes('Master of Technology')) return 'M.Tech';
    if (courseName.includes('Master of Science')) return 'M.Sc';
    return 'B.Tech'; // Default
  };

  const generateProgramCode = (courseName) => {
    // Generate a simple hash-based code
    let hash = 0;
    for (let i = 0; i < courseName.length; i++) {
      const char = courseName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString().substring(0, 4);
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      'OPEN': 'General Category',
      'EWS': 'Economically Weaker Section',
      'OBC-NCL': 'Other Backward Classes - Non Creamy Layer',
      'SC': 'Scheduled Caste',
      'ST': 'Scheduled Tribe',
      'OPEN (PwD)': 'General Category - Persons with Disability',
      'EWS (PwD)': 'EWS - Persons with Disability',
      'OBC-NCL (PwD)': 'OBC-NCL - Persons with Disability',
      'SC (PwD)': 'SC - Persons with Disability',
      'ST (PwD)': 'ST - Persons with Disability'
    };
    return descriptions[category] || category;
  };

  const parseRank = (rankStr) => {
    if (!rankStr) return 0;
    // Handle special cases like "50P" (PwD ranks)
    if (rankStr.includes('P')) {
      return parseInt(rankStr.replace('P', '')) || 0;
    }
    return parseInt(rankStr) || 0;
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
            <h4 className="text-sm font-medium text-blue-800 mb-2">Append Mode</h4>
            <div className="text-sm text-blue-700">
              <p className="mb-2">New data will be <strong>added</strong> to your existing database, not replaced.</p>
              <ul className="space-y-1 text-xs">
                <li>• Duplicate entries will be automatically detected and skipped</li>
                <li>• New records will be assigned sequential rank numbers</li>
                <li>• Your existing data remains safe and unchanged</li>
                <li>• Use the Data Management section to manually delete records if needed</li>
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
              Adding new JOSAA data to existing database...
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