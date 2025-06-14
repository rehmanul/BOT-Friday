import type { NextApiRequest, NextApiResponse } from 'next';
import { Notification } from '@/types';

// Dummy notifications for now; replace with real DB fetch in production
const notifications: Notification[] = [
  {
    id: '1',
    title: 'Welcome!',
    message: 'Thanks for joining the dashboard.',
    read: false,
    createdAt: new Date().toISOString(),
    type: 'info',
  },
  {
    id: '2',
    title: 'Campaign Update',
    message: 'Your campaign "Spring Launch" has started.',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    type: 'campaign',
  },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ notifications });
}
