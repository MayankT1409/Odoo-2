import React, { useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  SpeakerWaveIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const BroadcastMessage = () => {
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
    { value: 'info', label: 'Information', icon: InformationCircleIcon, color: 'blue' },
    { value: 'warning', label: 'Warning', icon: ExclamationTriangleIcon, color: 'yellow' },
    { value: 'maintenance', label: 'Maintenance', icon: WrenchScrewdriverIcon, color: 'orange' },
    { value: 'feature', label: 'New Feature', icon: SparklesIcon, color: 'green' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'blue' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminAPI.broadcastMessage(formData);
      
      if (response.success) {
        setSuccess('Broadcast message sent successfully!');
        setFormData({
          title: '',
          message: '',
          type: 'info',
          priority: 'medium'
        });
      } else {
        setError(response.message || 'Failed to send broadcast message');
      }
    } catch (err) {
      console.error('Broadcast message error:', err);
      setError('Error sending broadcast message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const selectedType = messageTypes.find(type => type.value === formData.type);
  const selectedPriority = priorities.find(priority => priority.value === formData.priority);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3 mb-6">
        <SpeakerWaveIcon className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900">Broadcast Message</h2>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Message Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter message title..."
          />
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
        </div>

        {/* Message Content */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message Content
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            maxLength={2000}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your message content..."
          />
          <p className="text-xs text-gray-500 mt-1">{formData.message.length}/2000 characters</p>
        </div>

        {/* Message Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {messageTypes.map((type) => {
              const Icon = type.icon;
              return (
                <label
                  key={type.value}
                  className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.type === type.value
                      ? `border-${type.color}-500 bg-${type.color}-50`
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Icon className={`w-5 h-5 mr-3 ${
                    formData.type === type.value ? `text-${type.color}-600` : 'text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    formData.type === type.value ? `text-${type.color}-900` : 'text-gray-700'
                  }`}>
                    {type.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
            Priority Level
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {priorities.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
          <div className={`p-3 rounded-md border-l-4 ${
            selectedType ? `border-l-${selectedType.color}-500 bg-${selectedType.color}-50` : 'border-l-gray-500 bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {selectedType && <selectedType.icon className={`w-4 h-4 text-${selectedType.color}-600`} />}
              <span className={`text-sm font-medium ${
                selectedType ? `text-${selectedType.color}-900` : 'text-gray-900'
              }`}>
                {formData.title || 'Message Title'}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                selectedPriority ? `bg-${selectedPriority.color}-100 text-${selectedPriority.color}-800` : 'bg-gray-100 text-gray-800'
              }`}>
                {selectedPriority?.label || 'Medium'}
              </span>
            </div>
            <p className={`text-sm ${
              selectedType ? `text-${selectedType.color}-700` : 'text-gray-700'
            }`}>
              {formData.message || 'Your message content will appear here...'}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !formData.title.trim() || !formData.message.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </div>
            ) : (
              'Send Broadcast Message'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BroadcastMessage;