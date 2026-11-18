import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getAppScroller } from "./ui/appScroll";

// A new page opens at its top. Company pages scroll inside the area under the
// header (CompanyLayout), which stays mounted between them; elsewhere the window scrolls.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    getAppScroller()?.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
