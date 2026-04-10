// src/components/ShiftList.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { shiftAPI, referenceAPI } from '../services/api';
import { Calendar, Filter, Clock, Users, CheckCircle, AlertTriangle } from 'lucide-react';

function ShiftList() {
  const [shifts, setShifts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    service: '',
    date_from: new Date().toISOString().split('T')[0],
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
      <div>
        <h1 className="text-3xl font-bold text-main flex items-center gap-3">
          <Calendar className="w-8 h-8 text-cyan-400" />
          Postes de Garde
        </h1>
        <p className="text-muted mt-1">{shifts.length} postes trouvés</p>
      </div>

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
