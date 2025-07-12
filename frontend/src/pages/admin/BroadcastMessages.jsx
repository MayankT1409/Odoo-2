import React, { useState } from 'react';
import { 
  BellIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const BroadcastMessages = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const messageTypes = [
    {
      value: 'info',
      label: 'Information',
      icon: InformationCircleIcon,
      color: 'blue',
      description: 'General announcements and updates'
    },
    {
      value: 'warning',
      label: 'Warning',
      icon: ExclamationTriangleIcon,
      color: 'yellow',
      description: 'Important notices requiring attention'
    },
    {
      value: 'maintenance',
      label: 'Maintenance',
      icon: WrenchScrewdriverIcon,
      color: 'orange',
      description: 'System maintenance and downtime alerts'
    },
    {
      value: 'feature',
      label: 'New Feature',
      icon: SparklesIcon,
      color: 'purple',
      description: 'New features and improvements'
    }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/messages/broadcast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Broadcast message sent successfully to all active users!');
        setFormData({
          title: '',
          message: '',
          type: 'info',
          priority: 'medium'
        });
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to send broadcast message');
      }
    } catch (err) {
      setError('Error sending broadcast message');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const typeConfig = messageTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : InformationCircleIcon;
  };

  const getTypeColor = (type) => {
    const typeConfig = messageTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.color : 'blue';
  };

  const getPriorityColor = (priority) => {
    const priorityConfig = priorityLevels.find(p => p.value === priority);
    return priorityConfig ? priorityConfig.color : 'yellow';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Broadcast Messages</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Send platform-wide messages to all active users
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Broadcast Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Create Broadcast Message</h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Message Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Message Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {messageTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <div
                      key={type.value}
                      className={`relative cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                        formData.type === type.value
                          ? `border-${type.color}-500 bg-${type.color}-50 ring-2 ring-${type.color}-500`
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                      onClick={() => setFormData({...formData, type: type.value})}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value={type.value}
                          checked={formData.type === type.value}
                          onChange={handleInputChange}
                          className={`h-4 w-4 text-${type.color}-600 focus:ring-${type.color}-500 border-gray-300`}
                        />
                        <div className="ml-3">
                          <div className="flex items-center">
                            <IconComponent className={`w-5 h-5 text-${type.color}-600 mr-2`} />
                            <label className="text-sm font-medium text-gray-900">{type.label}</label>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priority Level *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {priorityLevels.map((priority) => (
                  <div
                    key={priority.value}
                    className={`relative cursor-pointer rounded-lg border p-3 text-center transition-all duration-200 ${
                      formData.priority === priority.value
                        ? `border-${priority.color}-500 bg-${priority.color}-50 ring-2 ring-${priority.color}-500`
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                    onClick={() => setFormData({...formData, priority: priority.value})}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={priority.value}
                      checked={formData.priority === priority.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`text-sm font-medium text-${priority.color}-800`}>
                      {priority.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Message Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                maxLength={200}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter a clear, descriptive title..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Message Content */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message Content *
              </label>
              <textarea
                id="message"
                name="message"
                required
                value={formData.message}
                onChange={handleInputChange}
                rows={6}
                maxLength={2000}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Write your message content here..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.message.length}/2000 characters
              </p>
            </div>

            {/* Preview */}
            {(formData.title || formData.message) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Preview
                </label>
                <div className={`border border-${getTypeColor(formData.type)}-200 bg-${getTypeColor(formData.type)}-50 rounded-lg p-4`}>
                  <div className="flex items-start">
                    {React.createElement(getTypeIcon(formData.type), {
                      className: `h-5 w-5 text-${getTypeColor(formData.type)}-600 mr-3 mt-0.5 flex-shrink-0`
                    })}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-sm font-medium text-${getTypeColor(formData.type)}-800`}>
                          {formData.title || 'Message Title'}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-${getPriorityColor(formData.priority)}-100 text-${getPriorityColor(formData.priority)}-800`}>
                          {formData.priority}
                        </span>
                      </div>
                      <p className={`text-sm text-${getTypeColor(formData.type)}-700`}>
                        {formData.message || 'Message content will appear here...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setFormData({
                  title: '',
                  message: '',
                  type: 'info',
                  priority: 'medium'
                })}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.message.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <BellIcon className="h-4 w-4 mr-2" />
                    Send Broadcast
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Guidelines */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Broadcasting Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Use clear, concise language that all users can understand</li>
            <li>• Choose the appropriate message type and priority level</li>
            <li>• For maintenance alerts, include expected duration and impact</li>
            <li>• For feature announcements, highlight key benefits</li>
            <li>• Avoid sending too many messages to prevent notification fatigue</li>
            <li>• Test urgent messages with a small group first if possible</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BroadcastMessages;