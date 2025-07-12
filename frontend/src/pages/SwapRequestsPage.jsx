import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckIcon, 
  XMarkIcon, 
  ClockIcon, 
  TrashIcon,
  ChatBubbleLeftRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const SwapRequestsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('received');
  const [requests, setRequests] = useState({
    received: [],
    sent: [],
    accepted: [],
    completed: []
  });
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    // Mock data for swap requests
    const mockRequests = {
      received: [
        {
          id: 1,
          from: {
            id: 2,
            name: 'Sarah Chen',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
            skillsOffered: ['Digital Marketing', 'SEO'],
            skillsWanted: ['Graphic Design']
          },
          message: 'Hi! I\'d love to learn graphic design from you in exchange for digital marketing skills.',
          createdAt: '2024-01-15T10:30:00Z',
          status: 'pending'
        },
        {
          id: 2,
          from: {
            id: 3,
            name: 'Alex Rodriguez',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
            skillsOffered: ['Mobile Development', 'Flutter'],
            skillsWanted: ['UI/UX Design']
          },
          message: 'Hello! I can teach you mobile development with Flutter if you can help me with UI/UX design.',
          createdAt: '2024-01-14T15:45:00Z',
          status: 'pending'
        }
      ],
      sent: [
        {
          id: 3,
          to: {
            id: 4,
            name: 'Emma Thompson',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
            skillsOffered: ['Project Management', 'Agile'],
            skillsWanted: ['Data Analysis']
          },
          message: 'Hi Emma! I can help you with data analysis in exchange for project management training.',
          createdAt: '2024-01-13T09:20:00Z',
          status: 'pending'
        }
      ],
      accepted: [
        {
          id: 4,
          with: {
            id: 5,
            name: 'David Kim',
            avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
            skillsOffered: ['Cybersecurity'],
            skillsWanted: ['Web Development']
          },
          message: 'Great! Let\'s start with the basics of cybersecurity.',
          acceptedAt: '2024-01-12T14:30:00Z',
          status: 'active'
        }
      ],
      completed: [
        {
          id: 5,
          with: {
            id: 6,
            name: 'Lisa Wang',
            avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
            skillsOffered: ['Photography'],
            skillsWanted: ['Social Media Marketing']
          },
          completedAt: '2024-01-10T16:00:00Z',
          status: 'completed',
          rated: false
        }
      ]
    };

    setRequests(mockRequests);
  }, []);

  const handleAcceptRequest = (requestId) => {
    setRequests(prev => {
      const request = prev.received.find(r => r.id === requestId);
      if (request) {
        return {
          ...prev,
          received: prev.received.filter(r => r.id !== requestId),
          accepted: [...prev.accepted, { 
            ...request, 
            with: request.from,
            status: 'active',
            acceptedAt: new Date().toISOString()
          }]
        };
      }
      return prev;
    });
  };

  const handleRejectRequest = (requestId) => {
    setRequests(prev => ({
      ...prev,
      received: prev.received.filter(r => r.id !== requestId)
    }));
  };

  const handleDeleteRequest = (requestId) => {
    setRequests(prev => ({
      ...prev,
      sent: prev.sent.filter(r => r.id !== requestId)
    }));
  };

  const handleCompleteSwap = (requestId) => {
    setRequests(prev => {
      const request = prev.accepted.find(r => r.id === requestId);
      if (request) {
        return {
          ...prev,
          accepted: prev.accepted.filter(r => r.id !== requestId),
          completed: [...prev.completed, { 
            ...request, 
            status: 'completed',
            completedAt: new Date().toISOString(),
            rated: false
          }]
        };
      }
      return prev;
    });
  };

  const handleRateUser = (request) => {
    setSelectedRequest(request);
    setShowRatingModal(true);
  };

  const submitRating = () => {
    if (selectedRequest && rating > 0) {
      setRequests(prev => ({
        ...prev,
        completed: prev.completed.map(r => 
          r.id === selectedRequest.id 
            ? { ...r, rated: true, userRating: rating, userFeedback: feedback }
            : r
        )
      }));
      setShowRatingModal(false);
      setSelectedRequest(null);
      setRating(0);
      setFeedback('');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'received', label: 'Received', count: requests.received.length },
    { id: 'sent', label: 'Sent', count: requests.sent.length },
    { id: 'accepted', label: 'Active', count: requests.accepted.length },
    { id: 'completed', label: 'Completed', count: requests.completed.length }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to view your swap requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Swap Requests</h1>
          <p className="text-gray-600">Manage your skill exchange requests and collaborations</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Received Requests */}
            {activeTab === 'received' && (
              <div className="space-y-4">
                {requests.received.length > 0 ? (
                  requests.received.map((request) => (
                    <div key={request.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <img 
                            src={request.from.avatar} 
                            alt={request.from.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{request.from.name}</h3>
                            <p className="text-gray-600 mb-2">{request.message}</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="text-sm text-gray-500">Offers:</span>
                              {request.from.skillsOffered.map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm text-gray-500">Wants:</span>
                              {request.from.skillsWanted.map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              <ClockIcon className="w-4 h-4 inline mr-1" />
                              {formatDate(request.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                          >
                            <CheckIcon className="w-4 h-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                          >
                            <XMarkIcon className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No received requests</p>
                  </div>
                )}
              </div>
            )}

            {/* Sent Requests */}
            {activeTab === 'sent' && (
              <div className="space-y-4">
                {requests.sent.length > 0 ? (
                  requests.sent.map((request) => (
                    <div key={request.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <img 
                            src={request.to.avatar} 
                            alt={request.to.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">To: {request.to.name}</h3>
                            <p className="text-gray-600 mb-2">{request.message}</p>
                            <p className="text-sm text-gray-500">
                              <ClockIcon className="w-4 h-4 inline mr-1" />
                              Sent {formatDate(request.createdAt)}
                            </p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                              Pending Response
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No sent requests</p>
                  </div>
                )}
              </div>
            )}

            {/* Active Swaps */}
            {activeTab === 'accepted' && (
              <div className="space-y-4">
                {requests.accepted.length > 0 ? (
                  requests.accepted.map((request) => (
                    <div key={request.id} className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <img 
                            src={request.with.avatar} 
                            alt={request.with.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">Swapping with: {request.with.name}</h3>
                            <p className="text-gray-600 mb-2">{request.message}</p>
                            <p className="text-sm text-gray-500">
                              <ClockIcon className="w-4 h-4 inline mr-1" />
                              Started {formatDate(request.acceptedAt)}
                            </p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                              Active Swap
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            <span>Message</span>
                          </button>
                          <button
                            onClick={() => handleCompleteSwap(request.id)}
                            className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                          >
                            <CheckIcon className="w-4 h-4" />
                            <span>Complete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No active swaps</p>
                  </div>
                )}
              </div>
            )}

            {/* Completed Swaps */}
            {activeTab === 'completed' && (
              <div className="space-y-4">
                {requests.completed.length > 0 ? (
                  requests.completed.map((request) => (
                    <div key={request.id} className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <img 
                            src={request.with.avatar} 
                            alt={request.with.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">Completed with: {request.with.name}</h3>
                            <p className="text-sm text-gray-500">
                              <ClockIcon className="w-4 h-4 inline mr-1" />
                              Completed {formatDate(request.completedAt)}
                            </p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                              Completed
                            </span>
                            {request.rated && (
                              <div className="mt-2">
                                <span className="text-sm text-green-600 font-medium">✓ Rated</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {!request.rated && (
                          <button
                            onClick={() => handleRateUser(request)}
                            className="flex items-center space-x-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors duration-200"
                          >
                            <StarIcon className="w-4 h-4" />
                            <span>Rate User</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No completed swaps</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rate {selectedRequest.with.name}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    {star <= rating ? (
                      <StarIconSolid className="w-8 h-8 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                disabled={rating === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapRequestsPage;