import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import RequireAuth from "components/auth/RequireAuth";
import AppLayout from "components/ui/AppLayout";
import Header from "components/ui/Header";
import CandidateHeader from "components/ui/CandidateHeader";

// Landing / public
import LandingPage from './pages/landing/landing-page';
import LandingPageCandidates from './pages/landing/landing-page-candidates';
import Login from './pages/landing/login';
import AcceptInvite from './pages/landing/accept-invite';
import TermsOfService from './pages/landing/legal/TermsOfService';
import PrivacyPolicy from './pages/landing/legal/PrivacyPolicy';
import RefundPolicy from './pages/landing/legal/RefundPolicy';
import About from './pages/landing/about';

// Admin
import AdminPanel from './pages/admin';
import AdminSettings from './pages/admin/settings';
import AdminCompanies from './pages/admin/companies';
import AdminSuggestions from './pages/admin/suggestions';

// Company-facing
import BookmarkedCandidatesPage from './pages/company/bookmarked-candidates';
import CreditManagement from './pages/company/credit-management';
import CandidateSearchDashboard from './pages/company/candidate-search-dashboard';
import PurchasedProfiles from './pages/company/purchased-profiles';
import CompanyProfileSettings from './pages/company/company-profile-settings';
import CompanyHelp from './pages/company/help';
import Suggestions from './pages/company/suggestions';

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
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/about" element={<About />} />

        {/* Each signed-in section has one shell (AppLayout: its own bar + the scroll
            area under it) that stays mounted while you move between that section's
            pages; only the page inside changes. */}

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth roles={['ADMIN']}><AdminPanel /></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth roles={['ADMIN']}><AdminSettings /></RequireAuth>} />
        <Route path="/admin/companies" element={<RequireAuth roles={['ADMIN']}><AdminCompanies /></RequireAuth>} />
        <Route path="/admin/suggestions" element={<RequireAuth roles={['ADMIN']}><AdminSuggestions /></RequireAuth>} />

        {/* Company-facing */}
        <Route element={<RequireAuth roles={['COMPANY']}><AppLayout header={<Header />} /></RequireAuth>}>
          <Route path="/bookmarked-candidates" element={<RequireAuth roles={['COMPANY']} requireCompleteProfile><BookmarkedCandidatesPage /></RequireAuth>} />
          <Route path="/credit-management" element={<RequireAuth roles={['COMPANY']} requireCompleteProfile><CreditManagement /></RequireAuth>} />
          <Route path="/candidate-search-dashboard" element={<RequireAuth roles={['COMPANY']} requireCompleteProfile><CandidateSearchDashboard /></RequireAuth>} />
          <Route path="/purchased-profiles" element={<RequireAuth roles={['COMPANY']} requireCompleteProfile><PurchasedProfiles /></RequireAuth>} />
          <Route path="/company-profile-settings" element={<RequireAuth roles={['COMPANY']}><CompanyProfileSettings /></RequireAuth>} />
          {/* No requireCompleteProfile: the guide is most useful while the profile is still being filled in */}
          <Route path="/help" element={<RequireAuth roles={['COMPANY']}><CompanyHelp /></RequireAuth>} />
          <Route path="/suggestions" element={<RequireAuth roles={['COMPANY']} requireCompleteProfile><Suggestions /></RequireAuth>} />
        </Route>

        {/* Candidate-facing. The company pages here are public, so each page keeps its own guard. */}
        <Route element={<AppLayout header={<CandidateHeader />} />}>
          <Route path="/candidate-profile" element={<RequireAuth roles={['CANDIDATE']}><CandidateProfile /></RequireAuth>} />
          <Route path="/candidate-settings" element={<RequireAuth roles={['CANDIDATE']}><CandidateSettings /></RequireAuth>} />
          <Route path="/company-list" element={<CompanyList />} />
          <Route path="/company-details/:companyId" element={<CompanyDetails />} />
          <Route path="/company-details/:companyId/reviews" element={<CompanyDetailsReviews />} />
          <Route path="/my-ratings" element={<RequireAuth roles={['CANDIDATE']}><MyRatingsPage /></RequireAuth>} />
        </Route>
        {/* The CV editor has its own toolbar instead of the candidate bar, so it builds its shell itself. */}
        <Route path="/candidate-profile/edit" element={<RequireAuth roles={['CANDIDATE']}><CandidateProfileEdit /></RequireAuth>} />

        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
