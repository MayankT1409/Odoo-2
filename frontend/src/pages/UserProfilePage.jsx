import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const UserProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser, authToken } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [offeredSkill, setOfferedSkill] = useState('');
  const [wantedSkill, setWantedSkill] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:7000/api/users/${userId}`);
        const userData = res.data.data?.user || res.data.user;
        setUser(userData);
        // Try to get reviews and stats from the same response
        if (res.data.data?.reviews) setReviews(res.data.data.reviews);
        if (userData?.rating) setAvgRating(userData.rating);
        setError('');
      } catch (err) {
        setError('User not found');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  // If reviews not included, fetch separately
  useEffect(() => {
    if (user && reviews.length === 0) {
      axios.get(`http://localhost:7000/api/users/${user._id || user.id}/reviews?type=received&limit=5`)
        .then(res => {
          setReviews(res.data.data?.reviews || []);
        })
        .catch(() => {});
    }
  }, [user, reviews.length]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<StarIconSolid key="half" className="w-5 h-5 text-yellow-400 opacity-50" />);
    }
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<StarIconSolid key={`empty-${i}`} className="w-5 h-5 text-gray-300" />);
    }
    return stars;
  };

  const handleRequest = () => {
    setShowModal(true);
    setFormError('');
    setFormSuccess('');
    setOfferedSkill('');
    setWantedSkill('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!offeredSkill || !wantedSkill) {
      setFormError('Please select both skills.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        recipient: user._id || user.id,
        skillOffered: offeredSkill,
        skillWanted: wantedSkill,
        message,
        learningMode: 'Online', // default for now
        duration: { estimatedHours: 1, timeframe: 'Flexible' }, // default for now
      };
      const res = await axios.post('http://localhost:7000/api/swap-requests', payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setFormSuccess('Request sent successfully!');
      setShowModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Profile Info */}
          <div className="flex items-center space-x-6 mb-6">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
              <div className="flex items-center space-x-4 text-gray-600 mb-2">
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
                <div className="flex items-center space-x-1">{renderStars(avgRating)}</div>
                <span className="text-sm font-medium text-gray-700">{avgRating?.toFixed(1) || '0.0'}/5</span>
                <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
              </div>
            </div>
          </div>
          {/* Skills Offered */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Offered</h4>
            <div className="flex flex-wrap gap-2">
              {user.skillsOffered?.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">{skill}</span>
              ))}
            </div>
          </div>
          {/* Skills Wanted */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Wanted</h4>
            <div className="flex flex-wrap gap-2">
              {user.skillsWanted?.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">{skill}</span>
              ))}
            </div>
          </div>
          {/* Request Button and Modal (existing) */}
          {currentUser && currentUser.id !== (user?._id || user?.id) && (
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
              onClick={handleRequest}
            >
              Request
            </button>
          )}
          {!currentUser && (
            <div className="text-center text-gray-500 mt-4">Login to send a swap request.</div>
          )}
          {formSuccess && <div className="text-green-600 text-center mt-4">{formSuccess}</div>}
          {formError && <div className="text-red-600 text-center mt-4">{formError}</div>}
        </div>
        {/* Rating and Feedback Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Rating and Feedback</h3>
          {reviews.length === 0 ? (
            <div className="text-gray-500">No reviews yet.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-4">
                  <div className="flex items-center space-x-3 mb-1">
                    <img src={review.reviewer?.avatar || ''} alt={review.reviewer?.name || ''} className="w-8 h-8 rounded-full object-cover" />
                    <span className="font-medium text-gray-800">{review.reviewer?.name || 'Anonymous'}</span>
                    <span className="flex items-center ml-2">{renderStars(review.rating?.overall || review.rating || 0)}</span>
                  </div>
                  <div className="text-gray-700 text-sm mt-1">{review.comment}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Modal (existing) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Send Swap Request to {user.name}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose one of your offered skills
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={offeredSkill}
                  onChange={e => setOfferedSkill(e.target.value)}
                  required
                >
                  <option value="">Select a skill</option>
                  {currentUser?.skillsOffered?.map((skill, idx) => (
                    <option key={idx} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose one of their wanted skills
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={wantedSkill}
                  onChange={e => setWantedSkill(e.target.value)}
                  required
                >
                  <option value="">Select a skill</option>
                  {user?.skillsWanted?.map((skill, idx) => (
                    <option key={idx} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Hi! I'd love to exchange skills with you..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
              {formError && <div className="text-red-600 text-center mt-2">{formError}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage; 