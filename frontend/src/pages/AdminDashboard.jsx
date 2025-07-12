import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [swaps, setSwaps] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchSwaps();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchSwaps = async () => {
    try {
      const res = await axios.get('/api/admin/swaps');
      if (Array.isArray(res.data)) {
        setSwaps(res.data);
      } else if (Array.isArray(res.data.swaps)) {
        setSwaps(res.data.swaps);
      } else {
        setSwaps([]);
      }
    } catch (error) {
      console.error("Error fetching swaps:", error);
    }
  };

  const handleBan = async (userId) => {
    await axios.post(`/api/admin/ban/${userId}`);
    fetchUsers();
  };

  const handleSkillApproval = async (userId, approved) => {
    await axios.post(`/api/admin/approve-skills`, { userId, approved });
    fetchUsers();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">Admin Dashboard</h1>

      {/* Users Section */}
      <section className="mb-10 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-left">
            <thead className="bg-blue-100 text-blue-800 font-medium">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {Array.isArray(users) && users.map((user) => (
                <tr key={user._id} className="border-t">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {user.banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => handleBan(user._id)}
                      className={`px-3 py-1 rounded text-white text-xs ${user.banned ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                      {user.banned ? "Unban" : "Ban"}
                    </button>
                    <button onClick={() => handleSkillApproval(user._id, true)}
                      className="px-3 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600">
                      Approve
                    </button>
                    <button onClick={() => handleSkillApproval(user._id, false)}
                      className="px-3 py-1 rounded text-xs bg-yellow-400 text-white hover:bg-yellow-500">
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Swap Requests Section */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Swap Requests</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-left">
            <thead className="bg-purple-100 text-purple-800 font-medium">
              <tr>
                <th className="p-3">From</th>
                <th className="p-3">To</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {Array.isArray(swaps) && swaps.map((swap) => (
                <tr key={swap._id} className="border-t">
                  <td className="p-3">{swap.requesterName}</td>
                  <td className="p-3">{swap.receiverName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      swap.status === "pending" ? "bg-yellow-100 text-yellow-800"
                      : swap.status === "accepted" ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                    }`}>
                      {swap.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
