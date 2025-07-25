import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const {
  FiChevronUp, 
  FiChevronDown, 
  FiMapPin, 
  FiBook, 
  FiUsers, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDownload,
  FiFilter,
  FiArrowRight,
  FiSearch,
  FiX,
  FiInfo,
  FiClock
} = FiIcons;

const ResultsTable = ({ results }) => {
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [tableFilter, setTableFilter] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState({
    rank: true,
    instituteName: true,
    branch: true,
    category: true,
    gender: true,
    openingRank: true,
    closingRank: true,
    round: true,
    location: false,
    duration: false,
    instituteType: false
  });

  // Apply table filtering
  useEffect(() => {
    if (!tableFilter) {
      setFilteredResults(results);
      return;
    }
    
    const filtered = results.filter(college => 
      Object.entries(college).some(([key, value]) => {
        // Only search in text fields
        if (typeof value === 'string') {
          return value.toLowerCase().includes(tableFilter.toLowerCase());
        }
        return false;
      })
    );
    
    setFilteredResults(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [tableFilter, results]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const sortedResults = [...filteredResults].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue || '').toLowerCase();
    const bStr = String(bValue || '').toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = sortedResults.slice(startIndex, endIndex);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <SafeIcon icon={FiChevronUp} className="ml-1 text-blue-600" /> : 
      <SafeIcon icon={FiChevronDown} className="ml-1 text-blue-600" />;
  };

  const exportToCSV = () => {
    const visibleFields = Object.entries(visibleColumns)
      .filter(([_, isVisible]) => isVisible)
      .map(([field]) => field);
    
    const headers = visibleFields.map(field => {
      switch(field) {
        case 'instituteName': return 'Institute Name';
        case 'openingRank': return 'Opening Rank';
        case 'closingRank': return 'Closing Rank';
        case 'instituteType': return 'Institute Type';
        default: return field.charAt(0).toUpperCase() + field.slice(1);
      }
    });
    
    const csvContent = [
      headers.join(','),
      ...sortedResults.map(college => 
        visibleFields.map(field => {
          const value = college[field];
          // Properly escape values with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return `${value || ''}`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `josaa_search_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRankTrend = (rank) => {
    // Simple trend indicator based on rank
    if (rank <= 100) return { icon: FiTrendingUp, color: 'text-green-600', label: 'Excellent' };
    if (rank <= 1000) return { icon: FiTrendingUp, color: 'text-blue-600', label: 'Very Good' };
    if (rank <= 5000) return { icon: FiTrendingUp, color: 'text-yellow-600', label: 'Good' };
    return { icon: FiTrendingDown, color: 'text-gray-600', label: 'Moderate' };
  };

  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  // Column visibility management
  const [showColumnManager, setShowColumnManager] = useState(false);

  return (
    <div className="p-6">
      {/* Results Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            Search Results ({filteredResults.length} colleges found)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredResults.length)} of {filteredResults.length} results
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          {/* Table Filter */}
          <div className="relative">
            <input
              type="text"
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              placeholder="Filter results..."
              className="px-3 py-2 pl-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {tableFilter && (
              <button 
                onClick={() => setTableFilter('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            )}
          </div>
          
          {/* Column Manager Button */}
          <button
            onClick={() => setShowColumnManager(!showColumnManager)}
            className="px-3 py-2 border border-gray-300 bg-white rounded-md hover:bg-gray-50 text-gray-700 flex items-center"
          >
            <SafeIcon icon={FiFilter} className="mr-1" />
            Columns
          </button>
          
          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <SafeIcon icon={FiDownload} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>
      
      {/* Column Manager */}
      {showColumnManager && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <SafeIcon icon={FiFilter} className="mr-1" /> 
            Manage Visible Columns
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(visibleColumns).map(([column, isVisible]) => (
              <label key={column} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggleColumn(column)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {column === 'instituteName' ? 'Institute Name' : 
                   column === 'openingRank' ? 'Opening Rank' :
                   column === 'closingRank' ? 'Closing Rank' :
                   column === 'instituteType' ? 'Institute Type' : column}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.rank && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('rank')}
                >
                  <div className="flex items-center">
                    Rank
                    <SortIcon field="rank" />
                  </div>
                </th>
              )}
              
              {visibleColumns.instituteName && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('instituteName')}
                >
                  <div className="flex items-center">
                    Institute
                    <SortIcon field="instituteName" />
                  </div>
                </th>
              )}
              
              {visibleColumns.branch && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('branch')}
                >
                  <div className="flex items-center">
                    Branch
                    <SortIcon field="branch" />
                  </div>
                </th>
              )}
              
              {visibleColumns.category && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
              )}
              
              {visibleColumns.gender && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
              )}
              
              {visibleColumns.openingRank && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('openingRank')}
                >
                  <div className="flex items-center">
                    Opening Rank
                    <SortIcon field="openingRank" />
                  </div>
                </th>
              )}
              
              {visibleColumns.closingRank && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('closingRank')}
                >
                  <div className="flex items-center">
                    Closing Rank
                    <SortIcon field="closingRank" />
                  </div>
                </th>
              )}
              
              {visibleColumns.round && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('round')}
                >
                  <div className="flex items-center">
                    Round
                    <SortIcon field="round" />
                  </div>
                </th>
              )}
              
              {visibleColumns.location && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center">
                    Location
                    <SortIcon field="location" />
                  </div>
                </th>
              )}
              
              {visibleColumns.duration && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              )}
              
              {visibleColumns.instituteType && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('instituteType')}
                >
                  <div className="flex items-center">
                    Type
                    <SortIcon field="instituteType" />
                  </div>
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {currentResults.map((college, index) => {
              const trend = getRankTrend(college.closingRank);
              return (
                <tr key={`${college.rank}-${index}`} className="hover:bg-gray-50 transition-colors">
                  {visibleColumns.rank && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                          #{college.rank}
                          <SafeIcon icon={trend.icon} className={`ml-1 ${trend.color}`} />
                        </div>
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.instituteName && (
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {college.instituteName}
                          </div>
                          
                          {visibleColumns.location && (
                            <div className="flex items-center text-xs text-gray-500">
                              <SafeIcon icon={FiMapPin} className="mr-1" />
                              {college.location}
                            </div>
                          )}
                          
                          {visibleColumns.instituteType && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                college.instituteType === 'IIT' ? 'bg-red-100 text-red-800' :
                                college.instituteType === 'NIT' ? 'bg-green-100 text-green-800' :
                                college.instituteType === 'IIIT' ? 'bg-purple-100 text-purple-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {college.instituteType}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.branch && (
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <SafeIcon icon={FiBook} className="text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {college.branch}
                          </div>
                          {visibleColumns.duration && (
                            <div className="text-xs text-gray-500">
                              <SafeIcon icon={FiClock} className="mr-1 inline-block" />
                              {college.duration}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.category && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        {college.category}
                      </span>
                    </td>
                  )}
                  
                  {visibleColumns.gender && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <SafeIcon icon={FiUsers} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{college.gender}</span>
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.openingRank && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {college.openingRank?.toLocaleString() || 'N/A'}
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.closingRank && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">
                        {college.closingRank?.toLocaleString() || 'N/A'}
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.round && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {college.round}
                      </span>
                    </td>
                  )}
                  
                  {visibleColumns.location && !visibleColumns.instituteName && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <SafeIcon icon={FiMapPin} className="mr-1" />
                        {college.location}
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.duration && !visibleColumns.branch && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {college.duration}
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.instituteType && !visibleColumns.instituteName && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        college.instituteType === 'IIT' ? 'bg-red-100 text-red-800' :
                        college.instituteType === 'NIT' ? 'bg-green-100 text-green-800' :
                        college.instituteType === 'IIIT' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {college.instituteType}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* No Results */}
      {currentResults.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          <SafeIcon icon={FiInfo} className="text-4xl mx-auto mb-4" />
          <p className="text-lg">No results match your current filter</p>
          {tableFilter && (
            <button 
              onClick={() => setTableFilter('')} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between mt-6 gap-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex items-center space-x-2">
            <select 
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="hidden md:flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 border rounded-md text-sm ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          <div className="text-sm text-gray-500 md:hidden">
            {startIndex + 1} - {Math.min(endIndex, filteredResults.length)} of {filteredResults.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;