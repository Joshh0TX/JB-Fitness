import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./NavBar.css";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: "Home",
      path: "/dashboard",
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: "Nutrition",
      path: "/nutrition",
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: "Workout",
      path: "/workouts",
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
          <path d="M14.4 14.4 9.6 9.6M18.657 21.485l-5.657-5.657M3.1 5.928l5.657 5.657M22.899 18.657l-2.828 2.828M4.228 1.4l2.828 2.828M15.828 4.228l5.657 5.657M1.4 15.828l5.657 5.657" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: "Badges",
      path: "/badges",
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
          <circle cx="12" cy="8" r="7" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: "Profile",
      path: "/settings",
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <nav className="matured-bottom-nav">
      <div className="nav-container">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              type="button"
              key={item.label}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <div className="nav-icon-box">{item.icon(isActive)}</div>
              <span className="nav-label">{item.label}</span>
              {isActive && <div className="active-indicator"></div>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavBar;