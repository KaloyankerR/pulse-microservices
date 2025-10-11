import {
  RiHome7Fill,
  RiMailLine,
  RiUserLine,
  RiLogoutBoxLine,
  RiCalendarLine,
} from 'react-icons/ri';
import { ISidebarType } from '@/types/sidebar.type';

export const SidebarItems: ISidebarType[] = [
  {
    label: 'Home',
    href: '/',
    icon: RiHome7Fill,
    active: true,
    public: true,
  },
  {
    label: 'Messages',
    href: '/chat',
    icon: RiMailLine,
    active: true,
    public: false,
  },
  {
    label: 'Profile',
    href: '/users/',
    icon: RiUserLine,
    active: true,
    public: false,
  },
  {
    label: 'Events',
    href: '/events',
    icon: RiCalendarLine,
    active: true,
    public: true,
  },
];
