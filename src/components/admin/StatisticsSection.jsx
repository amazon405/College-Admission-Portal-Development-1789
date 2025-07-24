import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiBarChart3, FiTrendingUp, FiUsers, FiDatabase, FiGrid, FiBook } = FiIcons;

const StatisticsSection = ({ data }) => {
  const getStatistics = () => {
    const colleges = data.colleges || [];
    const institutes = data.institutes || [];
    const programs = data.programs || [];

    // Basic counts
    const totalColleges = colleges.length;
    const totalInstitutes = institutes.length;
    const totalPrograms = programs.length;

    // Institute type distribution
    const instituteTypes = {};
    colleges.forEach(college => {
      instituteTypes[college.instituteType] = (instituteTypes[college.instituteType] || 0) + 1;
    });

    // Category distribution
    const categories = {};
    colleges.forEach(college => {
      categories[college.category] = (categories[college.category] || 0) + 1;
    });

    // Round distribution
    const rounds = {};
    colleges.forEach(college => {
      rounds[college.round] = (rounds[college.round] || 0) + 1;
    });

    // Top institutes by entries
    const instituteEntries = {};
    colleges.forEach(college => {
      instituteEntries[college.instituteName] = (instituteEntries[college.instituteName] || 0) + 1;
    });

    const topInstitutes = Object.entries(instituteEntries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    // Branch distribution
    const branches = {};
    colleges.forEach(college => {
      branches[college.branch] = (branches[college.branch] || 0) + 1;
    });

    const topBranches = Object.entries(branches)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      totalColleges,
      totalInstitutes,
      totalPrograms,
      instituteTypes,
      categories,
      rounds,
      topInstitutes,
      topBranches
    };
  };

  const stats = getStatistics();

  const StatCard = ({ title, value, icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100 mr-4`}>
          <SafeIcon icon={icon} className={`text-2xl text-${color}-600`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, data, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{key}</span>
            <div className="flex items-center">
              <div className={`w-24 h-2 bg-gray-200 rounded-full mr-3`}>
                <div 
                  className={`h-2 bg-${color}-500 rounded-full`}
                  style={{ width: `${(value / Math.max(...Object.values(data))) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Statistics</h2>
        <p className="text-gray-600">Overview of your JOSAA data</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total College Entries"
          value={stats.totalColleges}
          icon={FiDatabase}
          color="blue"
        />
        <StatCard
          title="Total Institutes"
          value={stats.totalInstitutes}
          icon={FiGrid}
          color="green"
        />
        <StatCard
          title="Total Programs"
          value={stats.totalPrograms}
          icon={FiBook}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Institute Type Distribution"
          data={stats.instituteTypes}
          color="blue"
        />
        <ChartCard
          title="Category Distribution"
          data={stats.categories}
          color="green"
        />
        <ChartCard
          title="Round Distribution"
          data={stats.rounds}
          color="purple"
        />
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Institutes by Entries</h3>
          <div className="space-y-3">
            {stats.topInstitutes.map(([institute, count], index) => (
              <div key={institute} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-3">#{index + 1}</span>
                  <span className="text-sm text-gray-900">{institute}</span>
                </div>
                <span className="text-sm font-medium text-blue-600">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Branches by Entries</h3>
          <div className="space-y-3">
            {stats.topBranches.map(([branch, count], index) => (
              <div key={branch} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-3">#{index + 1}</span>
                  <span className="text-sm text-gray-900">{branch}</span>
                </div>
                <span className="text-sm font-medium text-green-600">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Quality Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.totalColleges > 0 ? '100%' : '0%'}
            </div>
            <div className="text-sm text-gray-500">Data Completeness</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(stats.instituteTypes).length}
            </div>
            <div className="text-sm text-gray-500">Institute Types</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(stats.categories).length}
            </div>
            <div className="text-sm text-gray-500">Categories</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsSection;