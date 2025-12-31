import { db } from './db';
import { Event, LocationHistory } from '../types';

// Events
export async function addEvent(event: Event): Promise<string> {
  return db.events.add(event);
}

export async function getEventsForDate(date: string): Promise<Event[]> {
  return db.events.where('date').equals(date).toArray();
}

export async function updateEvent(event: Event): Promise<string> {
  return db.events.put(event);
}

export async function deleteEvent(id: string): Promise<void> {
  return db.events.delete(id);
}

export async function getEventById(id: string): Promise<Event | undefined> {
  return db.events.get(id);
}

// Location History
export async function getLocationHistory(): Promise<LocationHistory[]> {
  const locations = await db.locations.toArray();
  // Sort by most recently used
  return locations.sort((a, b) => b.lastUsed - a.lastUsed);
}

export async function recordLocation(location: string): Promise<void> {
  if (!location.trim()) return;
  
  const existing = await db.locations.get(location);
  if (existing) {
    // Update last used timestamp
    await db.locations.put({
      location,
      lastUsed: Date.now(),
    });
  } else {
    // Add new location
    await db.locations.add({
      location,
      lastUsed: Date.now(),
    });
  }
}

export async function deleteLocation(location: string): Promise<void> {
  return db.locations.delete(location);
}
