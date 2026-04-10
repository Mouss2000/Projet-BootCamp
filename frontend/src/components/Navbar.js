import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🏥 Healthcare Planning</Link>
      </div>
      <ul className="navbar-menu">
        <li className={isActive('/')}>
          <Link to="/">Accueil</Link>
        </li>
        <li className={isActive('/staff')}>
          <Link to="/staff">👨‍⚕️ Soignants</Link>
        </li>
        <li className={isActive('/certifications')}>
          <Link to="/certifications">🎓 Certifications</Link>
        </li>
        <li className={isActive('/shifts')}>
          <Link to="/shifts">📅 Postes</Link>
        </li>
        <li className={isActive('/absences')}>
          <Link to="/absences">🏖️ Absences</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;