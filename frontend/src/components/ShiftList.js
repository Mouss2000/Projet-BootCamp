// src/components/ShiftList.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { shiftAPI, referenceAPI } from '../services/api';
import { Calendar, Filter, Clock, Users, CheckCircle, AlertTriangle, Play, Check, X } from 'lucide-react';

function ShiftList() {
  const [shifts, setShifts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    service: '',
    date_from: new Date().toISOString().split('T')[0],
    date_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 days
  });

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const res = await referenceAPI.getServices();
        setServices(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadRefs();
  }, []);

  const loadShifts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.service) params.service = filters.service;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const response = await shiftAPI.getAll(params);
      setShifts(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des postes');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const handleGenerate = async () => {
    if (!filters.date_from || !filters.date_to) {
      alert('Veuillez sélectionner une période (du/au)');
      return;
    }

    try {
      setGenerating(true);
      setGenResult(null);
      const res = await shiftAPI.generate({
        start_date: filters.date_from,
        end_date: filters.date_to,
        service: filters.service || null
      });
      setGenResult(res.data);
      loadShifts(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const formatDateTime = (datetime) => {
    return new Date(datetime).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getShiftTypeColor = (typeName) => {
    switch (typeName?.toLowerCase()) {
      case 'nuit':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'matin':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'après-midi':
      case 'apres-midi':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-muted border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-main flex items-center gap-3">
            <Calendar className="w-8 h-8 text-cyan-400" />
            Postes de Garde
          </h1>
          <p className="text-muted mt-1">{shifts.length} postes trouvés</p>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={generating}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20 ${
            generating 
            ? 'bg-dark-500 text-muted cursor-not-allowed' 
            : 'bg-gradient-to-r from-primary-600 to-primary-400 text-white hover:scale-105 active:scale-95'
          }`}
        >
          {generating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              Générer Planning Auto
            </>
          )}
        </button>
      </div>

      {/* Résultat Génération */}
      {genResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 animate-slideDown">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-emerald-400">Planning généré avec succès</h3>
              <p className="text-emerald-400/80 mt-1">{genResult.message}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-dark-800/50 p-3 rounded-lg border border-emerald-500/20">
                  <p className="text-xs text-muted uppercase font-bold">Postes Pourvus</p>
                  <p className="text-xl font-bold text-main">{genResult.stats.assigned}/{genResult.stats.total_shifts}</p>
                </div>
                <div className="bg-dark-800/50 p-3 rounded-lg border border-emerald-500/20">
                  <p className="text-xs text-muted uppercase font-bold">Échecs</p>
                  <p className="text-xl font-bold text-red-400">{genResult.stats.failed}</p>
                </div>
                <div className="bg-dark-800/50 p-3 rounded-lg border border-emerald-500/20">
                  <p className="text-xs text-muted uppercase font-bold">Score Global</p>
                  <p className="text-xl font-bold text-amber-400">{genResult.stats.global_score}</p>
                </div>
                <div className="bg-dark-800/50 p-3 rounded-lg border border-emerald-500/20">
                  <p className="text-xs text-muted uppercase font-bold">Qualité Moyenne</p>
                  <p className="text-xl font-bold text-cyan-400">
                    {genResult.stats.assigned > 0 
                      ? Math.max(0, 100 - Math.round(genResult.stats.global_score / genResult.stats.assigned)) 
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="mt-4 p-4 bg-dark-800/30 rounded-lg border border-emerald-500/10">
                <h4 className="text-sm font-bold text-muted uppercase mb-3 border-b border-dark-500 pb-2">Détail des pénalités (Contraintes molles)</h4>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <span className="text-xs text-muted block">Équité (Charge)</span>
                    <span className="text-lg font-bold text-main">+{genResult.stats.breakdown.workload_equity}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Équité (Week-end)</span>
                    <span className="text-lg font-bold text-main">+{genResult.stats.breakdown.weekend_equity}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Préférences</span>
                    <span className="text-lg font-bold text-main">+{genResult.stats.breakdown.preferences}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Fatigue (Nuits)</span>
                    <span className="text-lg font-bold text-main">+{genResult.stats.breakdown.fatigue}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Bonus Continuité</span>
                    <span className="text-lg font-bold text-emerald-400">{genResult.stats.breakdown.continuity_bonus}</span>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setGenResult(null)} className="text-muted hover:text-main">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-dark-700 rounded-xl border border-dark-500 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-muted" />
          <h3 className="font-medium text-main">Filtres</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-2">Service</label>
            <select
              name="service"
              value={filters.service}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main focus:outline-none focus:border-primary-500"
            >
              <option value="">Tous les services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">À partir du</label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* Tableau */}
      {!loading && (
        <div className="bg-dark-700 rounded-xl border border-dark-500 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Unité
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Effectif
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-500">
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-muted">
                      Aucun poste trouvé
                    </td>
                  </tr>
                ) : (
                  shifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-dark-600/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted" />
                          <span className="text-main">{formatDateTime(shift.start_datetime)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-main">{shift.service_name}</td>
                      <td className="px-6 py-4 text-main">{shift.care_unit_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getShiftTypeColor(shift.shift_type_name)}`}>
                          {shift.shift_type_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {shift.is_fully_staffed ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          )}
                          <span className={`font-medium ${shift.is_fully_staffed ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {shift.assigned_count}/{shift.min_staff}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/shifts/${shift.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors font-medium text-sm"
                        >
                          <Users className="w-4 h-4" />
                          Gérer
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShiftList;
