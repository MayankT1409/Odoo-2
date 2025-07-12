import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const ContentModeration = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationData, setModerationData] = useState({
    skillsOffered: [],
    skillsWanted: [],
    moderationNote: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 25
  });

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, pagination.current]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: pagination.current,
        limit: pagination.limit,
        role: 'user', // Only show regular users for moderation
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const openModerationModal = (user) => {
    setSelectedUser(user);
    setModerationData({
      skillsOffered: [...(user.skillsOffered || [])],
      skillsWanted: [...(user.skillsWanted || [])],
      moderationNote: ''
    });
    setShowModerationModal(true);
  };

  const handleSkillChange = (type, index, value) => {
    setModerationData(prev => ({
      ...prev,
      [type]: prev[type].map((skill, i) => i === index ? value : skill)
    }));
  };

  const addSkill = (type) => {
    setModerationData(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const removeSkill = (type, index) => {
    setModerationData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const submitModeration = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser._id}/skills/moderate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skillsOffered: moderationData.skillsOffered.filter(skill => skill.trim()),
          skillsWanted: moderationData.skillsWanted.filter(skill => skill.trim()),
          moderationNote: moderationData.moderationNote
        })
      });

      if (response.ok) {
        setShowModerationModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        setError('Failed to moderate user skills');
      }
    } catch (err) {
      setError('Error moderating skills');
    }
  };

  const flagInappropriateContent = (user, reason) => {
    // This could trigger a review process or automatic action
    console.log(`Flagging user ${user._id} for: ${reason}`);
  };

  const hasInappropriateContent = (skills) => {
    const inappropriateKeywords = ['spam', 'scam', 'fake', 'illegal', 'adult', 'xxx'];
    return skills.some(skill => 
      inappropriateKeywords.some(keyword => 
        skill.toLowerCase().includes(keyword)
      )
    );
  };

  const getContentRiskLevel = (user) => {
    const allSkills = [...(user.skillsOffered || []), ...(user.skillsWanted || [])];
    
    if (hasInappropriateContent(allSkills)) return 'high';
    if (allSkills.some(skill => skill.length > 50)) return 'medium';
    if (allSkills.length > 20) return 'medium';
    return 'low';
  };

  const getRiskBadgeColor = (risk) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[risk] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Review and moderate user skill descriptions and content
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Users for Content Review ({pagination.total})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skills Offered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skills Wanted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    const riskLevel = getContentRiskLevel(user);
                    return (
                      <tr key={user._id} className={`hover:bg-gray-50 ${riskLevel === 'high' ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.avatar}
                              alt={user.name}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            {user.skillsOffered?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.skillsOffered.slice(0, 3).map((skill, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                      hasInappropriateContent([skill]) 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {user.skillsOffered.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{user.skillsOffered.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No skills listed</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            {user.skillsWanted?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.skillsWanted.slice(0, 3).map((skill, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                      hasInappropriateContent([skill]) 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {user.skillsWanted.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{user.skillsWanted.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No skills listed</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskBadgeColor(riskLevel)}`}>
                            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModerationModal(user)}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Moderate
                            </button>
                            <button className="text-gray-600 hover:text-gray-900 flex items-center">
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </button>
                            {riskLevel === 'high' && (
                              <button
                                onClick={() => flagInappropriateContent(user, 'Inappropriate content detected')}
                                className="text-red-600 hover:text-red-900 flex items-center"
                              >
                                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                Flag
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.current} of {pagination.pages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination({...pagination, current: pagination.current - 1})}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({...pagination, current: pagination.current + 1})}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Moderation Modal */}
      {showModerationModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Moderate Skills: {selectedUser.name}
                </h3>
                <button
                  onClick={() => setShowModerationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Skills Offered */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills Offered
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {moderationData.skillsOffered.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => handleSkillChange('skillsOffered', index, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeSkill('skillsOffered', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addSkill('skillsOffered')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Skill
                    </button>
                  </div>
                </div>

                {/* Skills Wanted */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills Wanted
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {moderationData.skillsWanted.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => handleSkillChange('skillsWanted', index, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeSkill('skillsWanted', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addSkill('skillsWanted')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Skill
                    </button>
                  </div>
                </div>
              </div>

              {/* Moderation Note */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moderation Note
                </label>
                <textarea
                  value={moderationData.moderationNote}
                  onChange={(e) => setModerationData({...moderationData, moderationNote: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reason for moderation..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModerationModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitModeration}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentModeration;