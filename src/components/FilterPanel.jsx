import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { filterOptions } from '../data/filterOptions';
import { getAvailableProgramsForInstitute } from '../data/institutePrograms';

const { FiSearch, FiRefreshCw, FiFilter, FiInfo } = FiIcons;

const FilterPanel = ({ filters, onFilterChange, onSearch, onReset, isSearching, adminData }) => {
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);

  // Use admin data if available, otherwise fall back to default options
  const getInstituteTypes = () => {
    if (adminData?.institutes) {
      const types = [...new Set(adminData.institutes.map(inst => inst.type))];
      return types.map(type => ({
        value: type,
        label: `${type} - ${getInstituteTypeLabel(type)}`
      }));
    }
    return filterOptions.instituteTypes;
  };

  const getInstituteTypeLabel = (type) => {
    const labels = {
      'IIT': 'Indian Institute of Technology',
      'NIT': 'National Institute of Technology',
      'IIIT': 'Indian Institute of Information Technology',
      'IIEST': 'Indian Institute of Engineering Science and Technology',
      'GFTI': 'Government Funded Technical Institutes'
    };
    return labels[type] || type;
  };

  const getFilteredInstitutes = () => {
    if (!filters.instituteType) return [];
    
    if (adminData?.institutes) {
      return adminData.institutes.filter(institute => institute.type === filters.instituteType);
    }
    
    return filterOptions.institutes.filter(institute => institute.type === filters.instituteType);
  };

  const getCategories = () => {
    if (adminData?.categories) {
      return adminData.categories;
    }
    return filterOptions.categories;
  };

  const getRounds = () => {
    if (adminData?.rounds) {
      return adminData.rounds;
    }
    return filterOptions.rounds;
  };

  const getAcademicPrograms = () => {
    if (adminData?.programs) {
      return adminData.programs;
    }
    return filterOptions.academicPrograms;
  };

  useEffect(() => {
    if (!filters.instituteName) {
      setAvailablePrograms([]);
      return;
    }
    
    const availableProgramIds = getAvailableProgramsForInstitute(filters.instituteName);
    const allPrograms = getAcademicPrograms();
    const filteredPrograms = allPrograms.filter(program => 
      availableProgramIds.includes(program.value)
    );
    
    const sortedPrograms = [...filteredPrograms].sort((a, b) => 
      a.label.localeCompare(b.label)
    );
    
    setAvailablePrograms(sortedPrograms);
  }, [filters.instituteName, adminData]);

  const getProgramCategory = (program) => {
    const label = program.label;
    if (label.startsWith('4-year B.Tech')) return 'B.Tech Programs';
    if (label.startsWith('5-year B.Tech. + M.Tech')) return 'Dual Degree Programs';
    if (label.startsWith('5-year B.Arch')) return 'B.Arch Programs';
    if (label.startsWith('5-year BS-MS')) return 'BS-MS Programs';
    if (label.startsWith('5-year Integrated M.Tech')) return 'Integrated M.Tech Programs';
    if (label.startsWith('5-year Integrated M.Sc')) return 'Integrated M.Sc Programs';
    return 'Other Programs';
  };

  const groupedPrograms = availablePrograms.reduce((acc, program) => {
    const category = getProgramCategory(program);
    if (!acc[category]) acc[category] = [];
    acc[category].push(program);
    return acc;
  }, {});

  const sortedCategories = Object.keys(groupedPrograms).sort((a, b) => {
    const order = [
      'B.Tech Programs', 
      'Dual Degree Programs', 
      'B.Arch Programs', 
      'BS-MS Programs', 
      'Integrated M.Tech Programs',
      'Integrated M.Sc Programs',
      'Other Programs'
    ];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center mb-6">
        <SafeIcon icon={FiFilter} className="text-xl text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Search Criteria</h3>
        {adminData && (
          <span className="ml-4 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Using Admin Data
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {/* Institute Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Institute Type *
          </label>
          <select
            value={filters.instituteType}
            onChange={(e) => onFilterChange('instituteType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">Select Institute Type</option>
            {getInstituteTypes().map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Institute Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Institute Name
          </label>
          <select
            value={filters.instituteName}
            onChange={(e) => onFilterChange('instituteName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={!filters.instituteType}
          >
            <option value="">Select Institute</option>
            {getFilteredInstitutes().map(institute => (
              <option key={institute.value} value={institute.value}>{institute.label}</option>
            ))}
          </select>
        </div>

        {/* Round */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Round
          </label>
          <select
            value={filters.round}
            onChange={(e) => onFilterChange('round', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">Select Round</option>
            {getRounds().map(round => (
              <option key={round.value} value={round.value}>{round.label}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">Select Category</option>
            {getCategories().map(category => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </div>

        {/* Academic Program */}
        <div>
          <div className="flex items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Academic Program
            </label>
            <div className="relative ml-2">
              <SafeIcon 
                icon={FiInfo} 
                className="text-sm text-blue-500 cursor-pointer" 
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              />
              {showTooltip && (
                <div className="absolute z-10 w-64 p-2 text-xs bg-gray-800 text-white rounded shadow-lg -top-2 left-6">
                  Programs are filtered based on the selected institute. Only programs offered by the institute are shown.
                </div>
              )}
            </div>
          </div>
          <select
            value={filters.academicProgram}
            onChange={(e) => onFilterChange('academicProgram', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={!filters.instituteName}
          >
            <option value="">Select Academic Program</option>
            {sortedCategories.map(category => (
              <optgroup key={category} label={category}>
                {groupedPrograms[category].map(program => (
                  <option key={program.value} value={program.value}>
                    {program.label.replace(/^[^.]+\. in\s/, '')}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">
            {filters.instituteName && availablePrograms.length > 0 ? 
              `${availablePrograms.length} programs available` : 
              filters.instituteName ? 
              "No programs available for this institute" :
              "Select an institute to see available programs"
            }
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={onSearch}
          disabled={isSearching || !filters.instituteType}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <SafeIcon 
            icon={FiSearch} 
            className={`mr-2 ${isSearching ? 'animate-spin' : ''}`} 
          />
          {isSearching ? 'Searching...' : 'Search Colleges'}
        </button>

        <button
          onClick={onReset}
          className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          <SafeIcon icon={FiRefreshCw} className="mr-2" />
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;