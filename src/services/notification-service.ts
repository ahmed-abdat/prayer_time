export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  static async scheduleNotification(title: string, options: NotificationOptions, delay: number) {
    if (Notification.permission !== 'granted') {
      return;
    }

    setTimeout(() => {
      new Notification(title, options);
    }, delay);
  }
} 