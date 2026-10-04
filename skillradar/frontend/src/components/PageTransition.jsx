import React from "react";
import { useLocation } from "react-router-dom";

/** Keys its child by the current route so React remounts on navigation,
 * which restarts the CSS fade/slide-in animation — a cheap, dependency-free
 * page-transition effect without a routing-animation library. */
export default function PageTransition({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="sr-page-in">
      {children}
    </div>
  );
}
