import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import CreditCounter from './CreditCounter';
import CompanyNotifications from './CompanyNotifications';
import UserProfileDropdown from './UserProfileDropdown';

const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Search',
      path: '/candidate-search-dashboard',
      icon: 'Search'
    },
    {
      name: 'Bookmarked',
      path: '/bookmarked-candidates',
      icon: 'Bookmark'
    },
    {
      name: 'Purchased',
      path: '/purchased-profiles',
      icon: 'ShoppingBag'
    },
    {
      name: 'Credits',
      path: '/credit-management',
      icon: 'Coins'
    }
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-[#0B1A2C] border-b border-[#10243A]">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo Section */}
        <div className="flex items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/assets/images/talentmon.png" alt="Talentmon" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-brand font-extrabold uppercase tracking-tight text-white">
                Talent<span className="text-[#E6A93C]">mon</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigationItems?.map((item) => (
            <a
              key={item?.path}
              href={item?.path}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 micro-hover ${
                isActivePath(item?.path)
                  ? 'bg-[#E6A93C] text-[#0B1A2C]'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon name={item?.icon} size={18} />
              <span>{item?.name}</span>
            </a>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          <CreditCounter />
          <CompanyNotifications />
          <UserProfileDropdown />

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={20} />
          </button>
        </div>
      </div>
      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0B1A2C] border-t border-[#10243A] animate-slide-up">
          <nav className="px-6 py-4 space-y-2">
            {navigationItems?.map((item) => (
              <a
                key={item?.path}
                href={item?.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePath(item?.path)
                    ? 'bg-[#E6A93C] text-[#0B1A2C]'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon name={item?.icon} size={18} />
                <span>{item?.name}</span>
              </a>
            ))}

            {/* Mobile Company Profile Link */}
            <a
              href="/company-profile-settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActivePath('/company-profile-settings')
                  ? 'bg-[#E6A93C] text-[#0B1A2C]' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon name="Building2" size={18} />
              <span>Company Profile</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;