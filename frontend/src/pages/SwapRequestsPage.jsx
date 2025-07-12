import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const SwapRequestsPage = () => {
  const { authToken, user } = useAuth(); // <-- Make sure 'user' is available
  const [swapRequests, setSwapRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSwapRequests = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/swaps', {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        // Adjust based on actual structure
        const requests = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.data?.requests)
          ? res.data.data.requests
          : [];

        // Filter requests where current user is the recipient
        const filtered = requests.filter(
          req => req.toUser?._id === user._id
        );

        setSwapRequests(filtered);
      } catch (err) {
        setSwapRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSwapRequests();
    const interval = setInterval(fetchSwapRequests, 5000);

    return () => clearInterval(interval);
  }, [authToken, user]);

  if (loading) return <div className="text-center p-4">Loading swap requests...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-6 p-4 bg-white shadow rounded-md">
      <h2 className="text-xl font-semibold mb-4">Swap Requests</h2>

      {swapRequests.length > 0 ? (
        swapRequests.map((req) => (
          <div
            key={req._id}
            className="border border-gray-200 rounded-lg p-4 mb-4 shadow-sm"
          >
            <p className="text-gray-700">
              <strong>From:</strong> {req.fromUser?.name || 'Unknown'}
            </p>
            <p className="text-gray-700">
              <strong>Message:</strong> {req.message}
            </p>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No swap requests available.</p>
      )}
    </div>
  );
};

export default SwapRequestsPage;
