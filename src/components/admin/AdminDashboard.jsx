import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import DataUploadSection from './DataUploadSection';
import DataManagementSection from './DataManagementSection';
import StatisticsSection from './StatisticsSection';
import BackupSection from './BackupSection';
import supabase from '../../lib/supabase';

const { FiDatabase, FiUpload, FiBarChart3, FiSettings, FiDownload, FiHome, FiLogOut } = FiIcons;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [data, setData] = useState({
    colleges: [],
    institutes: [],
    programs: [],
    categories: [],
    rounds: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadExistingData();
    
    // Get current user
    const getCurrentUser = async () => {
      // Check for demo user first
      const demoUser = localStorage.getItem('josaa_demo_user');
      if (demoUser) {
        setUser(JSON.parse(demoUser));
        return;
      }
      
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    
    getCurrentUser();
  }, []);

  const loadExistingData = () => {
    try {
      // Load existing data from localStorage
      const savedData = localStorage.getItem('josaaAdminData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
      showNotification('Error loading existing data', 'error');
    }
  };

  const saveData = (newData) => {
    try {
      setData(newData);
      localStorage.setItem('josaaAdminData', JSON.stringify(newData));
      showNotification('Data saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving data:', error);
      showNotification('Error saving data', 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = async () => {
    try {
      // Check if we're using a demo user
      if (localStorage.getItem('josaa_demo_user')) {
        localStorage.removeItem('josaa_demo_user');
        window.location.href = '#/';
        return;
      }
      
      // Otherwise log out through Supabase
      await supabase.auth.signOut();
      window.location.href = '#/';
    } catch (error) {
      console.error('Error signing out:', error);
      showNotification('Error signing out', 'error');
    }
  };

  const tabs = [
    { id: 'upload', label: 'Data Upload', icon: FiUpload },
    { id: 'manage', label: 'Data Management', icon: FiDatabase },
    { id: 'statistics', label: 'Statistics', icon: FiBarChart3 },
    { id: 'backup', label: 'Backup & Export', icon: FiDownload }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return <DataUploadSection data={data} onDataUpdate={saveData} onNotification={showNotification} />;
      case 'manage':
        return <DataManagementSection data={data} onDataUpdate={saveData} onNotification={showNotification} />;
      case 'statistics':
        return <StatisticsSection data={data} />;
      case 'backup':
        return <BackupSection data={data} onNotification={showNotification} />;
      default:
        return null;
    }
  };

  const getTotalRecords = () => {
    return Object.values(data).reduce((total, section) => total + (section?.length || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <SafeIcon icon={FiSettings} className="text-2xl text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">JOSAA Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your JOSAA college finder data</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                <span className="font-medium">{getTotalRecords()}</span> total records
              </div>
              <div className="flex space-x-3">
                <a
                  href="#/"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <SafeIcon icon={FiHome} className="text-lg" />
                  <span>Back to College Finder</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <SafeIcon icon={FiLogOut} className="text-lg" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
          {user && (
            <div className="pb-4">
              <span className="text-sm text-gray-500">
                Logged in as: <span className="font-medium">{user.email}</span>
                {localStorage.getItem('josaa_demo_user') && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Demo Mode
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`}>
          <div className="flex items-center">
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <SafeIcon icon={tab.icon} className="mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;