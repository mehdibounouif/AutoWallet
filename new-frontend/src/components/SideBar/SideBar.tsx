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
        // recall 
        <aside className="
            sticky top-0 flex h-screen w-16 shrink-0 flex-col
            border-r border-gray-200 bg-white
            lg:w-64
        ">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-5">
                <img
                    src={AutoWalletLogo}
                    alt="AutoWallet Logo"
                    className="h-7 w-auto shrink-0"
                />
                <span className="hidden text-lg font-bold text-gray-900 lg:inline">
                    AutoWallet
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-1 px-4 pt-2">
                {items.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            // {/* nav */}
                            className={({ isActive }) =>
                                `flex h-10 w-10 items-center justify-center rounded-lg transition-colors
                                lg:h-auto lg:w-full lg:justify-start lg:gap-3 lg:px-3 lg:py-2.5
                                ${isActive
                                    ? 'bg-green-900 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`
                            }
                        >
                            <Icon size={20} className="shrink-0" />
                            <span className="hidden lg:inline">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            {/* recall */}
            <div className="border border-gray-300 p-2 lg:p-4">

                <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between">

                    {/* Live indicator */}
                    <span className="flex items-center justify-center">
                        <span className="relative flex h-4 w-4 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-40" />
                            <Radio size={14} className="relative text-green-600" />
                        </span>
                        <span className="hidden lg:inline lg:ml-2 text-xs text-gray-600">
                            Live
                        </span>
                    </span>

                    {/* Language */}
                    <button className="hidden lg:flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700">
                        <Globe size={16} />
                        EN
                    </button>

                </div>

                {/* User information and logout */}
                <div className="mt-4 flex items-center justify-center lg:justify-between">

                    <div className="hidden lg:block">
                        <p className="truncate text-sm font-semibold text-gray-900">
                            {user.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                            {user.email}
                        </p>
                    </div>

                    <button
                        onClick={() => console.log("user logout")}
                        title="Log out"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    >
                        <LogOut size={18} />
                    </button>

                </div>
            </div>
        </aside>
    );
}