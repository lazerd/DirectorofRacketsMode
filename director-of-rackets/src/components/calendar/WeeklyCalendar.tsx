'use client';

import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  User,
  Clock,
} from 'lucide-react';
import { 
  getWeekDays, 
  getNextWeek, 
  getPreviousWeek,
  formatDayHeader,
  getCalendarHours,
  formatHour,
  isSameDayInTimezone,
  formatTimeSlot,
} from '@/lib/dates';
import { format, isToday } from 'date-fns';
import type { Slot } from '@/types/database';

interface WeeklyCalendarProps {
  timezone: string;
  slots: Slot[];
  onCreateSlot: (date: Date, hour: number) => void;
  onSlotClick: (slot: Slot) => void;
}

export default function WeeklyCalendar({
  timezone,
  slots,
  onCreateSlot,
  onSlotClick,
}: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekDays = useMemo(() => getWeekDays(currentDate, timezone), [currentDate, timezone]);
  const hours = useMemo(() => getCalendarHours(), []);

  const goToPreviousWeek = () => setCurrentDate(getPreviousWeek(currentDate));
  const goToNextWeek = () => setCurrentDate(getNextWeek(currentDate));
  const goToToday = () => setCurrentDate(new Date());

  // Get slots for a specific day and hour
  const getSlotsForDayAndHour = (day: Date, hour: number): Slot[] => {
    return slots.filter((slot) => {
      const slotDate = new Date(slot.start_time);
      const slotHour = slotDate.getUTCHours();
      return isSameDayInTimezone(slot.start_time, day, timezone) && 
             slotHour === hour;
    });
  };

  return (
    <div className="card overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <button 
            onClick={goToPreviousWeek}
            className="btn btn-ghost btn-icon"
            aria-label="Previous week"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={goToNextWeek}
            className="btn btn-ghost btn-icon"
            aria-label="Next week"
          >
            <ChevronRight size={20} />
          </button>
          <button 
            onClick={goToToday}
            className="btn btn-secondary btn-sm"
          >
            Today
          </button>
        </div>
        
        <h2 className="text-lg font-semibold">
          {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
        </h2>
        
        <div className="text-sm text-[var(--color-text-secondary)]">
          {timezone.replace('_', ' ')}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-[var(--color-border)]">
            <div className="p-3 text-sm text-[var(--color-text-muted)]">
              {/* Empty cell for time column */}
            </div>
            {weekDays.map((day, index) => {
              const { day: dayName, date } = formatDayHeader(day, timezone);
              const isTodayDate = isToday(day);
              return (
                <div 
                  key={index}
                  className={`p-3 text-center border-l border-[var(--color-border)] ${
                    isTodayDate ? 'bg-[var(--color-primary-light)]' : ''
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    isTodayDate ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
                  }`}>
                    {dayName}
                  </div>
                  <div className={`text-lg font-semibold ${
                    isTodayDate ? 'text-[var(--color-primary)]' : ''
                  }`}>
                    {date}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Rows */}
          <div className="max-h-[600px] overflow-y-auto">
            {hours.map((hour) => (
              <div 
                key={hour} 
                className="grid grid-cols-8 border-b border-[var(--color-border-light)] min-h-[60px]"
              >
                {/* Time Label */}
                <div className="p-2 text-xs text-[var(--color-text-muted)] text-right pr-3 pt-1">
                  {formatHour(hour)}
                </div>
                
                {/* Day Cells */}
                {weekDays.map((day, dayIndex) => {
                  const daySlots = getSlotsForDayAndHour(day, hour);
                  const isPast = day < new Date() && hour < new Date().getHours();
                  
                  return (
                    <div 
                      key={dayIndex}
                      className={`border-l border-[var(--color-border-light)] p-1 relative group ${
                        isPast ? 'bg-[var(--color-border-light)] opacity-50' : 'hover:bg-[var(--color-bg)]'
                      }`}
                    >
                      {daySlots.length > 0 ? (
                        daySlots.map((slot) => (
                          <SlotCard 
                            key={slot.id} 
                            slot={slot} 
                            timezone={timezone}
                            onClick={() => onSlotClick(slot)}
                          />
                        ))
                      ) : !isPast && (
                        <button
                          onClick={() => onCreateSlot(day, hour)}
                          className="absolute inset-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                        >
                          <Plus size={16} className="text-[var(--color-text-muted)]" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SlotCardProps {
  slot: Slot & { client?: { name: string; email: string } | null };
  timezone: string;
  onClick: () => void;
}

function SlotCard({ slot, timezone, onClick }: SlotCardProps) {
  const statusClasses = {
    open: 'slot-open',
    claimed: 'slot-claimed',
    cancelled: 'slot-cancelled',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-2 rounded-md text-left text-xs ${statusClasses[slot.status]} cursor-pointer hover:opacity-90 transition-opacity`}
    >
      <div className="flex items-center gap-1 font-medium">
        <Clock size={12} />
        {formatTimeSlot(slot.start_time, slot.end_time, timezone)}
      </div>
      {slot.status === 'claimed' && slot.client && (
        <div className="flex items-center gap-1 mt-1 opacity-80">
          <User size={10} />
          <span className="truncate">{slot.client.name}</span>
        </div>
      )}
      {slot.status === 'open' && (
        <div className="mt-1 text-[10px] uppercase tracking-wide opacity-80">
          Available
        </div>
      )}
      {slot.note && (
        <div className="mt-1 text-[10px] opacity-70 truncate">
          {slot.note}
        </div>
      )}
    </button>
  );
}
