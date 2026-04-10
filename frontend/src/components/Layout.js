import React from 'react';
import Navbar from './Navbar';

function Layout({ children }) {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <p>Healthcare Planning System © 2025</p>
      </footer>
    </div>
  );
}

export default Layout;