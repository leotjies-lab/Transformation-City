
import { NavItem, Ministry, WeeklyActivity } from './types';

export const NAV_ITEMS: NavItem[] = [
  { label: 'About Us', href: '/#about' },
  { label: 'Ministries', href: '/#ministries' },
  { label: 'Transformation Life', href: '/transformation-life' },
  { label: 'Sermons', href: '/sermons' },
  { label: 'Activities', href: '/activities' },
  { label: 'Join Us', href: '/#the-journey' },
];

export const MINISTRIES: Ministry[] = [
  {
    title: 'Prayer Warriors',
    description: 'Cultivating a culture of prayer.',
    icon: '🙏',
  },
  {
    title: 'Worship',
    description: 'Inspiring a culture of worship.',
    icon: '🎸',
  },
  {
    title: 'Identity - TCC Youth',
    description: 'Empowering the next generation to live extraordinary lives for Jesus.',
    icon: '🔥',
  },
  {
    title: 'Little Lights - TCC Kids',
    description: 'Growing little transformation agents.',
    icon: '✨',
  },
  {
    title: 'Connect Cafe',
    description: 'Motivating a culture of fellowship.',
    icon: '☕',
  },
  {
    title: 'Soup Kitchen',
    description: 'Serving our community through love, care, and practical outreach.',
    icon: '🍲',
  },
  {
    title: 'Mentors',
    description: 'Building a Godly men culture',
    icon: '🤝',
  },
  {
    title: 'Impact Life Journey',
    description: 'Developing a culture of growth',
    icon: '🌱',
  },
  {
    title: 'Connect Groups',
    description: 'Fostering deep relationships, and a culture of "stronger together"',
    icon: '👥',
  },
];

export const WEEKLY_ACTIVITIES: WeeklyActivity[] = [
  { day: 'Wednesday', time: 'Evening', title: 'Prayer Evening', description: 'Starts Next Week', color: 'bg-blue-500' },
  { day: 'Thursday', time: '19:00', title: 'Band Practice', color: 'bg-indigo-500' },
  { day: 'Friday', time: '18:30 - 21:00', title: 'Identity TCC Youth', color: 'bg-red-600' },
  { day: 'Saturday', time: '07:00 - 08:00', title: 'Prayer Meeting', color: 'bg-blue-600' },
  { day: 'Sunday', time: '09:00', title: 'Sunday Service', color: 'bg-yellow-500' },
  { day: 'Sunday', time: '09:00', title: 'Little Lights', color: 'bg-green-500' },
  { day: 'Sunday', time: '08:20 & 10:45', title: 'Connect Café', color: 'bg-amber-600' },
];
