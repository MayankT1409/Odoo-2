import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  PencilIcon, 
  PlusIcon, 
  XMarkIcon, 
  EyeIcon, 
  EyeSlashIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    location: user?.location || '',
    availability: user?.availability || 'weekends',
    isPublic: user?.isPublic || true
  });
  const [skillsOffered, setSkillsOffered] = useState(user?.skillsOffered || []);
  const [skillsWanted, setSkillsWanted] = useState(user?.skillsWanted || []);
  const [newSkillOffered, setNewSkillOffered] = useState('');
  const [newSkillWanted, setNewSkillWanted] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addSkillOffered = () => {
    if (newSkillOffered.trim() && !skillsOffered.includes(newSkillOffered.trim())) {
      setSkillsOffered([...skillsOffered, newSkillOffered.trim()]);
      setNewSkillOffered('');
    }
  };

  const addSkillWanted = () => {
    if (newSkillWanted.trim() && !skillsWanted.includes(newSkillWanted.trim())) {
      setSkillsWanted([...skillsWanted, newSkillWanted.trim()]);
      setNewSkillWanted('');
    }
  };

  const removeSkillOffered = (skill) => {
    setSkillsOffered(skillsOffered.filter(s => s !== skill));
  };

  const removeSkillWanted = (skill) => {
    setSkillsWanted(skillsWanted.filter(s => s !== skill));
  };

  const handleSave = () => {
    updateProfile({
      ...formData,
      skillsOffered,
      skillsWanted
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      location: user.location,
      availability: user.availability,
      isPublic: user.isPublic
    });
    setSkillsOffered(user.skillsOffered);
    setSkillsWanted(user.skillsWanted);
    setNewSkillOffered('');
    setNewSkillWanted('');
    setIsEditing(false);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <StarIcon className="w-5 h-5 text-yellow-400" />
          <StarIconSolid className="w-5 h-5 text-yellow-400 absolute top-0 left-0" style={{ clipPath: 'inset(0 50% 0 0)' }} />
        </div>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <StarIcon key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
      );
    }

    return stars;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                <PencilIcon className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex items-start space-x-6">
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
            />
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., New York, NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Availability
                    </label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="weekends">Weekends</option>
                      <option value="evenings">Evenings</option>
                      <option value="weekdays">Weekdays</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
                  <div className="flex items-center space-x-4 text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{user.location || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{user.availability}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {renderStars(user.rating)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.rating.toFixed(1)}/5
                    </span>
                    <span className="text-sm text-gray-500">
                      ({Math.floor(Math.random() * 50) + 10} reviews)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Setting */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Profile Visibility</h3>
                <p className="text-sm text-gray-600">
                  Control whether your profile is visible to other users
                </p>
              </div>
              {isEditing ? (
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Make profile public</span>
                </label>
              ) : (
                <div className="flex items-center space-x-2">
                  {user.isPublic ? (
                    <>
                      <EyeIcon className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Public</span>
                    </>
                  ) : (
                    <>
                      <EyeSlashIcon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-600">Private</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skills Offered */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Skills I Offer</h3>
            
            {isEditing && (
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newSkillOffered}
                  onChange={(e) => setNewSkillOffered(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillOffered())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a skill you can offer..."
                />
                <button
                  type="button"
                  onClick={addSkillOffered}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {skillsOffered.map((skill, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  {skill}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeSkillOffered(skill)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-200 text-green-600 hover:bg-green-300 transition-colors duration-200"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {skillsOffered.length === 0 && (
              <p className="text-gray-500 text-sm">No skills added yet.</p>
            )}
          </div>

          {/* Skills Wanted */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Skills I Want to Learn</h3>
            
            {isEditing && (
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newSkillWanted}
                  onChange={(e) => setNewSkillWanted(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillWanted())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a skill you want to learn..."
                />
                <button
                  type="button"
                  onClick={addSkillWanted}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {skillsWanted.map((skill, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeSkillWanted(skill)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300 transition-colors duration-200"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {skillsWanted.length === 0 && (
              <p className="text-gray-500 text-sm">No skills added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;