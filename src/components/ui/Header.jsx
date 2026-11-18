import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import { useCurrentUser } from '../../lib/CurrentUserContext';
import CreditCounter from './CreditCounter';
import CompanyNotifications from './CompanyNotifications';
import UserProfileDropdown from './UserProfileDropdown';
import { HEADER_FOCUS, headerTray } from './headerStyles';

// Two stacked coin piles (the Talentmon navbar design), drawn like a lucide icon.
const CreditsIcon = ({ size = 16, strokeWidth = 2, className = '' }) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`flex-none ${className}`}
  >
    <ellipse cx="9" cy="8" rx="5.5" ry="3" />
    <path d="M3.5 8v4c0 1.7 2.5 3 5.5 3" />
    <ellipse cx="15" cy="14" rx="5.5" ry="3" />
    <path d="M9.5 14v3c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3v-3" />
  </svg>
);

const NavIcon = ({ icon }) => (typeof icon === 'string'
  ? <Icon name={icon} size={16} strokeWidth={2.1} />
  : React.createElement(icon, { size: 16, strokeWidth: 2.1 }));

const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);

  // Like the bell and profile dropdowns: a click anywhere else closes the menu.
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const onOutside = (e) => {
      if (!menuButtonRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isMobileMenuOpen]);

  // The header stays mounted between company pages (CompanyLayout), so a page
  // change, from anywhere, closes the menu.
  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  // Until the company profile is complete, every page except profile
  // settings is locked (RequireAuth + backend gate) — the nav shows that
  // instead of linking somewhere that would just bounce back.
  const { companyProfileComplete } = useCurrentUser();
  const navLocked = !companyProfileComplete;
  const lockedTitle = 'Complete your company profile to unlock';
  const homePath = navLocked ? '/company-profile-settings' : '/candidate-search-dashboard';

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
      icon: CreditsIcon
    }
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItemBase = 'h-[38px] inline-flex items-center gap-2 pl-3 pr-3.5 rounded-[9px] text-sm leading-[18px] font-semibold whitespace-nowrap';
  const mobileItemBase = 'flex items-center gap-3 px-3 py-3 rounded-[9px] text-sm font-semibold';
  const itemState = (active) => (active
    ? 'bg-[#E6A93C] text-[#1B2330]'
    : 'text-[#B9C3D1] hover:text-white hover:bg-white/[0.07]');

  return (
    <header className="relative flex-none z-[1000] bg-[#0B1A2C] border-b border-[#10243A]">
      {/* Three columns from 1280px, so the nav sits in the middle of the page, not between the sides.
          Narrower, the bar doesn't fit everything and the nav moves into the menu button. */}
      <div className="flex items-center justify-between xl:grid xl:grid-cols-[1fr_auto_1fr] xl:gap-6 h-16 pl-7 pr-6">
        {/* Logo Section */}
        <div className="xl:justify-self-start flex items-center">
          <Link
            to={homePath}
            aria-label="Talentmon home"
            className={`flex items-center space-x-3 rounded-lg ${HEADER_FOCUS}`}
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/assets/images/talentmon.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-brand font-extrabold uppercase tracking-tight text-white">
                Talent<span className="text-[#E6A93C]">mon</span>
              </h1>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main"
          className="hidden xl:flex xl:justify-self-center items-center gap-1.5 p-1 rounded-xl bg-[#2B3646] border border-white/[0.06]"
        >
          {navigationItems?.map((item) => navLocked ? (
            <span
              key={item?.path}
              title={lockedTitle}
              aria-disabled="true"
              className={`${navItemBase} text-white/35 cursor-not-allowed select-none`}
            >
              <Icon name="Lock" size={16} strokeWidth={2.1} />
              <span>{item?.name}</span>
            </span>
          ) : (
            <Link
              key={item?.path}
              to={item?.path}
              aria-current={isActivePath(item?.path) ? 'page' : undefined}
              className={`${navItemBase} transition-colors duration-150 ${itemState(isActivePath(item?.path))} ${HEADER_FOCUS}`}
            >
              <NavIcon icon={item?.icon} />
              <span>{item?.name}</span>
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="xl:justify-self-end flex items-center gap-2 sm:gap-4">
          {!navLocked && <CreditCounter />}
          <CompanyNotifications />
          <UserProfileDropdown />

          {/* Mobile Menu Button */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={toggleMobileMenu}
            className={`xl:hidden flex-none inline-flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${headerTray(isMobileMenuOpen)} ${HEADER_FOCUS}`}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={20} strokeWidth={1.9} />
          </button>
        </div>
      </div>
      {/* Mobile Navigation Menu: a full-width strip on phones, a panel under the menu button on wider screens */}
      {isMobileMenuOpen && (
        <div ref={menuRef} className="xl:hidden bg-[#0B1A2C] border-t border-[#10243A] animate-slide-up md:absolute md:right-6 md:top-full md:mt-2 md:w-72 md:rounded-xl md:border md:border-white/10 md:shadow-elevation-3">
          <nav aria-label="Main" className="px-6 py-4 space-y-2 md:p-2 md:space-y-1">
            {navigationItems?.map((item) => navLocked ? (
              <span
                key={item?.path}
                title={lockedTitle}
                aria-disabled="true"
                className={`${mobileItemBase} text-white/35 cursor-not-allowed select-none`}
              >
                <Icon name="Lock" size={16} strokeWidth={2.1} />
                <span>{item?.name}</span>
              </span>
            ) : (
              <Link
                key={item?.path}
                to={item?.path}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={isActivePath(item?.path) ? 'page' : undefined}
                className={`${mobileItemBase} transition-colors duration-150 ${itemState(isActivePath(item?.path))} ${HEADER_FOCUS}`}
              >
                <NavIcon icon={item?.icon} />
                <span>{item?.name}</span>
              </Link>
            ))}

            {/* Mobile Company Profile Link */}
            <Link
              to="/company-profile-settings"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-current={isActivePath('/company-profile-settings') ? 'page' : undefined}
              className={`${mobileItemBase} transition-colors duration-150 ${itemState(isActivePath('/company-profile-settings'))} ${HEADER_FOCUS}`}
            >
              <Icon name="Building2" size={16} strokeWidth={2.1} />
              <span>Company Profile</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
