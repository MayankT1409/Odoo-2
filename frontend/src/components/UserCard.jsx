import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  StarIcon, 
  MapPinIcon, 
  ClockIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const UserCard = ({ user, currentUser }) => {
  const navigate = useNavigate();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  const handleRequestClick = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setShowRequestModal(true);
  };

  const handleSendRequest = () => {
    // Mock sending request
    setRequestSent(true);
    setShowRequestModal(false);
    setRequestMessage('');
    
    // Reset after 3 seconds
    setTimeout(() => {
      setRequestSent(false);
    }, 3000);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <StarIcon className="w-4 h-4 text-yellow-400" />
          <StarIconSolid className="w-4 h-4 text-yellow-400 absolute top-0 left-0" style={{ clipPath: 'inset(0 50% 0 0)' }} />
        </div>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <StarIcon key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }

    return stars;
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200">
        {/* Profile Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center space-x-4 mb-4">
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <MapPinIcon className="w-4 h-4" />
                <span>{user.location}</span>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center space-x-1">
              {renderStars(user.rating)}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user.rating.toFixed(1)}/5
            </span>
          </div>

          {/* Availability */}
          <div className="flex items-center space-x-2 mb-4">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{user.availability}</span>
          </div>
        </div>

        {/* Skills Section */}
        <div className="px-6 pb-4">
          {/* Skills Offered */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Offered</h4>
            <div className="flex flex-wrap gap-2">
              {user.skillsOffered.map((skill, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Skills Wanted */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Wanted</h4>
            <div className="flex flex-wrap gap-2">
              {user.skillsWanted.map((skill, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 pb-6">
          {requestSent ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Request Sent!</span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleRequestClick}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              <span>Request Swap</span>
            </button>
          )}

          {!currentUser && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Login required to send requests
            </p>
          )}
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Send Swap Request to {user.name}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Hi! I'd love to exchange skills with you..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserCard;