import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const SwapRequestsPage = () => {
  const { user, authToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/swap-requests', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setRequests(res.data.data.swaps || []);
      } catch (err) {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [authToken]);

  // Approve a request
  const handleApprove = async (swapId) => {
    await axios.put(`http://localhost:5000/api/swap-requests/${swapId}/accept`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    setRequests(requests =>
      requests.map(r => r._id === swapId ? { ...r, status: 'accepted' } : r)
    );
  };

  // Reject a request
  const handleReject = async (swapId) => {
    await axios.put(`http://localhost:5000/api/swap-requests/${swapId}/reject`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    setRequests(requests =>
      requests.map(r => r._id === swapId ? { ...r, status: 'rejected' } : r)
    );
  };

  if (loading) return <div>Loading...</div>;

  // Split requests into received and sent
  const received = requests.filter(r => r.recipient._id === user._id);
  const sent = requests.filter(r => r.requester._id === user._id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Swap Requests</h2>
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'received' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('received')}
        >
          Received ({received.length})
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'sent' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent ({sent.length})
        </button>
      </div>
      {activeTab === 'received' && (
        <>
          {received.length === 0 && <div>No received swap requests.</div>}
          {received.map(req => (
            <div key={req._id} className="border rounded-lg p-4 mb-4 bg-white shadow">
              <div className="mb-2">
                <b>From:</b> {req.requester.name}
              </div>
              <div className="mb-2">
                <b>Skill Offered:</b> {req.skillOffered} <b>Skill Wanted:</b> {req.skillWanted}
              </div>
              <div className="mb-2">
                <b>Status:</b> <span className={
                  req.status === 'pending' ? 'text-yellow-600' :
                  req.status === 'accepted' ? 'text-green-600' :
                  req.status === 'rejected' ? 'text-red-600' :
                  'text-gray-600'
                }>{req.status}</span>
              </div>
              {req.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleApprove(req._id)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                  <button onClick={() => handleReject(req._id)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                </div>
              )}
            </div>
          ))}
        </>
      )}
      {activeTab === 'sent' && (
        <>
          {sent.length === 0 && <div>No sent swap requests.</div>}
          {sent.map(req => (
            <div key={req._id} className="border rounded-lg p-4 mb-4 bg-white shadow">
              <div className="mb-2">
                <b>To:</b> {req.recipient.name}
              </div>
              <div className="mb-2">
                <b>Skill Offered:</b> {req.skillOffered} <b>Skill Wanted:</b> {req.skillWanted}
              </div>
              <div className="mb-2">
                <b>Status:</b> <span className={
                  req.status === 'pending' ? 'text-yellow-600' :
                  req.status === 'accepted' ? 'text-green-600' :
                  req.status === 'rejected' ? 'text-red-600' :
                  'text-gray-600'
                }>{req.status}</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default SwapRequestsPage;