import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Radio,
  Layers,
  SlidersVertical,
  Activity,
  BarChart3,
  Bot,
  Settings,
  Globe,
  LogOut,
} from 'lucide-react';

import AutoWalletLogo from '../../assets/icons/AW.svg';


type NavItem = {
    label: string;
    path: string;
    icon: LucideIcon;
};

const items: NavItem[] = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Envelopes', path: '/envelopes', icon: Layers },
    { label: 'Rules', path: '/rules', icon: SlidersVertical },
    { label: 'Activity', path: '/activity', icon: Activity },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Assistant', path: '/assistant', icon: Bot },
    { label: 'Settings', path: '/settings', icon: Settings },
];

interface User {
  name: string;
  email: string;
}

// fetch data from the backend 
const user: User = {
  name: "Hicham El fatihi",
  email: "hicham@student.ma",
};

export default function Sidebar() {
    const [active, setActive] = useState<string>('Assistant');

    return (
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-5">
                <img
                    src={AutoWalletLogo}
                    alt="AutoWallet Logo"
                    className="h-7 w-auto shrink-0"
                />
                <span className="text-lg font-bold text-gray-900">AutoWallet</span>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-1 px-4 pt-2">
                {items.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive
                                    ? 'bg-green-900 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`
                            }
                        >
                            <Icon size={20} className="shrink-0" />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className='border border-gray-300 p-4'>
                <div className='flex items-center justify-between'>
                    <span className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="relative flex h-4 w-4 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-40" />
                            <Radio size={14} className="relative text-green-600" />
                        </span>
                        Live
                    </span>
                    <button className='flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-300 rounded-lg ring-2 ring-gray-300'>
                        <Globe size={16} />
                        EN
                    </button>
                </div>

                <div className='mt-4 flex items-center justify-between gap-2'>
                    <div>
                        <p className='truncate text-sm font-semibold text-gray-900'>
                            {user.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                            {user.email}
                        </p>
                    </div>
                    <button
                        onClick={() => console.log("user logout")}
                        title="Log out"
                        className="cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

            </div>
        </aside>
    );
}