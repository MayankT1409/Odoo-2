import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const SwapRequestsPage = () => {
  const { authToken } = useAuth();
  const [swapRequests, setSwapRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSwapRequests = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/swaps', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setSwapRequests(res.data.data || []);
      } catch (err) {
        setSwapRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSwapRequests();
    const interval = setInterval(fetchSwapRequests, 5000);
    return () => clearInterval(interval);
  }, [authToken]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {swapRequests.map(req => (
        <div key={req._id}>{req.message}</div>
      ))}
    </div>
  );
};

export default SwapRequestsPage;