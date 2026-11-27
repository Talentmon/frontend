import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import Icon from '../AppIcon';
import { useCurrentUser } from '../../lib/CurrentUserContext';
import { HEADER_FOCUS, headerTray } from './headerStyles';

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { company } = useCurrentUser();
  const companyName = company?.name || '';

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
      name: 'Your suggestions',
      path: '/suggestions',
      icon: 'Lightbulb',
      description: 'Bring Talentmon closer to your needs'
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

  // The header stays mounted between company pages, so a page change closes the menu.
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`flex-none inline-flex items-center gap-2.5 h-[46px] pl-1.5 pr-2.5 rounded-xl transition-colors ${headerTray(isOpen)} ${HEADER_FOCUS}`}
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <span aria-hidden="true" className="flex-none w-[34px] h-[34px] rounded-[9px] bg-[#E6A93C] text-[#1B2330] inline-flex items-center justify-center text-[15px] font-extrabold">
          {companyName.charAt(0).toUpperCase()}
        </span>
        {/* From 1280px (below that the nav needs the room); a long name is cut at 200px and shown in full on hover. */}
        <span
          title={companyName}
          className="hidden xl:block text-left text-sm leading-[18px] font-medium text-white truncate max-w-[200px]"
        >
          {companyName}
        </span>
        <Icon
          name="ChevronDown"
          size={16}
          strokeWidth={2.2}
          className={`flex-none transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {/* Dropdown Menu: under the button; on phones it spans the screen less a 16px gutter,
          since the menu button to the right leaves too little room for 320px. */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-sm:fixed max-sm:top-[72px] max-sm:left-3 max-sm:right-3 max-sm:w-auto max-sm:mt-0 bg-popover border border-border rounded-xl shadow-elevation-3 z-[1100] animate-slide-up">
          {/* Company Info Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#E6A93C] rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-[#1B2330]">
                  {companyName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-popover-foreground truncate">
                  {companyName}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {company?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems?.map((item) => (
              <button
                key={item?.path}
                onClick={() => handleNavigate(item?.path)}
                className={`flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-sm transition-all duration-200 hover:bg-muted ${
                  isActivePath(item?.path) ? 'bg-muted' : ''
                }`}
              >
                <Icon name={item?.icon} size={18} color="var(--color-muted-foreground)" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-popover-foreground">{item?.name}</div>
                  <div className="text-xs text-muted-foreground">{item?.description}</div>
                </div>
              </button>
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