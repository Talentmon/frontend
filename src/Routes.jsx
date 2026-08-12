import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import RequireAuth from "components/auth/RequireAuth";

// Landing / public
import LandingPage from './pages/landing/landing-page';
import LandingPageCandidates from './pages/landing/landing-page-candidates';
import Login from './pages/landing/login';
import TermsOfService from './pages/landing/legal/TermsOfService';
import PrivacyPolicy from './pages/landing/legal/PrivacyPolicy';
import RefundPolicy from './pages/landing/legal/RefundPolicy';

// Admin
import AdminPanel from './pages/admin';
import AdminSettings from './pages/admin/settings';

// Company-facing
import BookmarkedCandidatesPage from './pages/company/bookmarked-candidates';
import CreditManagement from './pages/company/credit-management';
import CandidateSearchDashboard from './pages/company/candidate-search-dashboard';
import PurchasedProfiles from './pages/company/purchased-profiles';
import CompanyProfileSettings from './pages/company/company-profile-settings';

// Candidate-facing
import CandidateProfile from './pages/candidate/candidate-profile';
import CandidateProfileEdit from './pages/candidate/candidate-profile/edit';
import CandidateSettings from './pages/candidate/candidate-settings';
import CompanyList from './pages/candidate/company-list';
import CompanyDetails from './pages/candidate/company-details';
import CompanyDetailsReviews from './pages/candidate/company-details/reviews';
import MyRatingsPage from './pages/candidate/my-ratings';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Landing / public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing-page" element={<LandingPage />} />
        <Route path="/landing-page-candidates" element={<LandingPageCandidates />} />
        <Route path="/login" element={<Login />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth roles={['ADMIN']}><AdminPanel /></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth roles={['ADMIN']}><AdminSettings /></RequireAuth>} />

        {/* Company-facing */}
        <Route path="/bookmarked-candidates" element={<RequireAuth roles={['COMPANY']}><BookmarkedCandidatesPage /></RequireAuth>} />
        <Route path="/credit-management" element={<RequireAuth roles={['COMPANY']}><CreditManagement /></RequireAuth>} />
        <Route path="/candidate-search-dashboard" element={<RequireAuth roles={['COMPANY']}><CandidateSearchDashboard /></RequireAuth>} />
        <Route path="/purchased-profiles" element={<RequireAuth roles={['COMPANY']}><PurchasedProfiles /></RequireAuth>} />
        <Route path="/company-profile-settings" element={<RequireAuth roles={['COMPANY']}><CompanyProfileSettings /></RequireAuth>} />

        {/* Candidate-facing */}
        <Route path="/candidate-profile" element={<RequireAuth roles={['CANDIDATE']}><CandidateProfile /></RequireAuth>} />
        <Route path="/candidate-profile/edit" element={<RequireAuth roles={['CANDIDATE']}><CandidateProfileEdit /></RequireAuth>} />
        <Route path="/candidate-settings" element={<RequireAuth roles={['CANDIDATE']}><CandidateSettings /></RequireAuth>} />
        <Route path="/company-list" element={<CompanyList />} />
        <Route path="/company-details/:companyId" element={<CompanyDetails />} />
        <Route path="/company-details/:companyId/reviews" element={<CompanyDetailsReviews />} />
        <Route path="/my-ratings" element={<RequireAuth roles={['CANDIDATE']}><MyRatingsPage /></RequireAuth>} />

        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
