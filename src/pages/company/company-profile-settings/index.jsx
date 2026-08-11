import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import Header from 'components/ui/Header';
import Icon from 'components/AppIcon';
import CompanyInformationTab from './components/CompanyInformationTab';
import TeamManagementTab from './components/TeamManagementTab';
import ReputationManagementTab from './components/ReputationManagementTab';
import AccountPreferencesTab from './components/AccountPreferencesTab';
import PublicProfilePreview from './components/PublicProfilePreview';
import DeleteAccountModal from './components/DeleteAccountModal';
import {
  getCompany,
  updateCompany,
  companyToFrontend,
  companyToPayload,
  getMyReviews,
  reviewsToReputationData,
  getCompanyPreferences,
  updateCompanyPreferences,
  companyPreferencesToFrontend,
  companyPreferencesToPayload,
  deleteCompanyAccount,
} from './companyApi';
import styles from './styles/company.module.scss';

const CompanyProfileSettings = () => {
  const navigate = useNavigate();
  const clerk = useClerk();
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const toastTimer = useRef(null);

  const [companyData, setCompanyData] = useState(null);
  const [reputationData, setReputationData] = useState(null);
  const [preferences, setPreferences] = useState(null);

  const fireToast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(''), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCompany(), getMyReviews(), getCompanyPreferences()])
      .then(([company, reviews, prefs]) => {
        if (cancelled) return;
        setCompanyData(companyToFrontend(company));
        setReputationData(reviewsToReputationData(reviews));
        setPreferences(companyPreferencesToFrontend(prefs));
      })
      .catch(() => {
        if (!cancelled) fireToast('Could not load your company profile — please refresh.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fireToast]);

  const tabs = [
    {
      id: 'company',
      name: 'Company information',
      icon: 'Building2',
      description: 'Basic details and contact information'
    },
    {
      id: 'team',
      name: 'Team',
      icon: 'Users',
      description: 'Members and invitations'
    },
    {
      id: 'reputation',
      name: 'Reputation management',
      icon: 'Star',
      description: 'Ratings, reviews, and statistics'
    },
    {
      id: 'preferences',
      name: 'Account settings',
      icon: 'Settings',
      description: 'Privacy, notifications, and security'
    }
  ];

  const handleSaveCompany = async () => {
    setIsSaving(true);
    try {
      const saved = await updateCompany(companyToPayload(companyData));
      setCompanyData((prev) => ({ ...prev, ...companyToFrontend(saved) }));
      fireToast('Company information saved');
    } catch (err) {
      fireToast(err?.response?.data?.message || 'Could not save — please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      const saved = await updateCompanyPreferences(companyPreferencesToPayload(preferences));
      setPreferences(companyPreferencesToFrontend(saved));
      fireToast('Account settings saved');
    } catch (err) {
      fireToast(err?.response?.data?.message || 'Could not save — please try again.');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleCompanyDataChange = (newData) => {
    setCompanyData(newData);
  };

  const handlePreferencesChange = (newPreferences) => {
    setPreferences(newPreferences);
  };

  const handleDeleteAccount = async () => {
    setDeleteBusy(true);
    try {
      await deleteCompanyAccount();
      await clerk.signOut();
      navigate('/');
    } catch {
      setDeleteBusy(false);
      fireToast('Could not delete account — please try again.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return (
          <CompanyInformationTab
            companyData={companyData}
            onDataChange={handleCompanyDataChange}
            onSave={handleSaveCompany}
            isSaving={isSaving}
            fireToast={fireToast}
          />
        );
      case 'team':
        return <TeamManagementTab companyData={companyData} fireToast={fireToast} />;
      case 'reputation':
        return <ReputationManagementTab reputationData={reputationData} />;
      case 'preferences':
        return (
          <AccountPreferencesTab
            preferences={preferences}
            onPreferencesChange={handlePreferencesChange}
            onSave={handleSavePreferences}
            isSaving={isSavingPrefs}
            onDeleteAccount={() => setShowDeleteModal(true)}
            fireToast={fireToast}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className="pt-16 max-w-[1180px] mx-auto px-[22px]" style={{ paddingBottom: '70px' }}>
          <p style={{ color: '#566776', padding: '40px 0' }}>Loading your company profile…</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className="pt-16 max-w-[1180px] mx-auto px-[22px]" style={{ paddingBottom: '70px' }}>
        {/* Page Header */}
        <div className={styles.head}>
          <div>
            <h1>Company profile settings</h1>
            <p>Manage your company information, reputation, and account settings</p>
          </div>

          <div className={styles.headR}>
            <button className={styles.btnGhost} onClick={() => setShowPreview(true)}>
              <Icon name="Eye" size={16} />Preview profile
            </button>
            <button
              className={styles.btnPrimary}
              onClick={activeTab === 'preferences' ? handleSavePreferences : handleSaveCompany}
              disabled={isSaving || isSavingPrefs}
            >
              <Icon name="Save" size={16} />{(isSaving || isSavingPrefs) ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Success/error message */}
        {toastMsg && (
          <div className={styles.successMsg}>
            <Icon name="CheckCircle" size={20} />
            <span>{toastMsg}</span>
          </div>
        )}

        <div className={styles.layout}>
          {/* Sidebar Navigation */}
          <nav className={styles.sidenav}>
            {tabs?.map((tab) => (
              <button
                key={tab?.id}
                onClick={() => setActiveTab(tab?.id)}
                className={`${styles.snav} ${activeTab === tab?.id ? styles.on : ''}`}
              >
                <span className={styles.navIcon}>
                  <Icon name={tab?.icon} size={17} />
                </span>
                <span className={styles.navText}>
                  <b>{tab?.name}</b>
                  <span>{tab?.description}</span>
                </span>
              </button>
            ))}
          </nav>

          {/* Main Content */}
          <div className={styles.panel}>
            {renderTabContent()}
          </div>
        </div>
      </main>
      {/* Public Profile Preview Modal */}
      <PublicProfilePreview
        companyData={companyData}
        reputationData={reputationData}
        isVisible={showPreview}
        onClose={() => setShowPreview(false)}
      />

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        isVisible={showDeleteModal}
        companyName={companyData?.name}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        busy={deleteBusy}
      />
    </div>
  );
};

export default CompanyProfileSettings;
