import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const SearchFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  availabilityFilter, 
  setAvailabilityFilter 
}) => {
  const availabilityOptions = [
    { value: '', label: 'All Availability' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'evenings', label: 'Evenings' },
    { value: 'weekdays', label: 'Weekdays' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search by Skills or Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., JavaScript, Python, Design..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Availability Filter */}
        <div className="md:w-64">
          <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-1">
              <FunnelIcon className="w-4 h-4" />
              <span>Availability</span>
            </div>
          </label>
          <select
            id="availability"
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="block w-full px-3 py-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            {availabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || availabilityFilter) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300 transition-colors duration-200"
                >
                  ×
                </button>
              </span>
            )}
            {availabilityFilter && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {availabilityOptions.find(opt => opt.value === availabilityFilter)?.label}
                <button
                  onClick={() => setAvailabilityFilter('')}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-200 text-green-600 hover:bg-green-300 transition-colors duration-200"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setAvailabilityFilter('');
              }}
              className="text-gray-500 hover:text-gray-700 text-xs underline transition-colors duration-200"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;