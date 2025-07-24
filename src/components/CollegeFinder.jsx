import React, { useState, useEffect } from 'react';
import FilterPanel from './FilterPanel';
import ResultsTable from './ResultsTable';
import { mockCollegeData } from '../data/mockData';

const CollegeFinder = () => {
  const [filters, setFilters] = useState({
    instituteType: '',
    instituteName: '',
    round: '',
    category: '',
    academicProgram: ''
  });
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    // Load admin data if available
    const savedData = localStorage.getItem('josaaAdminData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setAdminData(parsedData);
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    }
  }, []);

  const handleFilterChange = (filterName, value) => {
    if (filterName === 'instituteType') {
      setFilters(prev => ({
        ...prev,
        [filterName]: value,
        instituteName: '',
        academicProgram: ''
      }));
    } else if (filterName === 'instituteName') {
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
  };

  const handleSearch = async () => {
    setIsSearching(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Use admin data if available, otherwise fall back to mock data
    const dataSource = adminData?.colleges || mockCollegeData;
    let filteredResults = dataSource;
    
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
    
    if (filters.category) {
      filteredResults = filteredResults.filter(college => 
        college.category === filters.category
      );
    }
    
    if (filters.round) {
      filteredResults = filteredResults.filter(college => 
        college.round === filters.round
      );
    }
    
    if (filters.academicProgram) {
      const programCode = filters.academicProgram;
      const programLabel = document.querySelector(`option[value="${programCode}"]`)?.textContent || '';
      
      filteredResults = filteredResults.filter(college => {
        const keywords = programLabel.toLowerCase().split(' ')
          .filter(word => word.length > 3 && !['with', 'and', 'dual', 'year', 'tech'].includes(word));
        
        return college.branch.toLowerCase().includes(programLabel.toLowerCase()) ||
          keywords.some(keyword => college.branch.toLowerCase().includes(keyword));
      });
    }
    
    setResults(filteredResults);
    setIsSearching(false);
  };

  const handleReset = () => {
    setFilters({
      instituteType: '',
      instituteName: '',
      round: '',
      category: '',
      academicProgram: ''
    });
    setResults([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">College Search Filters</h2>
          <p className="text-blue-100">Select your preferences to find suitable colleges</p>
          {adminData && (
            <p className="text-blue-200 text-sm mt-2">
              Using admin data: {adminData.colleges?.length || 0} colleges available
            </p>
          )}
        </div>
        
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onReset={handleReset}
          isSearching={isSearching}
          adminData={adminData}
        />
        
        {results.length > 0 && (
          <ResultsTable results={results} />
        )}
        
        {results.length === 0 && !isSearching && (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">No results found. Please adjust your filters and search again.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeFinder;