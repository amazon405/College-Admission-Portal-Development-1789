import React, { useState, useEffect } from 'react';
import FilterPanel from './FilterPanel';
import ResultsTable from './ResultsTable';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { fetchAllData } from '../services/supabaseService';

const { FiDatabase, FiRefreshCw, FiAlertCircle, FiSearch, FiFilter } = FiIcons;

const CollegeFinder = () => {
  const [filters, setFilters] = useState({
    instituteType: '',
    instituteName: '',
    round: '',
    category: '',
    academicProgram: '',
    gender: '',
    rankRange: { min: '', max: '' },
    quota: ''
  });
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [searchStats, setSearchStats] = useState({ total: 0, filtered: 0 });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from Supabase
      const supabaseData = await fetchAllData();
      setAdminData(supabaseData);
      setSearchStats({
        total: supabaseData.colleges?.length || 0,
        filtered: 0
      });
      
      // Also save to localStorage as a backup/cache
      localStorage.setItem('josaaAdminData', JSON.stringify(supabaseData));
      setError(null);
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      
      // Try to use cached data from localStorage as fallback
      try {
        const savedData = localStorage.getItem('josaaAdminData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setAdminData(parsedData);
          setSearchStats({
            total: parsedData.colleges?.length || 0,
            filtered: 0
          });
        } else {
          setError('Failed to load data. Please connect to a Supabase project.');
        }
      } catch (localError) {
        console.error('Error loading local data:', localError);
        setError('Failed to load college data. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    if (filterName === 'instituteType') {
      setFilters(prev => ({
        ...prev,
        [filterName]: value,
        instituteName: '',
        round: '',
        category: '',
        academicProgram: ''
      }));
    } else if (filterName === 'instituteName') {
      setFilters(prev => ({
        ...prev,
        [filterName]: value,
        academicProgram: ''
      }));
    } else if (filterName === 'round') {
      setFilters(prev => ({
        ...prev,
        [filterName]: value,
        category: '',
        academicProgram: ''
      }));
    } else if (filterName === 'category') {
      setFilters(prev => ({
        ...prev,
        [filterName]: value,
        academicProgram: ''
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [filterName]: value
      }));
    }

    // Clear results when filters change
    if (results.length > 0) {
      setResults([]);
      setSearchStats(prev => ({ ...prev, filtered: 0 }));
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    
    try {
      // Simulate search delay for better UX
      await new Promise(resolve => setTimeout(resolve, 600));
      
      if (!adminData?.colleges || adminData.colleges.length === 0) {
        throw new Error('No college data available');
      }
      
      let filteredResults = [...adminData.colleges];
      
      // Apply filters
      if (filters.instituteType) {
        filteredResults = filteredResults.filter(college => 
          college.instituteType === filters.instituteType
        );
      }
      
      if (filters.instituteName) {
        filteredResults = filteredResults.filter(college => 
          college.instituteCode === filters.instituteName
        );
      }
      
      if (filters.round) {
        filteredResults = filteredResults.filter(college => 
          college.round === filters.round
        );
      }
      
      if (filters.category) {
        filteredResults = filteredResults.filter(college => 
          college.category === filters.category
        );
      }
      
      if (filters.academicProgram) {
        filteredResults = filteredResults.filter(college => 
          college.branch === filters.academicProgram
        );
      }
      
      // Apply advanced filters if set
      if (filters.gender) {
        filteredResults = filteredResults.filter(college => 
          college.gender === filters.gender
        );
      }
      
      if (filters.rankRange?.min) {
        const minRank = parseInt(filters.rankRange.min);
        filteredResults = filteredResults.filter(college => 
          college.closingRank >= minRank
        );
      }
      
      if (filters.rankRange?.max) {
        const maxRank = parseInt(filters.rankRange.max);
        filteredResults = filteredResults.filter(college => 
          college.openingRank <= maxRank
        );
      }
      
      if (filters.quota) {
        filteredResults = filteredResults.filter(college => 
          college.quota === filters.quota
        );
      }
      
      // Sort results by rank (ascending)
      filteredResults.sort((a, b) => (a.rank || 0) - (b.rank || 0));
      
      setResults(filteredResults);
      setSearchStats(prev => ({
        ...prev,
        filtered: filteredResults.length
      }));
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred during search. Please try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setFilters({
      instituteType: '',
      instituteName: '',
      round: '',
      category: '',
      academicProgram: '',
      gender: '',
      rankRange: { min: '', max: '' },
      quota: ''
    });
    setResults([]);
    setSearchStats(prev => ({ ...prev, filtered: 0 }));
    setError(null);
  };

  const refreshData = () => {
    loadAdminData();
    handleReset();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg ml-3">Loading college data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">College Search Filters</h2>
              <p className="text-blue-100">Select your preferences to find suitable colleges</p>
              {adminData && adminData.colleges && (
                <p className="text-blue-200 text-sm mt-2 flex items-center">
                  <SafeIcon icon={FiDatabase} className="mr-1" />
                  Using admin data: {adminData.colleges.length} colleges available
                </p>
              )}
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={refreshData}
              className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-md transition-colors"
              title="Refresh data from admin dashboard"
            >
              <SafeIcon icon={FiRefreshCw} className="mr-2" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-center">
              <SafeIcon icon={FiAlertCircle} className="text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onReset={handleReset}
          isSearching={isSearching}
          adminData={adminData}
        />

        {/* Results Section */}
        {results.length > 0 && (
          <>
            {/* Search Summary */}
            <div className="px-6 py-3 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Found <span className="font-semibold text-blue-600">{results.length}</span> colleges 
                    out of <span className="font-semibold">{searchStats.total}</span> total records
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {filters.instituteType && <span className="mr-2">Type: {filters.instituteType}</span>}
                    {filters.instituteName && <span className="mr-2">Institute: {adminData?.institutes?.find(i => i.value === filters.instituteName)?.label || filters.instituteName}</span>}
                    {filters.category && <span className="mr-2">Category: {filters.category}</span>}
                  </p>
                </div>
                
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Live Data
                </span>
              </div>
            </div>
            
            <ResultsTable results={results} />
          </>
        )}

        {/* No Results */}
        {results.length === 0 && !isSearching && Object.values(filters).some(f => f !== '' && f !== undefined && (typeof f !== 'object' || Object.values(f).some(v => v !== ''))) && (
          <div className="p-8 text-center text-gray-500">
            <SafeIcon icon={FiAlertCircle} className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-lg mb-2">No colleges found matching your criteria</p>
            <p className="text-sm mb-4">Try adjusting your filters or selecting different options</p>
            <button
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <SafeIcon icon={FiRefreshCw} className="mr-2" />
              Reset Filters
            </button>
          </div>
        )}

        {/* Initial State */}
        {results.length === 0 && !isSearching && Object.values(filters).every(f => f === '' || f === undefined || (typeof f === 'object' && Object.values(f).every(v => v === ''))) && (
          <div className="p-8 text-center text-gray-500">
            <SafeIcon icon={FiSearch} className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-lg mb-2">Ready to search colleges</p>
            <p className="text-sm">
              {adminData && adminData.colleges 
                ? `Select institute type to start searching through ${adminData.colleges.length} colleges` 
                : "No college data available - please connect to a database"}
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => document.querySelector('select').focus()}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiFilter} className="mr-2" />
                Start Filtering
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeFinder;