import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { staffAPI, shiftAPI, absenceAPI } from '../services/api';

function Home() {
  const [stats, setStats] = useState({
    totalStaff: 0,
    todayShifts: 0,
    currentAbsences: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const [staffRes, shiftsRes, absencesRes] = await Promise.all([
          staffAPI.getAll({ is_active: true }),
          shiftAPI.getAll({ date: today }),
          absenceAPI.getAll({ current: true }),
        ]);

        setStats({
          totalStaff: staffRes.data.length,
          todayShifts: shiftsRes.data.length,
          currentAbsences: absencesRes.data.length,
        });
      } catch (err) {
        setError('Erreur de connexion au serveur');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="home">
      <h1>🏥 Healthcare Planning</h1>
      <p className="subtitle">Système de gestion des plannings hospitaliers</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👨‍⚕️</div>
          <div className="stat-value">{stats.totalStaff}</div>
          <div className="stat-label">Soignants actifs</div>
          <Link to="/staff" className="stat-link">Voir tous →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.todayShifts}</div>
          <div className="stat-label">Postes aujourd'hui</div>
          <Link to="/shifts" className="stat-link">Gérer →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏖️</div>
          <div className="stat-value">{stats.currentAbsences}</div>
          <div className="stat-label">Absences en cours</div>
          <Link to="/absences" className="stat-link">Voir →</Link>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Actions rapides</h2>
        <div className="action-buttons">
          <Link to="/shifts" className="btn btn-primary btn-large">
            📅 Gérer les postes
          </Link>
          <Link to="/staff" className="btn btn-secondary btn-large">
            👨‍⚕️ Gérer les soignants
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;