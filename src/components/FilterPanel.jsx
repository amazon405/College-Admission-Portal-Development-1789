import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { 
  FiSearch, 
  FiRefreshCw, 
  FiFilter, 
  FiInfo, 
  FiDatabase, 
  FiChevronDown, 
  FiSliders,
  FiArrowRight
} = FiIcons;

const FilterPanel = ({ filters, onFilterChange, onSearch, onReset, isSearching, adminData }) => {
  const [availableInstitutes, setAvailableInstitutes] = useState([]);
  const [availableRounds, setAvailableRounds] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [dataStats, setDataStats] = useState({ total: 0, institutes: 0, programs: 0 });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Calculate data statistics
  useEffect(() => {
    if (adminData) {
      setDataStats({
        total: adminData.colleges?.length || 0,
        institutes: adminData.institutes?.length || 0,
        programs: adminData.programs?.length || 0,
      });
    } else {
      setDataStats({ total: 0, institutes: 0, programs: 0 });
    }
  }, [adminData]);

  // Get unique institute types from data
  const getInstituteTypes = () => {
    if (adminData?.institutes && adminData.institutes.length > 0) {
      const types = [...new Set(adminData.institutes.map(inst => inst.type))].filter(Boolean);
      return types.map(type => ({
        value: type,
        label: `${type} - ${getInstituteTypeLabel(type)}`
      }));
    }
    
    // Fallback to default types if no admin data
    return [
      { value: 'IIT', label: 'IIT - Indian Institute of Technology' },
      { value: 'NIT', label: 'NIT - National Institute of Technology' },
      { value: 'IIIT', label: 'IIIT - Indian Institute of Information Technology' },
      { value: 'IIEST', label: 'IIEST - Indian Institute of Engineering Science and Technology' },
      { value: 'GFTI', label: 'GFTI - Government Funded Technical Institutes' }
    ];
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

  // Update available institutes when institute type changes
  useEffect(() => {
    if (!filters.instituteType) {
      setAvailableInstitutes([]);
      return;
    }
    
    if (adminData?.institutes && adminData.institutes.length > 0) {
      const filtered = adminData.institutes
        .filter(institute => institute.type === filters.instituteType)
        .sort((a, b) => a.label.localeCompare(b.label));
      
      setAvailableInstitutes(filtered);
    } else {
      setAvailableInstitutes([]);
    }
  }, [filters.instituteType, adminData]);

  // Update available rounds based on institute type and institute name
  useEffect(() => {
    if (!filters.instituteType) {
      setAvailableRounds([]);
      return;
    }
    
    if (adminData?.colleges && adminData.colleges.length > 0) {
      let collegeSubset = adminData.colleges.filter(
        college => college.instituteType === filters.instituteType
      );
      
      if (filters.instituteName) {
        collegeSubset = collegeSubset.filter(
          college => college.instituteCode === filters.instituteName
        );
      }
      
      // Extract unique rounds from the filtered colleges
      const uniqueRounds = [...new Set(collegeSubset.map(college => college.round))]
        .filter(Boolean)
        .sort();
      
      // Convert to the expected format
      const formattedRounds = uniqueRounds.map(round => ({
        value: round,
        label: round.replace('-', ' ')
      }));
      
      setAvailableRounds(formattedRounds);
    } else {
      // Fallback to default rounds if no admin data
      setAvailableRounds([
        { value: 'Round-1', label: 'Round 1' },
        { value: 'Round-2', label: 'Round 2' },
        { value: 'Round-3', label: 'Round 3' },
        { value: 'Round-4', label: 'Round 4' },
        { value: 'Round-5', label: 'Round 5' },
        { value: 'Round-6', label: 'Round 6' }
      ]);
    }
  }, [filters.instituteType, filters.instituteName, adminData]);

  // Update available categories based on previous selections
  useEffect(() => {
    if (!filters.instituteType) {
      setAvailableCategories([]);
      return;
    }
    
    if (adminData?.colleges && adminData.colleges.length > 0) {
      let collegeSubset = adminData.colleges.filter(
        college => college.instituteType === filters.instituteType
      );
      
      if (filters.instituteName) {
        collegeSubset = collegeSubset.filter(
          college => college.instituteCode === filters.instituteName
        );
      }
      
      if (filters.round) {
        collegeSubset = collegeSubset.filter(
          college => college.round === filters.round
        );
      }
      
      // Extract unique categories from the filtered colleges
      const uniqueCategories = [...new Set(collegeSubset.map(college => college.category))]
        .filter(Boolean)
        .sort();
      
      // Convert to the expected format
      const formattedCategories = uniqueCategories.map(category => ({
        value: category,
        label: category
      }));
      
      setAvailableCategories(formattedCategories);
    } else {
      // Fallback to default categories if no admin data
      setAvailableCategories([
        { value: 'OPEN', label: 'OPEN' },
        { value: 'EWS', label: 'EWS' },
        { value: 'OBC-NCL', label: 'OBC-NCL' },
        { value: 'SC', label: 'SC' },
        { value: 'ST', label: 'ST' }
      ]);
    }
  }, [filters.instituteType, filters.instituteName, filters.round, adminData]);

  // Update available programs based on all previous selections
  useEffect(() => {
    if (!filters.instituteType || !filters.instituteName) {
      setAvailablePrograms([]);
      return;
    }
    
    if (adminData?.colleges && adminData.colleges.length > 0) {
      let collegeSubset = adminData.colleges.filter(
        college => college.instituteType === filters.instituteType && 
                  college.instituteCode === filters.instituteName
      );
      
      if (filters.round) {
        collegeSubset = collegeSubset.filter(
          college => college.round === filters.round
        );
      }
      
      if (filters.category) {
        collegeSubset = collegeSubset.filter(
          college => college.category === filters.category
        );
      }
      
      // Extract unique programs from the filtered colleges
      const uniquePrograms = collegeSubset
        .map(college => ({
          value: college.branch,
          label: college.branch,
          duration: college.duration || '4 Years'
        }))
        .filter((program, index, self) => 
          index === self.findIndex(p => p.value === program.value)
        )
        .sort((a, b) => a.label.localeCompare(b.label));
      
      setAvailablePrograms(uniquePrograms);
    } else {
      setAvailablePrograms([]);
    }
  }, [filters.instituteType, filters.instituteName, filters.round, filters.category, adminData]);

  // Group programs by category for better organization
  const getProgramCategory = (program) => {
    const label = program.label;
    
    if (label.includes('Computer Science') || label.includes('Information Technology')) 
      return 'CS/IT Programs';
    if (label.includes('Electrical') || label.includes('Electronics')) 
      return 'Electrical/Electronics Programs';
    if (label.includes('Mechanical')) 
      return 'Mechanical Engineering';
    if (label.includes('Civil')) 
      return 'Civil Engineering';
    if (label.includes('Chemical')) 
      return 'Chemical Engineering';
    if (label.includes('B.Tech') && !label.includes('M.Tech')) 
      return 'B.Tech Programs';
    if (label.includes('Dual Degree') || (label.includes('B.Tech') && label.includes('M.Tech'))) 
      return 'Dual Degree Programs';
    if (label.includes('B.Arch')) 
      return 'Architecture Programs';
    if (label.includes('M.Tech')) 
      return 'M.Tech Programs';
    
    return 'Other Programs';
  };

  const groupedPrograms = availablePrograms.reduce((acc, program) => {
    const category = getProgramCategory(program);
    if (!acc[category]) acc[category] = [];
    acc[category].push(program);
    return acc;
  }, {});

  // Sort categories in a logical order
  const sortedCategories = Object.keys(groupedPrograms).sort((a, b) => {
    const order = [
      'CS/IT Programs',
      'Electrical/Electronics Programs',
      'Mechanical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
      'B.Tech Programs',
      'Dual Degree Programs',
      'Architecture Programs',
      'M.Tech Programs',
      'Other Programs'
    ];
    return order.indexOf(a) - order.indexOf(b);
  });

  const isUsingAdminData = adminData && dataStats.total > 0;
  const canSearch = filters.instituteType && !isSearching;

  // Helper to determine if a filter should be disabled
  const isDisabled = (filterName) => {
    switch (filterName) {
      case 'instituteType':
        return isSearching;
      case 'instituteName':
        return isSearching || !filters.instituteType || availableInstitutes.length === 0;
      case 'round':
        return isSearching || !filters.instituteType || availableRounds.length === 0;
      case 'category':
        return isSearching || !filters.instituteType || availableCategories.length === 0;
      case 'academicProgram':
        return isSearching || !filters.instituteName || availablePrograms.length === 0;
      default:
        return isSearching;
    }
  };
  
  // Helper to get placeholder text based on filter state
  const getPlaceholderText = (filterName) => {
    switch (filterName) {
      case 'instituteType':
        return "Select Institute Type";
      case 'instituteName':
        return !filters.instituteType 
          ? "Select Institute Type first" 
          : "Select Institute";
      case 'round':
        return !filters.instituteType 
          ? "Select Institute Type first" 
          : "Select Round";
      case 'category':
        return !filters.instituteType 
          ? "Select Institute Type first"
          : !filters.round
          ? "Select Round first (optional)"
          : "Select Category";
      case 'academicProgram':
        return !filters.instituteName 
          ? "Select Institute first" 
          : "Select Academic Program";
      default:
        return "Select...";
    }
  };

  return (
    <div className="p-6 border-b border-gray-200">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <SafeIcon icon={FiFilter} className="text-xl text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Search Criteria</h3>
          {isUsingAdminData && (
            <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
              <SafeIcon icon={FiDatabase} className="mr-1" />
              Using Admin Data
            </span>
          )}
        </div>
        
        {/* Data Statistics */}
        {isUsingAdminData && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
              {dataStats.total} Colleges
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              {dataStats.institutes} Institutes
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
              {dataStats.programs} Programs
            </span>
          </div>
        )}
      </div>

      {/* Data Source Notice */}
      {!isUsingAdminData && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center">
            <SafeIcon icon={FiInfo} className="text-amber-500 mr-2" />
            <div>
              <p className="text-sm text-amber-800 font-medium">Using Sample Data</p>
              <p className="text-xs text-amber-700">
                Upload data through Admin Dashboard for real JOSAA cutoff information
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Flow Visualization */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg hidden md:block">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${filters.instituteType ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
              <span className="font-bold">1</span>
            </div>
            <span className="text-xs mt-1">Institute Type</span>
          </div>
          
          <div className="flex-1 h-1 mx-2 bg-gray-200">
            <div className={`h-1 ${filters.instituteType ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: '100%' }}></div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${filters.instituteName ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
              <span className="font-bold">2</span>
            </div>
            <span className="text-xs mt-1">Institute</span>
          </div>
          
          <div className="flex-1 h-1 mx-2 bg-gray-200">
            <div className={`h-1 ${filters.round ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: '100%' }}></div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${filters.round ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
              <span className="font-bold">3</span>
            </div>
            <span className="text-xs mt-1">Round</span>
          </div>
          
          <div className="flex-1 h-1 mx-2 bg-gray-200">
            <div className={`h-1 ${filters.category ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: '100%' }}></div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${filters.category ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
              <span className="font-bold">4</span>
            </div>
            <span className="text-xs mt-1">Category</span>
          </div>
          
          <div className="flex-1 h-1 mx-2 bg-gray-200">
            <div className={`h-1 ${filters.academicProgram ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: '100%' }}></div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${filters.academicProgram ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
              <span className="font-bold">5</span>
            </div>
            <span className="text-xs mt-1">Program</span>
          </div>
        </div>
      </div>

      {/* Main Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
        {/* Institute Type */}
        <div className="filter-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Institute Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={filters.instituteType}
              onChange={(e) => onFilterChange('instituteType', e.target.value)}
              className={`w-full px-3 py-2 pr-10 border ${filters.instituteType ? 'border-blue-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors appearance-none`}
              disabled={isDisabled('instituteType')}
            >
              <option value="">{getPlaceholderText('instituteType')}</option>
              {getInstituteTypes().map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <SafeIcon icon={FiChevronDown} />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {getInstituteTypes().length} institute types available
          </div>
        </div>

        {/* Institute Name */}
        <div className="filter-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Institute
          </label>
          <div className="relative">
            <select
              value={filters.instituteName}
              onChange={(e) => onFilterChange('instituteName', e.target.value)}
              className={`w-full px-3 py-2 pr-10 border ${filters.instituteName ? 'border-blue-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors appearance-none`}
              disabled={isDisabled('instituteName')}
            >
              <option value="">{getPlaceholderText('instituteName')}</option>
              {availableInstitutes.map(institute => (
                <option key={institute.value} value={institute.value}>
                  {institute.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <SafeIcon icon={FiChevronDown} />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {!filters.instituteType 
              ? "Select institute type first" 
              : `${availableInstitutes.length} institutes available`}
          </div>
        </div>

        {/* Round */}
        <div className="filter-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Round
          </label>
          <div className="relative">
            <select
              value={filters.round}
              onChange={(e) => onFilterChange('round', e.target.value)}
              className={`w-full px-3 py-2 pr-10 border ${filters.round ? 'border-blue-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors appearance-none`}
              disabled={isDisabled('round')}
            >
              <option value="">{getPlaceholderText('round')}</option>
              {availableRounds.map(round => (
                <option key={round.value} value={round.value}>{round.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <SafeIcon icon={FiChevronDown} />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {!filters.instituteType 
              ? "Select institute type first" 
              : `${availableRounds.length} rounds available`}
          </div>
        </div>

        {/* Category */}
        <div className="filter-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className={`w-full px-3 py-2 pr-10 border ${filters.category ? 'border-blue-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors appearance-none`}
              disabled={isDisabled('category')}
            >
              <option value="">{getPlaceholderText('category')}</option>
              {availableCategories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <SafeIcon icon={FiChevronDown} />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {!filters.instituteType
              ? "Select institute type first"
              : `${availableCategories.length} categories available`}
          </div>
        </div>

        {/* Academic Program */}
        <div className="filter-group">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Academic Program
            </label>
            <div className="relative">
              <SafeIcon 
                icon={FiInfo} 
                className="text-sm text-blue-500 cursor-pointer" 
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              />
              {showTooltip && (
                <div className="absolute z-10 w-64 p-2 text-xs bg-gray-800 text-white rounded shadow-lg -top-2 left-6">
                  Programs are filtered based on your previous selections.
                  {isUsingAdminData 
                    ? " Shows actual programs from uploaded data." 
                    : " Shows predefined program mappings."}
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <select
              value={filters.academicProgram}
              onChange={(e) => onFilterChange('academicProgram', e.target.value)}
              className={`w-full px-3 py-2 pr-10 border ${filters.academicProgram ? 'border-blue-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors appearance-none`}
              disabled={isDisabled('academicProgram')}
            >
              <option value="">{getPlaceholderText('academicProgram')}</option>
              {sortedCategories.map(category => (
                <optgroup key={category} label={category}>
                  {groupedPrograms[category].map(program => (
                    <option key={program.value} value={program.value}>
                      {program.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <SafeIcon icon={FiChevronDown} />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {!filters.instituteName
              ? "Select an institute to see available programs"
              : availablePrograms.length > 0
                ? `${availablePrograms.length} programs available`
                : "No programs available for this selection"}
          </div>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="mb-6">
        <button 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-800"
        >
          <SafeIcon icon={FiSliders} className="mr-1" />
          {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
          {/* Gender Filter */}
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <div className="relative">
              <select
                value={filters.gender || ''}
                onChange={(e) => onFilterChange('gender', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isSearching}
              >
                <option value="">Any Gender</option>
                <option value="Gender-Neutral">Gender-Neutral</option>
                <option value="Female-only">Female-only</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <SafeIcon icon={FiChevronDown} />
              </div>
            </div>
          </div>

          {/* Rank Range Filter */}
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rank Range
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.rankRange?.min || ''}
                onChange={(e) => onFilterChange('rankRange', { ...filters.rankRange || {}, min: e.target.value })}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isSearching}
                min="1"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.rankRange?.max || ''}
                onChange={(e) => onFilterChange('rankRange', { ...filters.rankRange || {}, max: e.target.value })}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isSearching}
                min="1"
              />
            </div>
          </div>

          {/* Quota Filter */}
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quota
            </label>
            <div className="relative">
              <select
                value={filters.quota || ''}
                onChange={(e) => onFilterChange('quota', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isSearching}
              >
                <option value="">Any Quota</option>
                <option value="AI">All India (AI)</option>
                <option value="HS">Home State (HS)</option>
                <option value="OS">Other State (OS)</option>
                <option value="GO">GOI</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <SafeIcon icon={FiChevronDown} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={onSearch}
          disabled={!canSearch}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors transform hover:scale-105"
        >
          <SafeIcon icon={isSearching ? FiRefreshCw : FiSearch} className={`mr-2 ${isSearching ? 'animate-spin' : ''}`} />
          {isSearching ? 'Searching...' : 'Search Colleges'}
        </button>
        
        <button
          onClick={onReset}
          className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          <SafeIcon icon={FiRefreshCw} className="mr-2" />
          Reset Filters
        </button>
        
        {/* Search Tips */}
        <div className="flex items-center text-sm text-gray-500">
          <SafeIcon icon={FiInfo} className="mr-1" />
          <span>
            {isUsingAdminData 
              ? `Searching ${dataStats.total} college records` 
              : "Using sample data for demonstration"}
          </span>
        </div>
      </div>

      {/* Quick Filter Suggestions */}
      {!filters.instituteType && isUsingAdminData && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">Quick Start:</p>
          <div className="flex flex-wrap gap-2">
            {getInstituteTypes().slice(0, 3).map(type => (
              <button
                key={type.value}
                onClick={() => onFilterChange('instituteType', type.value)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
              >
                {type.value}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;