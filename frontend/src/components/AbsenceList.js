// src/components/AbsenceList.js
import React, { useState, useEffect } from 'react';
import { absenceAPI, staffAPI, referenceAPI } from '../services/api';
import {
  CalendarOff,
  Plus,
  X,
  Trash2,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react';

function AbsenceList() {
  const [absences, setAbsences] = useState([]);
  const [staff, setStaff] = useState([]);
  const [absenceTypes, setAbsenceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    staff: '',
    absence_type: '',
    start_date: '',
    expected_end_date: '',
    is_planned: true,
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [absRes, staffRes, typesRes] = await Promise.all([
        absenceAPI.getAll(),
        staffAPI.getAll({ is_active: true }),
        referenceAPI.getAbsenceTypes(),
      ]);
      setAbsences(absRes.data);
      setStaff(staffRes.data);
      setAbsenceTypes(typesRes.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAbsences = async () => {
    try {
      const response = await absenceAPI.getAll();
      setAbsences(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const resetForm = () => {
    setFormData({
      staff: '',
      absence_type: '',
      start_date: '',
      expected_end_date: '',
      is_planned: true,
    });
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      await absenceAPI.create(formData);
      setShowForm(false);
      resetForm();
      loadAbsences();
    } catch (err) {
      setFormError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Erreur lors de la création'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, staffName) => {
    if (window.confirm(`Supprimer l'absence de ${staffName} ?`)) {
      try {
        await absenceAPI.delete(id);
        loadAbsences();
      } catch (err) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getAbsenceStatus = (absence) => {
    const today = new Date();
    const start = new Date(absence.start_date);
    const end = new Date(absence.expected_end_date);

    if (today < start) {
      return { label: 'À venir', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    } else if (today > end) {
      return { label: 'Terminée', color: 'bg-gray-500/20 text-muted border-gray-500/30' };
    } else {
      return { label: 'En cours', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-main flex items-center gap-3">
            <CalendarOff className="w-8 h-8 text-amber-400" />
            Absences
          </h1>
          <p className="text-muted mt-1">{absences.length} absences enregistrées</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            showForm
              ? 'bg-dark-600 text-main hover:bg-dark-500'
              : 'bg-amber-500 text-main hover:bg-amber-600'
          }`}
        >
          {showForm ? (
            <>
              <X className="w-5 h-5" /> Annuler
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" /> Déclarer une absence
            </>
          )}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-dark-700 rounded-xl border border-dark-500 p-6 animate-slideDown">
          <h3 className="text-lg font-semibold text-main mb-4">Nouvelle Absence</h3>

          {formError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-main mb-2">
                  Soignant *
                </label>
                <select
                  name="staff"
                  value={formData.staff}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main focus:outline-none focus:border-primary-500"
                >
                  <option value="">-- Sélectionner --</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-main mb-2">
                  Type d'absence *
                </label>
                <select
                  name="absence_type"
                  value={formData.absence_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main focus:outline-none focus:border-primary-500"
                >
                  <option value="">-- Sélectionner --</option>
                  {absenceTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-main mb-2">
                  Date de début *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-main mb-2">
                  Date de fin prévue *
                </label>
                <input
                  type="date"
                  name="expected_end_date"
                  value={formData.expected_end_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_planned"
                id="is_planned"
                checked={formData.is_planned}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-dark-400 bg-dark-600 text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="is_planned" className="text-main">
                Absence planifiée (congés, formation...)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-main rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>✓ Enregistrer</>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-2 bg-dark-600 text-main rounded-lg font-medium hover:bg-dark-500 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Tableau */}
      <div className="bg-dark-700 rounded-xl border border-dark-500 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Soignant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-500">
              {absences.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted">
                    Aucune absence enregistrée
                  </td>
                </tr>
              ) : (
                absences.map((absence) => {
                  const status = getAbsenceStatus(absence);
                  return (
                    <tr key={absence.id} className="hover:bg-dark-600/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-amber-400" />
                          </div>
                          <span className="font-medium text-main">{absence.staff_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-main">{absence.absence_type_name}</span>
                        {!absence.is_planned && (
                          <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                            Non planifiée
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-main">
                          <Calendar className="w-4 h-4 text-muted" />
                          {formatDate(absence.start_date)} → {formatDate(absence.expected_end_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(absence.id, absence.staff_name)}
                          className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AbsenceList;
