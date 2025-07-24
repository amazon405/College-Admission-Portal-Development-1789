import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiChevronUp, FiChevronDown, FiMapPin, FiBook, FiUsers } = FiIcons;

const ResultsTable = ({ results }) => {
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <SafeIcon icon={FiChevronUp} className="ml-1 text-blue-600" /> : 
      <SafeIcon icon={FiChevronDown} className="ml-1 text-blue-600" />;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Search Results ({results.length} colleges found)
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('rank')}
              >
                <div className="flex items-center">
                  Rank
                  <SortIcon field="rank" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('instituteName')}
              >
                <div className="flex items-center">
                  Institute
                  <SortIcon field="instituteName" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('branch')}
              >
                <div className="flex items-center">
                  Branch
                  <SortIcon field="branch" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gender
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('openingRank')}
              >
                <div className="flex items-center">
                  Opening Rank
                  <SortIcon field="openingRank" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('closingRank')}
              >
                <div className="flex items-center">
                  Closing Rank
                  <SortIcon field="closingRank" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedResults.map((college, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                      #{college.rank}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {college.instituteName}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <SafeIcon icon={FiMapPin} className="mr-1" />
                        {college.location}
                      </div>
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
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <SafeIcon icon={FiBook} className="text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {college.branch}
                      </div>
                      <div className="text-xs text-gray-500">
                        {college.duration}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    {college.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <SafeIcon icon={FiUsers} className="text-gray-400 mr-1" />
                    <span className="text-sm text-gray-900">{college.gender}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-green-600">
                    {college.openingRank.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-red-600">
                    {college.closingRank.toLocaleString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;