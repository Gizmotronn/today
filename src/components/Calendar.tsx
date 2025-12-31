import { useEffect, useState, useRef, useCallback } from 'react';
import { useKanban } from '../store/kanban';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/theme';
import { DayMood, Ticket, Event } from '../types';
import { EventModal } from './EventModal';

export default function Calendar() {
  const colorScheme = useColorScheme();
  const {
    dayEntries,
    loadDayEntriesForMonth,
    updateDayMood,
    projects,
    tickets,
    events,
    loadEvents,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useKanban();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    // Start from today
    return today;
  });

  const [showMoodPicker, setShowMoodPicker] = useState<string | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalDate, setEventModalDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Load data for a range of months
  const loadMonthsInRange = useCallback((date: Date) => {
    const months = new Set<string>();
    
    // Load current month and adjacent months
    for (let i = -1; i <= 2; i++) {
      const d = new Date(date);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.add(key);
    }

    months.forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      loadDayEntriesForMonth(parseInt(year), parseInt(month));
    });
  }, [loadDayEntriesForMonth]);

  // Load day entries when component mounts or date changes
  useEffect(() => {
    loadMonthsInRange(startDate);
  }, [startDate, loadMonthsInRange]);

  // Load events for visible dates
  const loadEventsForRange = useCallback((start: Date) => {
    const dates = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.add(formatDateStr(date));
    }
    dates.forEach(dateStr => loadEvents(dateStr));
  }, [loadEvents]);

  useEffect(() => {
    loadEventsForRange(startDate);
  }, [startDate, loadEventsForRange]);

  const formatDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleMoodClick = (dateStr: string, mood: DayMood) => {
    updateDayMood(dateStr, mood);
    setShowMoodPicker(null);
  };

  const getTicketsForDay = (dateStr: string): Ticket[] => {
    return tickets.filter(ticket => {
      // Only show deferred and priority tasks on the calendar
      return (ticket.deferred || ticket.priority) && ticket.date === dateStr;
    }).sort((a, b) => {
      // Prioritize priority tickets first
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return 0;
    });
  };

  const getEventsForDay = (dateStr: string): Event[] => {
    return events.filter(event => event.date === dateStr).sort((a, b) => {
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      return 0;
    });
  };

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

  const today = new Date();
  const todayStr = formatDateStr(today);

  // Generate days to display (100 days starting from startDate)
  const daysToDisplay: Date[] = [];
  for (let i = 0; i < 100; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    daysToDisplay.push(date);
  }

  return (
    <div style={{ 
      padding: '20px',
      color: Colors[colorScheme].text,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>
        {`
          .week-day-header {
            font-size: 11px;
            font-weight: 600;
            color: ${Colors[colorScheme].muted};
            letter-spacing: 0.5px;
          }

          .day-number {
            font-size: 24px;
            font-weight: 500;
            margin-top: 4px;
          }

          .mood-indicator {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: pointer;
            border: 2px solid ${Colors[colorScheme].border};
            background: ${Colors[colorScheme].card};
            transition: transform 0.2s;
          }

          .mood-indicator:hover {
            transform: scale(1.1);
          }

          .event-block {
            padding: 8px 10px;
            border-radius: 6px;
            margin-bottom: 6px;
            font-size: 13px;
            cursor: pointer;
            transition: transform 0.1s, box-shadow 0.1s;
            border: 1.5px solid;
            position: relative;
          }

          .event-block:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .event-time {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 2px;
            opacity: 0.9;
          }

          .event-title {
            font-weight: 500;
            line-height: 1.3;
          }

          .month-label {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 1px;
            color: ${Colors[colorScheme].muted};
            padding: 8px 4px;
          }

          .completed-event {
            text-decoration: line-through;
            opacity: 0.7;
          }

          .today-marker {
            background: #FF6B35;
            color: white;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: 600;
          }
        `}
      </style>

      {/* Header with navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => {
              const newStart = new Date(startDate);
              newStart.setDate(newStart.getDate() - 7);
              setStartDate(newStart);
            }}
            style={{
              padding: '6px 14px',
              backgroundColor: Colors[colorScheme].card,
              color: Colors[colorScheme].text,
              border: `1px solid ${Colors[colorScheme].border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ←
          </button>
          <button
            onClick={() => {
              const newStart = new Date(startDate);
              newStart.setDate(newStart.getDate() + 7);
              setStartDate(newStart);
            }}
            style={{
              padding: '6px 14px',
              backgroundColor: Colors[colorScheme].card,
              color: Colors[colorScheme].text,
              border: `1px solid ${Colors[colorScheme].border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            →
          </button>
          <button
            onClick={() => {
              const today = new Date();
              setStartDate(today);
              if (scrollContainerRef.current) {
                // Scroll to today's position
                const todayElement = scrollContainerRef.current.querySelector(`[data-date="${todayStr}"]`);
                if (todayElement) {
                  todayElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
              }
            }}
            style={{
              padding: '6px 16px',
              backgroundColor: Colors[colorScheme].tint,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Today
          </button>
        </div>

        <h2 style={{ 
          fontSize: '16px', 
          fontWeight: 600,
          margin: 0,
          minWidth: '180px',
          textAlign: 'center',
        }}>
          Scroll to explore
        </h2>
      </div>

      {/* Horizontally scrollable day grid */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          backgroundColor: Colors[colorScheme].border,
          border: `1px solid ${Colors[colorScheme].border}`,
          borderRadius: '8px',
          display: 'flex',
          gap: '1px',
          padding: '1px',
        }}
      >
        {daysToDisplay.map((date) => {
          const dateStr = formatDateStr(date);
          const dayEntry = dayEntries.get(dateStr);
          const mood = dayEntry?.mood;
          const completed = dayEntry?.completed || false;
          const dayTickets = getTicketsForDay(dateStr);
          const isToday = dateStr === todayStr;
          const currentMonth = date.getMonth();

          return (
            <div
              key={dateStr}
              data-date={dateStr}
              style={{
                minWidth: '280px',
                width: '280px',
                backgroundColor: completed ? (colorScheme === 'dark' ? '#1a2e1a' : '#f0fdf4') : Colors[colorScheme].background,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                opacity: completed ? 0.85 : 1,
              }}
            >
              {/* Day header */}
              <div style={{
                padding: '8px 8px 12px 8px',
                borderBottom: `2px solid ${Colors[colorScheme].border}`,
                textAlign: 'center',
                backgroundColor: Colors[colorScheme].card,
                position: 'relative',
              }}>
                <div style={{ color: Colors[colorScheme].muted, fontSize: '10px', fontWeight: '600', marginBottom: '4px' }}>
                  {monthNames[currentMonth].substring(0, 3)} {date.getDate()}
                </div>
                <div className="week-day-header">
                  {dayNames[date.getDay()]}
                </div>
                <div className="day-number" style={{ position: 'relative', fontSize: '20px', marginTop: '4px' }}>
                  {isToday ? (
                    <div className="today-marker">
                      {date.getDate()}
                    </div>
                  ) : (
                    date.getDate()
                  )}
                  {completed && !isToday && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: Colors[colorScheme].success,
                      color: 'white',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}>
                      ✓
                    </div>
                  )}
                </div>

                {/* Mood indicator circles */}
                <div style={{ 
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '4px',
                  position: 'relative',
                }}>
                  <div
                    className="mood-indicator"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoodPicker(showMoodPicker === dateStr ? null : dateStr);
                    }}
                  >
                    {mood || '+'}
                  </div>

                  {/* Mood picker dropdown */}
                  {showMoodPicker === dateStr && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: Colors[colorScheme].card,
                        border: `2px solid ${Colors[colorScheme].border}`,
                        borderRadius: '8px',
                        padding: '8px',
                        display: 'flex',
                        gap: '8px',
                        zIndex: 100,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(['🫤', '🙂', '🎈'] as DayMood[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => handleMoodClick(dateStr, m)}
                          style={{
                            fontSize: '24px',
                            background: mood === m ? Colors[colorScheme].tint : 'transparent',
                            border: `2px solid ${mood === m ? Colors[colorScheme].tint : Colors[colorScheme].border}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Events for the day */}
              <div style={{
                flex: 1,
                padding: '8px',
                overflowY: 'auto',
              }}>
                {/* Actual Events (from Event table) - shown first with special styling */}
                {getEventsForDay(dateStr).map((event) => {
                  const project = projects.find((p) => p.id === event.projectId);
                  const eventColor = project?.color || '#6366f1';
                  return (
                    <div
                      key={event.id}
                      className="event-block"
                      style={{
                        backgroundColor: eventColor,
                        borderColor: eventColor,
                        color: 'white',
                        border: `2px solid ${eventColor}`,
                        boxShadow: `0 0 8px ${eventColor}40`,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setEditingEvent(event);
                        setEventModalDate(event.date);
                        setEventModalOpen(true);
                      }}
                      title="Edit event"
                    >
                      {event.time && (
                        <div className="event-time">
                          {event.time}
                        </div>
                      )}
                      <div className="event-title" style={{ fontWeight: 'bold' }}>
                        📌 {event.title}
                      </div>
                      {event.location && (
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>
                          📍 {event.location}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Deferred and Priority Tasks */}
                {dayTickets.map((ticket) => {
                  const project = projects.find((p) => p.id === ticket.projectId);
                  const isPriority = ticket.priority;
                  const isDeferred = ticket.deferred;
                  
                  return (
                    <div
                      key={ticket.id}
                      className="event-block"
                      style={{
                        backgroundColor: isPriority 
                          ? '#DC2626' 
                          : isDeferred 
                          ? project?.color || Colors[colorScheme].tint
                          : Colors[colorScheme].card,
                        borderColor: isPriority
                          ? '#991B1B'
                          : isDeferred
                          ? project?.color || Colors[colorScheme].tint
                          : Colors[colorScheme].border,
                        color: isPriority || isDeferred ? 'white' : Colors[colorScheme].text,
                        opacity: isDeferred && !isPriority ? 0.85 : 1,
                        fontStyle: isDeferred && !isPriority ? 'italic' : 'normal',
                      }}
                    >
                      <div className="event-title">
                        {isPriority && '🔴 '}
                        {ticket.title}
                        {isDeferred && !isPriority && ' (deferred)'}
                      </div>
                    </div>
                  );
                })}

                {/* Button to add event for this day */}
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setEventModalDate(dateStr);
                    setEventModalOpen(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '8px',
                    backgroundColor: Colors[colorScheme].card,
                    color: Colors[colorScheme].muted,
                    border: `1px dashed ${Colors[colorScheme].border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  + Event
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Creation Modal */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSubmit={async (eventData) => {
          if (editingEvent && 'id' in eventData) {
            await updateEvent({ ...editingEvent, ...eventData });
          } else {
            await addEvent(eventData as any);
          }
        }}
        onDelete={async (id) => {
          await deleteEvent(id);
        }}
        defaultDate={eventModalDate}
        event={editingEvent}
      />
    </div>
  );
}
