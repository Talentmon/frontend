import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import Icon from '../AppIcon';
import { companyData } from '../../utils/companyData';

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useClerk();

  const menuItems = [
    {
      name: 'Company Profile',
      path: '/company-profile-settings',
      icon: 'Building2',
      description: 'Manage company settings'
    },
    {
      name: 'Help & Support',
      path: '/help',
      icon: 'HelpCircle',
      description: 'Get assistance'
    },
    {
      name: 'Documentation',
      path: '/docs',
      icon: 'FileText',
      description: 'API and guides'
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/login');
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={handleToggle}
        className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 hover:bg-white/10 ${
          isOpen ? 'bg-white/10' : ''
        }`}
        aria-label="User profile menu"
      >
        <div className="w-8 h-8 bg-[#E6A93C] rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-[#0B1A2C]">
            {companyData?.name?.charAt(0)}
          </span>
        </div>
        <div className="hidden lg:block text-left">
          <div className="text-sm font-medium text-white truncate max-w-32">
            {companyData?.name}
          </div>
          <div className="text-xs text-white/60">{companyData?.plan}</div>
        </div>
        <Icon
          name="ChevronDown"
          size={16}
          className={`text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-elevation-3 z-[1100] animate-slide-up">
          {/* Company Info Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#E6A93C] rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-[#0B1A2C]">
                  {companyData?.name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-popover-foreground truncate">
                  {companyData?.name}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {companyData?.email}
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-xs text-muted-foreground">{companyData?.plan} Plan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems?.map((item) => (
              <a
                key={item?.path}
                href={item?.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm transition-all duration-200 hover:bg-muted ${
                  isActivePath(item?.path) ? 'bg-muted' : ''
                }`}
              >
                <Icon name={item?.icon} size={18} color="var(--color-muted-foreground)" />
                <div className="flex-1">
                  <div className="font-medium text-popover-foreground">{item?.name}</div>
                  <div className="text-xs text-muted-foreground">{item?.description}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Logout Section */}
          <div className="p-2 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <Icon name="LogOut" size={18} color="var(--color-destructive)" />
              <div className="flex-1 text-left">
                <div className="font-medium">Sign Out</div>
                <div className="text-xs text-muted-foreground">End current session</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;