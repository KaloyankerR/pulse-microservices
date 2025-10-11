import { FC, useCallback, useState } from 'react';

import axios from 'axios';
import { toast } from 'react-hot-toast';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

import Avatar from '@/components/Avatar';
import Button from '@/components/shared/Button';

import useCurrentUser from '@/hooks/useCurrentUser';
import useEvents from '@/hooks/useEvents';

interface ICreateEventFormProps {
  placeholder?: string;
  onClose?: () => void;
}

const CreateEventForm: FC<ICreateEventFormProps> = ({
  placeholder = "What's happening?",
  onClose,
}) => {
  const { data: currentUser } = useCurrentUser();
  const { mutate: mutateEvents } = useEvents();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [eventDate, setEventDate] = useState<Dayjs | null>(
    dayjs().add(1, 'day')
  );
  const [location, setLocation] = useState<string>('');
  const [maxAttendees, setMaxAttendees] = useState<string>('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Event title is required');
      return;
    }

    if (!eventDate) {
      toast.error('Event date is required');
      return;
    }

    if (eventDate.isBefore(dayjs())) {
      toast.error('Event date must be in the future');
      return;
    }

    try {
      setLoading(true);

      await axios.post('/api/events', {
        title: title.trim(),
        description: description.trim() || null,
        eventDate: eventDate.toISOString(),
        location: location.trim() || null,
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
        visibility,
      });

      toast.success('Event created successfully!');

      // Reset form
      setTitle('');
      setDescription('');
      setEventDate(dayjs().add(1, 'day'));
      setLocation('');
      setMaxAttendees('');
      setVisibility('public');

      // Refresh events list
      mutateEvents();

      // Close modal if provided
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Create Event Error:', error);
      toast.error(error.response?.data?.error || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  }, [
    title,
    description,
    eventDate,
    location,
    maxAttendees,
    visibility,
    mutateEvents,
    onClose,
  ]);

  const isFormValid = title.trim() && eventDate && eventDate.isAfter(dayjs());

  return (
    <div className='flex items-center px-4 py-2 gap-4 border-b border-neutral-800'>
      <div className='self-start mt-2'>
        <Avatar username={currentUser?.username} size='medium' />
      </div>

      <div className='w-full space-y-4'>
        <div>
          <input
            type='text'
            className='w-full outline-none bg-black text-xl text-white placeholder-neutral-500'
            placeholder='Event title *'
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div>
          <textarea
            className='w-full resize-none outline-none bg-black text-lg text-white placeholder-neutral-500'
            placeholder='Event description (optional)'
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm text-neutral-400 mb-2'>
              Event Date & Time *
            </label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                value={eventDate}
                onChange={newValue => setEventDate(newValue)}
                minDateTime={dayjs()}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: '#374151',
                        },
                        '&:hover fieldset': {
                          borderColor: '#6B7280',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1D9BF0',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#9CA3AF',
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </div>

          <div>
            <label className='block text-sm text-neutral-400 mb-2'>
              Location (optional)
            </label>
            <input
              type='text'
              className='w-full outline-none bg-neutral-800 text-white placeholder-neutral-500 px-3 py-2 rounded-md border border-neutral-700'
              placeholder='Virtual or physical address'
              value={location}
              onChange={e => setLocation(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm text-neutral-400 mb-2'>
              Max Attendees (optional)
            </label>
            <input
              type='number'
              className='w-full outline-none bg-neutral-800 text-white placeholder-neutral-500 px-3 py-2 rounded-md border border-neutral-700'
              placeholder='Leave empty for unlimited'
              value={maxAttendees}
              onChange={e => setMaxAttendees(e.target.value)}
              min='1'
            />
          </div>

          <div>
            <label className='block text-sm text-neutral-400 mb-2'>
              Visibility
            </label>
            <select
              className='w-full outline-none bg-neutral-800 text-white px-3 py-2 rounded-md border border-neutral-700'
              value={visibility}
              onChange={e =>
                setVisibility(e.target.value as 'public' | 'private')
              }
            >
              <option value='public'>Public</option>
              <option value='private'>Private</option>
            </select>
          </div>
        </div>

        <div className='flex justify-end'>
          <Button
            disabled={loading || !isFormValid}
            label={loading ? 'Creating...' : 'Create Event'}
            onClick={handleSubmit}
            size='custom'
            labelSize='base'
            labelWeight='semibold'
          />
        </div>
      </div>
    </div>
  );
};

export default CreateEventForm;
