import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserCard from '../components/UserCard';
import SearchFilters from '../components/SearchFilters';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const HomePage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const usersPerPage = 6;

  // Mock users data
  useEffect(() => {
    const mockUsers = [
      {
        id: 1,
        name: 'Marc Demo',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        skillsOffered: ['JavaScript', 'React', 'Node.js'],
        skillsWanted: ['Python', 'Machine Learning'],
        rating: 4.2,
        location: 'San Francisco, CA',
        availability: 'Weekends',
        isPublic: true
      },
      {
        id: 2,
        name: 'Michell',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        skillsOffered: ['Python', 'Data Science', 'Machine Learning'],
        skillsWanted: ['JavaScript', 'Web Development'],
        rating: 4.8,
        location: 'New York, NY',
        availability: 'Evenings',
        isPublic: true
      },
      {
        id: 3,
        name: 'Joe Wills',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        skillsOffered: ['UI/UX Design', 'Figma', 'Adobe Creative Suite'],
        skillsWanted: ['Frontend Development', 'React'],
        rating: 4.5,
        location: 'Los Angeles, CA',
        availability: 'Weekdays',
        isPublic: true
      },
      {
        id: 4,
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        skillsOffered: ['Digital Marketing', 'SEO', 'Content Strategy'],
        skillsWanted: ['Graphic Design', 'Photoshop'],
        rating: 4.3,
        location: 'Seattle, WA',
        availability: 'Weekends',
        isPublic: true
      },
      {
        id: 5,
        name: 'Alex Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        skillsOffered: ['Mobile Development', 'Flutter', 'iOS'],
        skillsWanted: ['Backend Development', 'DevOps'],
        rating: 4.6,
        location: 'Austin, TX',
        availability: 'Evenings',
        isPublic: true
      },
      {
        id: 6,
        name: 'Emma Thompson',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        skillsOffered: ['Project Management', 'Agile', 'Scrum'],
        skillsWanted: ['Data Analysis', 'Excel'],
        rating: 4.1,
        location: 'Chicago, IL',
        availability: 'Weekdays',
        isPublic: true
      },
      {
        id: 7,
        name: 'David Kim',
        avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
        skillsOffered: ['Cybersecurity', 'Network Security', 'Ethical Hacking'],
        skillsWanted: ['Cloud Computing', 'AWS'],
        rating: 4.7,
        location: 'Boston, MA',
        availability: 'Weekends',
        isPublic: true
      },
      {
        id: 8,
        name: 'Lisa Wang',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
        skillsOffered: ['Photography', 'Video Editing', 'Adobe Premiere'],
        skillsWanted: ['Social Media Marketing', 'Instagram Growth'],
        rating: 4.4,
        location: 'Miami, FL',
        availability: 'Evenings',
        isPublic: true
      }
    ];

    // Filter out current user if logged in
    const publicUsers = mockUsers.filter(mockUser => 
      mockUser.isPublic && (!user || mockUser.id !== user.id)
    );
    
    setUsers(publicUsers);
    setFilteredUsers(publicUsers);
  }, [user]);

  // Filter users based on search and availability
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.skillsOffered.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        user.skillsWanted.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (availabilityFilter) {
      filtered = filtered.filter(user => 
        user.availability.toLowerCase() === availabilityFilter.toLowerCase()
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, availabilityFilter, users]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to Skill Swap Platform
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Connect, Learn, and Grow Together
          </p>
          <p className="text-lg opacity-80 max-w-3xl mx-auto">
            Discover talented individuals ready to share their expertise and learn new skills. 
            Join our community of learners and teachers to exchange knowledge and build meaningful connections.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchFilters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          availabilityFilter={availabilityFilter}
          setAvailabilityFilter={setAvailabilityFilter}
        />

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {currentUsers.length} of {filteredUsers.length} public profiles
          </p>
        </div>

        {/* User Cards Grid */}
        {currentUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentUsers.map(userProfile => (
              <UserCard 
                key={userProfile.id} 
                user={userProfile} 
                currentUser={user}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles found</h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or filters to find more profiles.
              </p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => paginate(index + 1)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentPage === index + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;