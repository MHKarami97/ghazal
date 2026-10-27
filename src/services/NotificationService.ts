import { toPersianDigits } from '../utils/persianNormalizer';

export class NotificationService {
  /**
   * درخواست مجوز اعلان مرور از کاربر
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    var permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  hasPermission(): boolean {
    if (!('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }

  /**
   * ارسال اعلان یادآوری مرور کارت‌ها
   */
  sendReviewReminder(dueCount: number): void {
    if (!this.hasPermission() || dueCount <= 0) return;

    var title = 'یادآور مرور شعر | غزل';
    var options: NotificationOptions = {
      body: `امروز ${toPersianDigits(dueCount)} بیت برای مرور و تثبیت در انتظار شماست.`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-48.png',
      dir: 'rtl',
      lang: 'fa'
    };

    try {
      new Notification(title, options);
    } catch (e) {
      // Fallback for Service Worker notification if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(function (reg) {
          reg.showNotification(title, options);
        });
      }
    }
  }
}

export const notificationService = new NotificationService();
