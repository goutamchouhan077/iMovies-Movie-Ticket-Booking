import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { Notifications } from '../models/index.ts';

export async function getUserNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const list = await Notifications.find({ userId });
    list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

    return res.json({ success: true, count: list.length, notifications: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const notif = await Notifications.findById(id);
    if (!notif || notif.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const updated = await Notifications.findByIdAndUpdate(id, { read: true });
    return res.json({ success: true, notification: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const list = await Notifications.find({ userId });
    for (const n of list) {
      if (!n.read) {
        await Notifications.findByIdAndUpdate(n._id, { read: true });
      }
    }

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
