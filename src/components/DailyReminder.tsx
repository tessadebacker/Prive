import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { todayISO } from '../utils/date';
import { shouldShowReminder } from '../utils/reminder';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

function getPermission(): PermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function dismissKey(date: string) {
  return `aim-reminder-dismissed-${date}`;
}

function notifiedKey(date: string) {
  return `aim-reminder-notified-${date}`;
}

export function DailyReminder() {
  const { state } = useStore();
  const today = todayISO();
  const [now, setNow] = useState(() => new Date());
  const [permission, setPermission] = useState<PermissionState>(getPermission);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissKey(today)) === '1';
    } catch {
      return false;
    }
  });

  // Re-check periodically and whenever the app comes back to the foreground,
  // so the reminder can appear even if the app was opened earlier in the day.
  useEffect(() => {
    const tick = () => setNow(new Date());
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    const interval = setInterval(tick, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const active = shouldShowReminder(state, now) && !dismissed;

  useEffect(() => {
    if (!active || permission !== 'granted') return;
    try {
      if (localStorage.getItem(notifiedKey(today)) === '1') return;
      new Notification('Aim', {
        body: "You haven't checked in today yet — keep your streak going!",
        icon: 'icons/icon-192.png',
        tag: 'aim-daily-reminder',
      });
      localStorage.setItem(notifiedKey(today), '1');
    } catch {
      // Notification constructor can throw in some contexts (e.g. iOS); the in-app banner still shows.
    }
  }, [active, permission, today]);

  if (!active) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey(today), '1');
    } catch {
      // best-effort only
    }
  }

  async function enableNotifications() {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch {
      // ignore — user can still use the in-app reminder without OS notifications
    }
  }

  return (
    <div className="card reminder-banner">
      <div className="reminder-text">
        <span className="reminder-emoji">⏰</span>
        <div>
          <div className="reminder-title">Don't forget to check in today</div>
          <div className="reminder-sub">You haven't logged a habit or goal yet.</div>
        </div>
      </div>
      <div className="row-menu">
        {permission === 'default' && (
          <button className="btn btn-primary btn-sm" onClick={enableNotifications}>
            Turn on reminders
          </button>
        )}
        <button className="btn btn-secondary btn-sm" onClick={dismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
