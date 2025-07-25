import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import CollegeSearchForm from '../components/CollegeSearchForm';
import PopularColleges from '../components/PopularColleges';
import CategoryStats from '../components/CategoryStats';
import { fetchAllData } from '../services/supabaseService';

const { FiSearch, FiBarChart2, FiStar, FiTrendingUp, FiInfo } = FiIcons;

const HomePage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('search');

  useEffect(() => {
    // Load data from Supabase
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Try to fetch from Supabase
        const supabaseData = await fetchAllData();
        setData(supabaseData);
        
        // Also save to localStorage as a backup/cache
        localStorage.setItem('josaaAdminData', JSON.stringify(supabaseData));
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        
        // Try to use cached data from localStorage as fallback
        try {
          const savedData = localStorage.getItem('josaaAdminData');
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            setData(parsedData);
          }
        } catch (localError) {
          console.error('Error loading local data:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const sections = [
    { id: 'search', label: 'College Search', icon: FiSearch, color: 'from-blue-500 to-indigo-600' },
    { id: 'popular', label: 'Top Colleges', icon: FiStar, color: 'from-green-500 to-teal-600' },
    { id: 'stats', label: 'Insights', icon: FiBarChart2, color: 'from-purple-500 to-pink-600' },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading college data...</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'search':
        return <CollegeSearchForm data={data} />;
      case 'popular':
        return <PopularColleges data={data} />;
      case 'stats':
        return <CategoryStats data={data} />;
      default:
        return <CollegeSearchForm data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Find Your Perfect Engineering College
                </h1>
                <p className="text-xl text-blue-100 mb-6">
                  Explore JoSAA college cutoffs and make informed decisions about your future
                </p>
                <div className="flex flex-wrap gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button 
                      onClick={() => setActiveSection('search')}
                      className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center"
                    >
                      <SafeIcon icon={FiSearch} className="mr-2" />
                      Search Colleges
                    </button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button 
                      onClick={() => setActiveSection('stats')}
                      className="px-6 py-3 bg-blue-800 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center border border-blue-400"
                    >
                      <SafeIcon icon={FiTrendingUp} className="mr-2" />
                      View Trends
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="w-64 h-64 md:w-80 md:h-80 bg-blue-500 bg-opacity-30 rounded-full absolute top-4 left-4"></div>
                <div className="w-64 h-64 md:w-80 md:h-80 bg-white rounded-lg shadow-xl p-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <SafeIcon icon={FiBarChart2} className="text-white" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-gray-800 font-medium">JOSAA 2025</h3>
                        <p className="text-gray-500 text-sm">Cutoff Analysis</p>
                      </div>
                    </div>
                    <SafeIcon icon={FiTrendingUp} className="text-green-500 text-xl" />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">IIT Bombay CSE</span>
                        <span className="text-gray-800 font-medium">1-63</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-blue-600 rounded-full" style={{ width: '5%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">IIT Delhi CSE</span>
                        <span className="text-gray-800 font-medium">64-118</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: '8%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">IIT Madras CSE</span>
                        <span className="text-gray-800 font-medium">119-184</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-purple-500 rounded-full" style={{ width: '12%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">NIT Trichy CSE</span>
                        <span className="text-gray-800 font-medium">464-589</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-yellow-500 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last Updated</span>
                      <span className="text-gray-800">June 2025</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="bg-blue-800 py-4">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 bg-opacity-30 flex items-center justify-center mr-3">
                  <SafeIcon icon={FiStar} className="text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{data?.institutes?.length || 0}</div>
                  <div className="text-blue-200 text-sm">Institutes</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 bg-opacity-30 flex items-center justify-center mr-3">
                  <SafeIcon icon={FiBarChart2} className="text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{data?.colleges?.length || 0}</div>
                  <div className="text-blue-200 text-sm">College Records</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 bg-opacity-30 flex items-center justify-center mr-3">
                  <SafeIcon icon={FiTrendingUp} className="text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{data?.programs?.length || 0}</div>
                  <div className="text-blue-200 text-sm">Programs</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 bg-opacity-30 flex items-center justify-center mr-3">
                  <SafeIcon icon={FiInfo} className="text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{data?.rounds?.length || 0}</div>
                  <div className="text-blue-200 text-sm">Rounds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Section Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {sections.map((section) => (
            <motion.div
              key={section.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center px-6 py-3 rounded-lg shadow-md transition-all ${
                  activeSection === section.id
                    ? `bg-gradient-to-r ${section.color} text-white`
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <SafeIcon icon={section.icon} className={`mr-2 ${activeSection === section.id ? 'text-white' : 'text-blue-600'}`} />
                {section.label}
              </button>
            </motion.div>
          ))}
        </div>
        
        {/* Content Area */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;