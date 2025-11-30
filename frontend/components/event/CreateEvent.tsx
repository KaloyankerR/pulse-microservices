'use client';

import { useState } from 'react';
import { CreateEventRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
    <Card variant="coral">
      <CardContent className="p-0">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 bg-[#FF9B85] border-[3px] border-[#1A1A1A] text-[#1A1A1A] px-4 py-3 shadow-[4px_4px_0px_#1A1A1A] font-bold">
                {error}
              </div>
            )}
            
            {/* Event Title */}
            <div className="mb-4">
              <Input
                id="title"
                label="Event Title *"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter event title"
                maxLength={100}
              />
            </div>

            {/* Event Description */}
            <div className="mb-4">
              <Textarea
                id="description"
                label="Description *"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your event..."
                rows={3}
                maxLength={500}
              />
              <div className="text-sm font-bold text-[#1A1A1A] opacity-70 mt-2">
                {formData.description.length}/500 characters
              </div>
            </div>

            {/* Event Type */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-[#1A1A1A] mb-3">
                Event Type *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer border-[3px] border-[#1A1A1A] p-3 bg-white shadow-[4px_4px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A]"
                  style={{ transition: 'none' }}>
                  <input
                    type="radio"
                    name="event_type"
                    value="PHYSICAL"
                    checked={formData.event_type === 'PHYSICAL'}
                    onChange={() => handleEventTypeChange('PHYSICAL')}
                    className="mr-2 w-4 h-4 accent-[#1A1A1A]"
                  />
                  <MapPin className="w-4 h-4 mr-1 text-[#1A1A1A]" />
                  <span className="font-bold text-[#1A1A1A]">Physical Event</span>
                </label>
                <label className="flex items-center cursor-pointer border-[3px] border-[#1A1A1A] p-3 bg-white shadow-[4px_4px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A]"
                  style={{ transition: 'none' }}>
                  <input
                    type="radio"
                    name="event_type"
                    value="VIRTUAL"
                    checked={formData.event_type === 'VIRTUAL'}
                    onChange={() => handleEventTypeChange('VIRTUAL')}
                    className="mr-2 w-4 h-4 accent-[#1A1A1A]"
                  />
                  <Video className="w-4 h-4 mr-1 text-[#1A1A1A]" />
                  <span className="font-bold text-[#1A1A1A]">Virtual Event</span>
                </label>
              </div>
            </div>

            {/* Location (Physical Events) */}
            {formData.event_type === 'PHYSICAL' && (
              <div className="mb-4">
                <Input
                  id="location"
                  label="Location *"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter event location"
                  maxLength={200}
                />
              </div>
            )}

            {/* Virtual Link (Virtual Events) */}
            {formData.event_type === 'VIRTUAL' && (
              <div className="mb-4">
                <Input
                  id="virtual_link"
                  label="Virtual Link *"
                  type="url"
                  value={formData.virtual_link}
                  onChange={(e) => handleInputChange('virtual_link', e.target.value)}
                  placeholder="https://meet.google.com/..."
                />
              </div>
            )}

            {/* Start Date/Time */}
            <div className="mb-4">
              <Input
                id="start_date"
                label="Start Date & Time *"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                min={getMinDateTime()}
              />
            </div>

            {/* End Date/Time */}
            <div className="mb-4">
              <Input
                id="end_date"
                label="End Date & Time *"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                min={getMinEndDateTime()}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={!formData.title.trim() || !formData.description.trim() || !formData.start_date || !formData.end_date || isSubmitting}
                isLoading={isSubmitting}
                className="flex items-center"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
