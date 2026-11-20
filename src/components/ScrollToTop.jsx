import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getAppScroller } from "./ui/appScroll";

// A new page opens at its top. The signed-in pages scroll inside the area under
// their bar (AppLayout), which stays mounted between a section's pages; the public
// pages do that on a computer (PublicScroll); elsewhere the window scrolls.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    getAppScroller()?.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
