import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { TableNames, deleteItem, addItem, updateItem } from '../../services/supabaseService';

const { FiEdit2, FiTrash2, FiPlus, FiSearch, FiFilter, FiRefreshCw } = FiIcons;

const DataManagementSection = ({ data, onDataUpdate, onNotification, onRefresh }) => {
  const [activeSection, setActiveSection] = useState('colleges');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const sections = [
    { id: 'colleges', label: 'Colleges', count: data.colleges?.length || 0 },
    { id: 'institutes', label: 'Institutes', count: data.institutes?.length || 0 },
    { id: 'programs', label: 'Programs', count: data.programs?.length || 0 },
    { id: 'categories', label: 'Categories', count: data.categories?.length || 0 },
    { id: 'rounds', label: 'Rounds', count: data.rounds?.length || 0 }
  ];

  const getCurrentData = () => data[activeSection] || [];
  
  const getFilteredData = () => {
    const currentData = getCurrentData();
    if (!searchTerm) return currentData;
    
    return currentData.filter(item => 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const getTableName = () => {
    switch (activeSection) {
      case 'colleges': return TableNames.COLLEGES;
      case 'institutes': return TableNames.INSTITUTES;
      case 'programs': return TableNames.PROGRAMS;
      case 'categories': return TableNames.CATEGORIES;
      case 'rounds': return TableNames.ROUNDS;
      default: return null;
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete this item: ${item.label || item.instituteName || item.value}?`)) {
      setIsDeleting(true);
      try {
        await deleteItem(getTableName(), item.id);
        onNotification('Item deleted successfully', 'success');
        onRefresh(); // Refresh data from database
      } catch (error) {
        console.error('Error deleting item:', error);
        onNotification(`Error deleting item: ${error.message}`, 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      setIsDeleting(true);
      try {
        const tableName = getTableName();
        const currentData = getCurrentData();
        
        // Get the actual items to delete
        const itemsToDelete = selectedItems.map(index => currentData[index]);
        
        // Delete each item sequentially
        let successCount = 0;
        let errorCount = 0;
        
        for (const item of itemsToDelete) {
          try {
            await deleteItem(tableName, item.id);
            successCount++;
          } catch (error) {
            console.error(`Error deleting item ${item.id}:`, error);
            errorCount++;
          }
        }
        
        if (errorCount === 0) {
          onNotification(`${successCount} items deleted successfully`, 'success');
        } else {
          onNotification(`${successCount} items deleted, ${errorCount} failed`, 'warning');
        }
        
        setSelectedItems([]);
        onRefresh(); // Refresh data from database
      } catch (error) {
        console.error('Error during bulk delete:', error);
        onNotification(`Error during bulk delete: ${error.message}`, 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = (item, index) => {
    setEditingItem({ ...item, index });
  };

  const handleSaveEdit = async (updatedItem) => {
    setIsUpdating(true);
    try {
      // Remove the index property before saving
      const { index, ...itemToUpdate } = updatedItem;
      
      await updateItem(getTableName(), itemToUpdate.id, itemToUpdate);
      onNotification('Item updated successfully', 'success');
      setEditingItem(null);
      onRefresh(); // Refresh data from database
    } catch (error) {
      console.error('Error updating item:', error);
      onNotification(`Error updating item: ${error.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdd = async (newItem) => {
    setIsUpdating(true);
    try {
      await addItem(getTableName(), newItem);
      onNotification('Item added successfully', 'success');
      setShowAddForm(false);
      onRefresh(); // Refresh data from database
    } catch (error) {
      console.error('Error adding item:', error);
      onNotification(`Error adding item: ${error.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const getFieldsForSection = (section) => {
    const fieldMap = {
      colleges: ['rank', 'instituteName', 'instituteCode', 'location', 'instituteType', 'branch', 'duration', 'category', 'gender', 'openingRank', 'closingRank', 'round', 'quota', 'year'],
      institutes: ['value', 'label', 'type', 'location'],
      programs: ['value', 'label', 'duration', 'degree'],
      categories: ['value', 'label', 'description'],
      rounds: ['value', 'label', 'year', 'startDate', 'endDate', 'status']
    };
    return fieldMap[section] || [];
  };

  const renderTableHeaders = () => {
    const fields = getFieldsForSection(activeSection);
    return (
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2">
            <input
              type="checkbox"
              checked={selectedItems.length === getFilteredData().length && getFilteredData().length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedItems(getFilteredData().map((_, index) => index));
                } else {
                  setSelectedItems([]);
                }
              }}
              disabled={isDeleting || isUpdating}
            />
          </th>
          {fields.map(field => (
            <th key={field} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              {field}
            </th>
          ))}
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
    );
  };

  const renderTableRows = () => {
    const fields = getFieldsForSection(activeSection);
    const filteredData = getFilteredData();

    return (
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredData.map((item, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-4 py-2">
              <input
                type="checkbox"
                checked={selectedItems.includes(index)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedItems([...selectedItems, index]);
                  } else {
                    setSelectedItems(selectedItems.filter(i => i !== index));
                  }
                }}
                disabled={isDeleting || isUpdating}
              />
            </td>
            {fields.map(field => (
              <td key={field} className="px-4 py-2 text-sm text-gray-900">
                {String(item[field] || '')}
              </td>
            ))}
            <td className="px-4 py-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(item, index)}
                  className="text-blue-600 hover:text-blue-800"
                  disabled={isDeleting || isUpdating}
                >
                  <SafeIcon icon={FiEdit2} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="text-red-600 hover:text-red-800"
                  disabled={isDeleting || isUpdating}
                >
                  <SafeIcon icon={FiTrash2} className={isDeleting ? 'animate-spin' : ''} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Data Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={onRefresh}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            disabled={isDeleting || isUpdating}
          >
            <SafeIcon icon={FiRefreshCw} className="mr-2" />
            Refresh Data
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={isDeleting || isUpdating}
          >
            <SafeIcon icon={FiPlus} className="mr-2" />
            Add New
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setSelectedItems([]);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              disabled={isDeleting || isUpdating}
            >
              {section.label} ({section.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isDeleting || isUpdating}
            />
          </div>
          {selectedItems.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              disabled={isDeleting || isUpdating}
            >
              <SafeIcon icon={isDeleting ? FiRefreshCw : FiTrash2} className={`mr-2 ${isDeleting ? 'animate-spin' : ''}`} />
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedItems.length})`}
            </button>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {getFilteredData().length} of {getCurrentData().length} items
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            {renderTableHeaders()}
            {renderTableRows()}
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditModal
          item={editingItem}
          fields={getFieldsForSection(activeSection)}
          onSave={handleSaveEdit}
          onCancel={() => setEditingItem(null)}
          isUpdating={isUpdating}
        />
      )}

      {/* Add Modal */}
      {showAddForm && (
        <AddModal
          fields={getFieldsForSection(activeSection)}
          onAdd={handleAdd}
          onCancel={() => setShowAddForm(false)}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
};

const EditModal = ({ item, fields, onSave, onCancel, isUpdating }) => {
  const [formData, setFormData] = useState(item);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Edit Item</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field}
              </label>
              <input
                type={field.includes('rank') ? 'number' : 'text'}
                value={formData[field] || ''}
                onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUpdating || field === 'id'}
              />
            </div>
          ))}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <SafeIcon icon={FiRefreshCw} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddModal = ({ fields, onAdd, onCancel, isUpdating }) => {
  const [formData, setFormData] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Add New Item</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field}
              </label>
              <input
                type={field.includes('rank') ? 'number' : 'text'}
                value={formData[field] || ''}
                onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUpdating}
              />
            </div>
          ))}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <SafeIcon icon={FiRefreshCw} className="animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataManagementSection;