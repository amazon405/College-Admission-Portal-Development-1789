import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import LoginForm from './admin/LoginForm';

const { FiGraduationCap, FiSearch, FiSettings, FiLock, FiHome } = FiIcons;

const Header = () => {
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleLoginSuccess = (user) => {
    setShowLoginForm(false);
    // Navigate to admin page using proper hash routing
    window.location.href = '#/admin';
  };

  return (
    <header className="bg-blue-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <SafeIcon icon={FiGraduationCap} className="text-3xl" />
            <div>
              <h1 className="text-2xl font-bold">JoSAA College Finder</h1>
              <p className="text-blue-200 text-sm">Find your perfect engineering college</p>
            </div>
          </Link>

          <div className="flex items-center space-x-6">
            {!isAdminPage && (
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiSearch} className="text-xl" />
                <span className="text-lg font-medium">Search Colleges</span>
              </div>
            )}

            {isAdminPage ? (
              <Link to="/" className="flex items-center space-x-2 px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-md transition-colors">
                <SafeIcon icon={FiHome} className="text-lg" />
                <span>College Finder</span>
              </Link>
            ) : (
              <button 
                onClick={() => setShowLoginForm(true)} 
                className="flex items-center space-x-2 px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-md transition-colors"
              >
                <SafeIcon icon={FiLock} className="text-lg" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showLoginForm && (
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowLoginForm(false)}
        />
      )}
    </header>
  );
};

export default Header;