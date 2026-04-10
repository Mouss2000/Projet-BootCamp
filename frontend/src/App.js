// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/layout/Layout';

// Import des composants
import Dashboard from './components/dashboard/Dashboard';
import StaffList from './components/StaffList';
import CertificationList from './components/CertificationList';
import ShiftList from './components/ShiftList';
import ShiftDetail from './components/ShiftDetail';
import AbsenceList from './components/AbsenceList';
import ServiceList from './components/ServiceList';
import SettingsPage from './components/SettingsPage';

// Page 404
const NotFound = () => (
  <div className="text-center py-12">
    <h1 className="text-6xl font-bold text-gray-600">404</h1>
    <p className="text-xl text-gray-400 mt-4">Page non trouvée</p>
    <a href="/" className="inline-block mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
      Retour à l'accueil
    </a>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/staff" element={<StaffList />} />
              <Route path="/certifications" element={<CertificationList />} />
              <Route path="/planning" element={<ShiftList />} />
              <Route path="/shifts" element={<ShiftList />} />
              <Route path="/shifts/:id" element={<ShiftDetail />} />
              <Route path="/absences" element={<AbsenceList />} />
              <Route path="/services" element={<ServiceList />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;