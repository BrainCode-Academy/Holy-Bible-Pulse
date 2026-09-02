import { useState, useEffect } from 'react';
import { User } from '../types';

export type TimePeriod = 'morning' | 'afternoon' | 'evening';

export interface DynamicGreetingInfo {
  period: TimePeriod;
  greetingTitle: string;       // e.g. "Good Morning"
  formattedGreeting: string;   // e.g. "Good Morning, Winner 👋" or "Good Morning 👋"
  subMessage: string;          // e.g. "Ready to spend time in God's Word today?"
  currentHour: number;
  currentMinute: number;
  timeString: string;          // e.g. "07:30 AM"
}

/**
 * Calculates the greeting period based on device/browser local time:
 * 12:00 AM – 11:59 AM (0..11)  -> "Good Morning"
 * 12:00 PM – 5:59 PM  (12..17) -> "Good Afternoon"
 * 6:00 PM  – 11:59 PM (18..23) -> "Good Evening"
 */
export function calculateGreetingPeriod(date: Date = new Date()): {
  period: TimePeriod;
  title: string;
  subMessage: string;
} {
  const hour = date.getHours();

  if (hour >= 0 && hour < 12) {
    return {
      period: 'morning',
      title: 'Good Morning',
      subMessage: 'Start your morning in the stillness of God\'s presence.',
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      period: 'afternoon',
      title: 'Good Afternoon',
      subMessage: 'Take a moment to pause, reflect, and recharge in Scripture.',
    };
  } else {
    return {
      period: 'evening',
      title: 'Good Evening',
      subMessage: 'End your day resting in God\'s promises and everlasting peace.',
    };
  }
}

/**
 * Cleanly extracts display first name from user profile
 */
export function extractFirstName(user?: User | null): string {
  if (!user) return '';
  if (user.fullName && user.fullName.trim()) {
    return user.fullName.trim().split(' ')[0];
  }
  if (user.email) {
    const localPart = user.email.split('@')[0];
    // Capitalize first letter of local part if it's a name
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  }
  return '';
}

/**
 * Formats complete greeting with optional user name
 */
export function getDynamicGreeting(user?: User | null, date: Date = new Date()): DynamicGreetingInfo {
  const { period, title, subMessage } = calculateGreetingPeriod(date);
  const firstName = extractFirstName(user);

  const formattedGreeting = firstName
    ? `${title}, ${firstName} 👋`
    : `${title} 👋`;

  const hour = date.getHours();
  const minute = date.getMinutes();
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const timeString = `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;

  return {
    period,
    greetingTitle: title,
    formattedGreeting,
    subMessage,
    currentHour: hour,
    currentMinute: minute,
    timeString,
  };
}

/**
 * React hook that dynamically calculates and re-renders when time changes,
 * interval ticks (every 30 seconds), or window gains focus.
 */
export function useDynamicGreeting(user?: User | null, simulatedHour?: number | null): DynamicGreetingInfo {
  const [now, setNow] = useState<Date>(() => {
    if (simulatedHour !== null && simulatedHour !== undefined) {
      const d = new Date();
      d.setHours(simulatedHour, 0, 0, 0);
      return d;
    }
    return new Date();
  });

  useEffect(() => {
    if (simulatedHour !== null && simulatedHour !== undefined) {
      const d = new Date();
      d.setHours(simulatedHour, 0, 0, 0);
      setNow(d);
      return;
    }

    const updateTime = () => setNow(new Date());

    // Update every 30 seconds to catch minute & period transitions smoothly
    const interval = setInterval(updateTime, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTime();
      }
    };

    const handleFocus = () => updateTime();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [simulatedHour]);

  return getDynamicGreeting(user, now);
}
