import React, { createContext, useContext, useEffect, useState } from 'react';
import AppLayout from 'components/ui/AppLayout';
import AdminAppBar from './AdminAppBar';
import '../styles.scss'; // the --adp-* colours the bar uses
import './adminAppBar.scss';

const AdminBarContext = createContext(() => {});

/**
 * The admin bar stays mounted between admin pages and loads its own name and
 * counts. A page that knows them better hands them over: Settings the name
 * being typed, Companies and Suggestions their live counts. Leaving the page
 * gives the bar its own values back.
 */
export const useAdminBar = ({ name, pendingMatches, newSuggestions }) => {
  const setOverrides = useContext(AdminBarContext);
  useEffect(() => {
    setOverrides({ name, pendingMatches, newSuggestions });
  }, [setOverrides, name, pendingMatches, newSuggestions]);
  useEffect(() => () => setOverrides({}), [setOverrides]);
};

// Shell of every admin page: the admin bar on top, the page scrolling under it.
const AdminLayout = () => {
  const [overrides, setOverrides] = useState({});
  return (
    <AdminBarContext.Provider value={setOverrides}>
      <AppLayout header={<AdminAppBar {...overrides} />} />
    </AdminBarContext.Provider>
  );
};

export default AdminLayout;
