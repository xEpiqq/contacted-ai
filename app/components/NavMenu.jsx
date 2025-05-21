'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavMenu() {
  const pathname = usePathname();
  
  const isActive = (path) => {
    return pathname === path;
  };
  
  const navItems = [
    { name: 'Regular', href: '/test' },
    { name: 'Test Clone', href: '/test-clone' },
    { name: 'Basic Selector', href: '/database-selector-basic' }
  ];
  
  return (
    <div className="flex justify-center mb-6">
      <div className="bg-[#202020] rounded-full p-1 flex gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-1.5 rounded-full text-sm ${
              isActive(item.href)
                ? 'bg-white text-black font-medium'
                : 'text-neutral-300 hover:text-white hover:bg-[#303030]/50'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
} 