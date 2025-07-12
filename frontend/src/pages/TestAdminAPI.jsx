import React, { useState } from 'react';
import { adminAPI } from '../utils/api';

const TestAdminAPI = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testResults = {};

    try {
      // Test dashboard
      console.log('Testing dashboard...');
      const dashboardData = await adminAPI.getDashboard();
      testResults.dashboard = { success: true, data: dashboardData };
    } catch (err) {
      testResults.dashboard = { success: false, error: err.message };
    }

    try {
      // Test users
      console.log('Testing users...');
      const usersData = await adminAPI.getUsers();
      testResults.users = { success: true, data: usersData };
    } catch (err) {
      testResults.users = { success: false, error: err.message };
    }

    try {
      // Test swaps
      console.log('Testing swaps...');
      const swapsData = await adminAPI.getSwaps();
      testResults.swaps = { success: true, data: swapsData };
    } catch (err) {
      testResults.swaps = { success: false, error: err.message };
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin API Test</h1>
      
      <button 
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Testing...' : 'Run API Tests'}
      </button>

      <div className="space-y-4">
        {Object.entries(results).map(([endpoint, result]) => (
          <div key={endpoint} className="border p-4 rounded">
            <h3 className="font-bold">{endpoint.toUpperCase()}</h3>
            <p className={result.success ? 'text-green-600' : 'text-red-600'}>
              {result.success ? '✅ SUCCESS' : '❌ FAILED'}
            </p>
            {result.error && <p className="text-red-500">Error: {result.error}</p>}
            {result.data && (
              <details className="mt-2">
                <summary>Data</summary>
                <pre className="text-xs bg-gray-100 p-2 mt-2 overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestAdminAPI;