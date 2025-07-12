import React, { useState } from 'react';
import { 
  DocumentArrowDownIcon, 
  CalendarIcon,
  ChartBarIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ReportsDownload = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [format, setFormat] = useState('json');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reportTypes = [
    {
      id: 'user-activity',
      title: 'User Activity Report',
      description: 'Comprehensive user data including registration dates, login activity, and account status',
      icon: UsersIcon,
      color: 'blue',
      includes: ['User profiles', 'Registration dates', 'Last login times', 'Account status', 'Role information']
    },
    {
      id: 'feedback-logs',
      title: 'Feedback & Reviews Report',
      description: 'All user reviews, ratings, and feedback data with detailed analytics',
      icon: ChatBubbleLeftRightIcon,
      color: 'green',
      includes: ['Review content', 'Rating scores', 'Review dates', 'User relationships', 'Swap context']
    },
    {
      id: 'swap-stats',
      title: 'Swap Statistics Report',
      description: 'Detailed swap request data with success rates and completion analytics',
      icon: ArrowPathIcon,
      color: 'purple',
      includes: ['Swap requests', 'Status breakdown', 'Success rates', 'Duration analytics', 'Skill categories']
    },
    {
      id: 'moderation-log',
      title: 'Moderation Activity Report',
      description: 'Admin actions, banned users, and content moderation history',
      icon: ShieldCheckIcon,
      color: 'red',
      includes: ['Banned users', 'Ban reasons', 'Moderation actions', 'Admin activity', 'Policy violations']
    }
  ];

  const handleDateChange = (field, value) => {
    setDateRange({
      ...dateRange,
      [field]: value
    });
  };

  const downloadReport = async () => {
    if (!selectedReport) {
      setError('Please select a report type');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        format,
        ...(dateRange.from && { dateFrom: dateRange.from }),
        ...(dateRange.to && { dateTo: dateRange.to }),
        ...(includeInactive && { includeInactive: 'true' })
      });

      const response = await fetch(`/api/admin/reports/${selectedReport}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${selectedReport}_report.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSuccess('Report downloaded successfully!');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to download report');
      }
    } catch (err) {
      setError('Error downloading report');
    } finally {
      setLoading(false);
    }
  };

  const getReportIcon = (reportId) => {
    const report = reportTypes.find(r => r.id === reportId);
    return report ? report.icon : DocumentArrowDownIcon;
  };

  const getReportColor = (reportId) => {
    const report = reportTypes.find(r => r.id === reportId);
    return report ? report.color : 'gray';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center">
              <DocumentArrowDownIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Download Reports</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Export detailed reports of user activity, feedback logs, and platform statistics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Select Report Type</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {reportTypes.map((report) => {
                    const IconComponent = report.icon;
                    return (
                      <div
                        key={report.id}
                        className={`relative cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                          selectedReport === report.id
                            ? `border-${report.color}-500 bg-${report.color}-50 ring-2 ring-${report.color}-500`
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedReport(report.id)}
                      >
                        <div className="flex items-start">
                          <input
                            type="radio"
                            name="reportType"
                            value={report.id}
                            checked={selectedReport === report.id}
                            onChange={(e) => setSelectedReport(e.target.value)}
                            className={`h-4 w-4 text-${report.color}-600 focus:ring-${report.color}-500 border-gray-300 mt-1`}
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <IconComponent className={`w-5 h-5 text-${report.color}-600 mr-2`} />
                              <label className="text-sm font-medium text-gray-900">{report.title}</label>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {report.description}
                            </p>
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Includes:</p>
                              <ul className="text-xs text-gray-600 space-y-0.5">
                                {report.includes.map((item, index) => (
                                  <li key={index}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Date Range */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Date Range
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => handleDateChange('from', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => handleDateChange('to', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Leave empty to include all historical data
                </p>
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Export Options</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Format
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value="json"
                        checked={format === 'json'}
                        onChange={(e) => setFormat(e.target.value)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">JSON (Structured data)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value="csv"
                        checked={format === 'csv'}
                        onChange={(e) => setFormat(e.target.value)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">CSV (Spreadsheet format)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeInactive}
                      onChange={(e) => setIncludeInactive(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include inactive/banned users</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={downloadReport}
              disabled={loading || !selectedReport}
              className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Download Report
                </>
              )}
            </button>

            {/* Report Preview */}
            {selectedReport && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  {React.createElement(getReportIcon(selectedReport), {
                    className: `h-4 w-4 text-${getReportColor(selectedReport)}-600 mr-2`
                  })}
                  Selected Report
                </h4>
                <p className="text-sm text-gray-600">
                  {reportTypes.find(r => r.id === selectedReport)?.title}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Format: {format.toUpperCase()} | 
                  {dateRange.from || dateRange.to ? 
                    ` Date Range: ${dateRange.from || 'All'} to ${dateRange.to || 'All'}` : 
                    ' All historical data'
                  }
                  {includeInactive && ' | Including inactive users'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Usage Guidelines */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Report Usage Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Data Privacy</h4>
              <ul className="space-y-1">
                <li>• Handle exported data according to privacy policies</li>
                <li>• Secure storage of downloaded reports is required</li>
                <li>• Delete reports when no longer needed</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Best Practices</h4>
              <ul className="space-y-1">
                <li>• Use date ranges for large datasets</li>
                <li>• JSON format for detailed analysis</li>
                <li>• CSV format for spreadsheet applications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDownload;