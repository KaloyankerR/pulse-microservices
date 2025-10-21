'use client';

import { useState } from 'react';
import { CreateEventRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { MapPin, Video, Calendar } from 'lucide-react';

interface CreateEventProps {
  onEventCreate?: (data: CreateEventRequest) => Promise<void>;
}

export function CreateEvent({ onEventCreate }: CreateEventProps) {
  const [formData, setFormData] = useState<CreateEventRequest>({
    title: '',
    description: '',
    event_type: 'PHYSICAL',
    location: '',
    virtual_link: '',
    start_date: '',
    end_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.start_date) {
      setError('Please fill in all required fields');
      return;
    }

    // Backend requires end_date, so we need to provide it
    if (!formData.end_date) {
      setError('End date is required');
      return;
    }

    if (formData.event_type === 'PHYSICAL' && (!formData.location || !formData.location.trim())) {
      setError('Location is required for physical events');
      return;
    }

    if (formData.event_type === 'VIRTUAL' && (!formData.virtual_link || !formData.virtual_link.trim())) {
      setError('Virtual link is required for virtual events');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Clean up the data before sending
      // Convert datetime-local format to RFC3339 format for the API
      const convertToRFC3339 = (dateTimeLocal: string): string => {
        if (!dateTimeLocal) return '';
        // datetime-local format: "2025-01-15T14:30"
        // RFC3339 format: "2025-01-15T14:30:00Z"
        return new Date(dateTimeLocal).toISOString();
      };

      const submitData: CreateEventRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        event_type: formData.event_type,
        start_date: convertToRFC3339(formData.start_date),
        end_date: convertToRFC3339(formData.end_date),
        ...(formData.event_type === 'PHYSICAL' && formData.location && { location: formData.location.trim() }),
        ...(formData.event_type === 'VIRTUAL' && formData.virtual_link && { virtual_link: formData.virtual_link.trim() }),
      };

      await onEventCreate?.(submitData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        event_type: 'PHYSICAL',
        location: '',
        virtual_link: '',
        start_date: '',
        end_date: '',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to create event';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateEventRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error on input change
  };

  const handleEventTypeChange = (eventType: 'PHYSICAL' | 'VIRTUAL') => {
    setFormData(prev => ({ 
      ...prev, 
      event_type: eventType,
      // Clear the opposite field when switching types
      location: eventType === 'PHYSICAL' ? prev.location : '',
      virtual_link: eventType === 'VIRTUAL' ? prev.virtual_link : '',
    }));
    setError(null);
  };

  // Get minimum datetime for start_date (current time)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  // Get minimum datetime for end_date (start_date if set)
  const getMinEndDateTime = () => {
    if (!formData.start_date) return getMinDateTime();
    return formData.start_date;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Event Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600"
              maxLength={100}
            />
          </div>

          {/* Event Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your event..."
              rows={3}
              className="w-full"
              maxLength={500}
            />
            <div className="text-sm text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </div>
          </div>

          {/* Event Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="event_type"
                  value="PHYSICAL"
                  checked={formData.event_type === 'PHYSICAL'}
                  onChange={() => handleEventTypeChange('PHYSICAL')}
                  className="mr-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
                <MapPin className="w-4 h-4 mr-1 text-gray-600" />
                <span className="text-gray-700">Physical Event</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="event_type"
                  value="VIRTUAL"
                  checked={formData.event_type === 'VIRTUAL'}
                  onChange={() => handleEventTypeChange('VIRTUAL')}
                  className="mr-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
                <Video className="w-4 h-4 mr-1 text-gray-600" />
                <span className="text-gray-700">Virtual Event</span>
              </label>
            </div>
          </div>

          {/* Location (Physical Events) */}
          {formData.event_type === 'PHYSICAL' && (
            <div className="mb-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter event location"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600"
                maxLength={200}
              />
            </div>
          )}

          {/* Virtual Link (Virtual Events) */}
          {formData.event_type === 'VIRTUAL' && (
            <div className="mb-4">
              <label htmlFor="virtual_link" className="block text-sm font-medium text-gray-700 mb-2">
                Virtual Link *
              </label>
              <input
                id="virtual_link"
                type="url"
                value={formData.virtual_link}
                onChange={(e) => handleInputChange('virtual_link', e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600"
              />
            </div>
          )}

          {/* Start Date/Time */}
          <div className="mb-4">
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date & Time *
            </label>
            <input
              id="start_date"
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              min={getMinDateTime()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          {/* End Date/Time */}
          <div className="mb-4">
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
              End Date & Time *
            </label>
            <input
              id="end_date"
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              min={getMinEndDateTime()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!formData.title.trim() || !formData.description.trim() || !formData.start_date || !formData.end_date || isSubmitting}
              isLoading={isSubmitting}
              className="flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
