import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Layers,
  SlidersVertical,
  Activity,
  BarChart3,
  Bot,
  Settings,
  Globe,
  LogOut,
} from 'lucide-react';

import AutoWalletLogo from '../assets/icons/AW.svg';


type NavItem = {
    label: string
    icon: LucideIcon
}

const items: NavItem[] = [
    { label: 'Home', icon: Home },
    { label: 'Envelopes', icon: Layers },
    { label: 'Rules', icon: SlidersVertical },
    { label: 'Activity', icon: Activity },
    { label: 'Analytics', icon: BarChart3 },
    { label: 'Assistant', icon: Bot },
    { label: 'Settings', icon: Settings },
]

interface User {
  name: string;
  email: string;
}

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
            <nav className='flex flex-1 flex-col gap-1 px-4 pt-2'>
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.label;

                    return (
                        <button
                            key={item.label}
                            onClick={() => setActive(item.label)}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-green-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                            <Icon size={20} className='shrink-0' />
                            <span>{item.label}</span>
                        </button>
                    )
                }
                )}
            </nav>

            {/* Footer */}
            <div className='border-t border-gray-400 p-4'>
                <div className='flex items-center justify-between'>
                    <span className='flex items-center text-xs text-gray-600'>
                        <span className='h-2 w-2 rounded-full bg-brand'>
                            Live
                        </span>
                    </span>
                    <button className='flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50'>
                        <Globe size={16} />
                        EN
                    </button>
                </div>

                <div className='mt-4 flex items-center justify-between gap-2'>
                    <div className='min-w-0'>
                        <p className='truncate text-sm font-semibold text-gray-900'>
                            {user.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => console.log("user logout")}
                    title="Log out"
                    className="cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                >
                    <LogOut size={18} />
                </button>

            </div>
        </aside>
    );
}