import { useEffect, useRef } from 'react';
import { useSettings } from '@/contexts/settings-context';
import { adhanService } from '@/services/adhan-service';
import { NotificationService } from '@/services/notification-service';
import type { PrayerTimeDetails, Settings } from '@/types/types';
import { convertTo24Hour } from '@/utils/time-format';

const DEFAULT_ADHAN_SETTINGS = {
  volume: 50,
  muezzin: 'default' as const,
  playAthan: false
};

export const usePrayerTimeMonitor = (prayerTimes: PrayerTimeDetails[]) => {
  const { settings } = useSettings();
  const checkInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initialize Adhan service with current settings or defaults
    adhanService.init({
      volume: settings?.adhanSettings?.volume ?? DEFAULT_ADHAN_SETTINGS.volume,
      muezzin: settings?.adhanSettings?.muezzin ?? DEFAULT_ADHAN_SETTINGS.muezzin
    });

    const checkPrayerTimes = () => {
      if (!prayerTimes.length) return;

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      prayerTimes.forEach(prayer => {
        // Convert prayer time to 24-hour format for comparison
        const time24h = settings?.timeFormat === '24h' 
          ? prayer.time 
          : convertTo24Hour(prayer.time);
        
        const [hours, minutes] = time24h.split(':').map(Number);
        const prayerTimeInMinutes = hours * 60 + minutes;

        // Check if it's prayer time
        if (currentTime === prayerTimeInMinutes) {
          handlePrayerTime(prayer.name, settings);
        }

        // Check for upcoming prayer notification
        if (settings?.notifications && 
            settings?.notificationTimes?.beforePrayer > 0 &&
            currentTime === prayerTimeInMinutes - settings.notificationTimes.beforePrayer) {
          sendPrayerNotification(prayer.name, settings.notificationTimes.beforePrayer);
        }
      });
    };

    // Start monitoring
    if (!checkInterval.current) {
      checkInterval.current = setInterval(checkPrayerTimes, 60000); // Check every minute
    }

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [prayerTimes, settings]);
};

const handlePrayerTime = async (prayerName: string, settings: Settings | undefined) => {
  // Play Adhan if enabled and settings exist
  if (settings?.adhan && settings?.adhanSettings?.playAthan) {
    try {
      await adhanService.play();
    } catch (error) {
      console.error('Failed to play Adhan:', error);
    }
  }

  // Show notification if enabled
  if (settings?.notifications) {
    NotificationService.scheduleNotification(
      'Prayer Time',
      {
        body: `It's time for ${prayerName} prayer`,
        icon: '/favicon.ico',
        silent: false
      },
      0
    );
  }
};

const sendPrayerNotification = (prayerName: string, minutesBefore: number) => {
  NotificationService.scheduleNotification(
    'Upcoming Prayer',
    {
      body: `${prayerName} prayer will be in ${minutesBefore} minutes`,
      icon: '/favicon.ico',
      silent: true
    },
    0
  );
}; 