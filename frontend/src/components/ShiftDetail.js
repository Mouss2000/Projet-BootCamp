// src/components/ShiftDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shiftAPI, assignmentAPI, staffAPI, referenceAPI } from '../services/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Award,
  Search,
  Plus,
  X,
} from 'lucide-react';

function ShiftDetail() {
  const { id } = useParams();
  const [shift, setShift] = useState(null);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedStaff, setSelectedStaff] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState(null);

  const [checkStaff, setCheckStaff] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [allStaff, setAllStaff] = useState([]);

  const [allCertifications, setAllCertifications] = useState([]);
  const [showCertModal, setShowCertModal] = useState(false);
  const [isUpdatingCerts, setIsUpdatingCerts] = useState(false);

  const loadShift = useCallback(async () => {
    try {
      setLoading(true);
      const [shiftRes, availableRes, allStaffRes, certsRes] = await Promise.all([
        shiftAPI.getById(id),
        shiftAPI.getAvailableStaff(id),
        staffAPI.getAll({ is_active: true }),
        referenceAPI.getCertifications(),
      ]);
      setShift(shiftRes.data);
      setAvailableStaff(availableRes.data.available_staff || []);
      setAllStaff(allStaffRes.data || []);
      setAllCertifications(certsRes.data || []);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement du poste');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadShift();
  }, [loadShift]);

  const handleAddCertification = async (certId) => {
    setIsUpdatingCerts(true);
    try {
      await shiftAPI.addCertification(id, certId);
      await loadShift();
    } catch (err) {
      alert('Erreur lors de l\'ajout de la certification');
    } finally {
      setIsUpdatingCerts(false);
    }
  };

  const handleRemoveCertification = async (certId) => {
    setIsUpdatingCerts(true);
    try {
      await shiftAPI.removeCertification(id, certId);
      await loadShift();
    } catch (err) {
      alert('Erreur lors du retrait de la certification');
    } finally {
      setIsUpdatingCerts(false);
    }
  };

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    if (!checkStaff) return;

    setChecking(true);
    setCheckResult(null);

    try {
      const response = await assignmentAPI.validate({
        shift: parseInt(id),
        staff: parseInt(checkStaff),
      });
      setCheckResult(response.data);
    } catch (err) {
      alert('Erreur lors de la vérification');
    } finally {
      setChecking(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setAssigning(true);
    setAssignmentError(null);
    setAssignmentSuccess(null);

    try {
      const response = await assignmentAPI.create({
        shift: parseInt(id),
        staff: parseInt(selectedStaff),
      });
      setAssignmentSuccess(response.data.message || 'Soignant affecté avec succès');
      setSelectedStaff('');
      loadShift();
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        setAssignmentError(errorData.errors);
      } else if (errorData?.detail) {
        setAssignmentError([errorData.detail]);
      } else {
        setAssignmentError(['Erreur lors de l\'affectation']);
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (assignmentId, staffName) => {
    if (!window.confirm(`Retirer ${staffName} de ce poste ?`)) return;

    try {
      await assignmentAPI.delete(assignmentId);
      setAssignmentSuccess(`${staffName} a été retiré(e) du poste`);
      setAssignmentError(null);
      loadShift();
    } catch (err) {
      setAssignmentError(['Erreur lors de la suppression']);
    }
  };

  const formatDateTime = (datetime) => {
    return new Date(datetime).toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getShiftTypeColor = (typeName) => {
    switch (typeName?.toLowerCase()) {
      case 'nuit':
        return 'bg-indigo-500 text-main';
      case 'matin':
        return 'bg-amber-500 text-main';
      case 'après-midi':
      case 'apres-midi':
        return 'bg-orange-500 text-main';
      default:
        return 'bg-gray-500 text-main';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
        {error}
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
        Poste non trouvé
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Link */}
      <Link
        to="/shifts"
        className="inline-flex items-center gap-2 text-muted hover:text-main transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux postes
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${getShiftTypeColor(shift.shift_type_name)}`}>
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-main">{shift.shift_type_name}</h1>
            <p className="text-muted">{shift.service_name} • {shift.care_unit_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {shift.is_fully_staffed ? (
            <span className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              Effectif complet
            </span>
          ) : (
            <span className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              Sous-effectif
            </span>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-muted">Début</p>
              <p className="text-main font-medium">{formatDateTime(shift.start_datetime)}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-muted">Fin</p>
              <p className="text-main font-medium">{formatDateTime(shift.end_datetime)}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Info className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted">Durée</p>
              <p className="text-main font-medium">{shift.duration_hours} heures</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted">Effectif requis</p>
              <p className="text-main font-medium">
                {shift.min_staff} - {shift.max_staff || '∞'} soignants
              </p>
            </div>
          </div>
        </div>

        {/* Section Certifications Requises */}
        <div className="bg-dark-700 rounded-xl border border-dark-500 p-4 md:col-span-2 lg:col-span-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-main font-semibold">Certifications requises pour ce poste</h3>
            </div>
            
            <button 
              onClick={() => setShowCertModal(!showCertModal)}
              className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-1"
            >
              {showCertModal ? <X size={16} /> : <Plus size={16} />}
              {showCertModal ? 'Fermer la gestion' : 'Gérer les exigences'}
            </button>
          </div>

          {showCertModal && (
            <div className="mb-6 p-4 bg-dark-600 rounded-lg border border-dark-400 animate-slideDown">
              <p className="text-sm text-muted mb-4">Ajoutez des certifications obligatoires pour ce poste. Les soignants ne les possédant pas seront exclus.</p>
              <div className="flex flex-wrap gap-2">
                {allCertifications
                  .filter(c => !shift.required_certifications?.find(rc => rc.id === c.id))
                  .map(cert => (
                    <button
                      key={cert.id}
                      onClick={() => handleAddCertification(cert.id)}
                      disabled={isUpdatingCerts}
                      className="px-3 py-1.5 bg-dark-500 hover:bg-emerald-500/20 border border-dark-400 hover:border-emerald-500/50 text-main hover:text-emerald-400 rounded-lg text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Plus size={14} />
                      {cert.name}
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {shift.required_certifications && shift.required_certifications.length > 0 ? (
              shift.required_certifications.map(cert => (
                <span 
                  key={cert.id} 
                  className="group px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold flex items-center gap-2"
                >
                  {cert.name}
                  {showCertModal && (
                    <button 
                      onClick={() => handleRemoveCertification(cert.id)}
                      disabled={isUpdatingCerts}
                      className="text-amber-600 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))
            ) : (
              <p className="text-muted text-sm italic">Aucune certification spécifique requise</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soignants affectés */}
        <div className="bg-dark-700 rounded-xl border border-dark-500 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-main flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-400" />
              Soignants affectés
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              shift.is_fully_staffed 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {shift.assignments?.length || 0} / {shift.min_staff}
            </span>
          </div>

          {shift.assignments?.length > 0 ? (
            <div className="space-y-3">
              {shift.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 bg-dark-600 rounded-lg hover:bg-dark-500 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <span className="text-primary-400 font-semibold text-sm">
                        {assignment.staff_name?.split(' ').map(n => n[0]).join('') || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-main">{assignment.staff_name}</p>
                      <p className="text-sm text-muted">
                        Affecté le {new Date(assignment.assigned_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(assignment.id, assignment.staff_name)}
                    className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Retirer"
                  >
                    <UserMinus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-muted">Aucun soignant affecté</p>
            </div>
          )}
        </div>

        {/* Formulaire d'affectation */}
        <div className="bg-dark-700 rounded-xl border border-dark-500 p-6">
          <h2 className="text-lg font-semibold text-main flex items-center gap-2 mb-6">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            Ajouter un soignant
          </h2>

          {/* Message de succès */}
          {assignmentSuccess && (
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-400">{assignmentSuccess}</p>
            </div>
          )}

          {/* Message d'erreur */}
          {assignmentError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-400 mb-2">Impossible d'affecter ce soignant :</p>
                  <ul className="list-disc list-inside space-y-1">
                    {assignmentError.map((err, i) => (
                      <li key={i} className="text-red-300 text-sm">{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {availableStaff.length > 0 ? (
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Sélectionner un soignant disponible
                </label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  disabled={assigning}
                  className="w-full px-4 py-3 bg-dark-600 border border-dark-400 rounded-lg text-main focus:outline-none focus:border-primary-500 disabled:opacity-50"
                >
                  <option value="">-- Choisir un soignant --</option>
                  {availableStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedStaff || assigning}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-main rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Affectation en cours...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Affecter ce soignant
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-amber-500/50 mx-auto mb-3" />
              <p className="text-muted mb-2">Aucun soignant disponible</p>
              <p className="text-sm text-muted">
                Tous les soignants sont soit déjà affectés, soit indisponibles pour ce créneau.
              </p>
            </div>
          )}

          {/* Section de vérification de disponibilité */}
          <div className="mt-10 pt-10 border-t border-dark-500">
            <h2 className="text-lg font-semibold text-main flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-cyan-400" />
              Vérifier un autre soignant
            </h2>
            <p className="text-sm text-muted mb-6">
              Si un soignant n'apparaît pas dans la liste ci-dessus, vous pouvez vérifier ici pourquoi il est indisponible.
            </p>

            <form onSubmit={handleCheckAvailability} className="flex gap-2 mb-6">
              <select
                value={checkStaff}
                onChange={(e) => setCheckStaff(e.target.value)}
                disabled={checking}
                className="flex-1 px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              >
                <option value="">-- Sélectionner un soignant --</option>
                {allStaff
                  .filter(s => !availableStaff.find(as => as.id === s.id))
                  .map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name}
                    </option>
                  ))}
              </select>
              <button
                type="submit"
                disabled={!checkStaff || checking}
                className="px-6 py-2 bg-cyan-600 text-main rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
              >
                {checking ? 'Vérification...' : 'Vérifier'}
              </button>
            </form>

            {checkResult && (
              <div className={`p-4 rounded-lg border ${
                checkResult.is_valid 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  {checkResult.is_valid ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium mb-1 ${checkResult.is_valid ? 'text-emerald-400' : 'text-red-400'}`}>
                      {checkResult.is_valid ? 'Soignant disponible' : 'Soignant indisponible'}
                    </p>
                    {checkResult.errors && checkResult.errors.length > 0 && (
                      <ul className="list-disc list-inside space-y-1">
                        {checkResult.errors.map((err, i) => (
                          <li key={i} className="text-red-300 text-sm">{err}</li>
                        ))}
                      </ul>
                    )}
                    {checkResult.warnings && checkResult.warnings.length > 0 && (
                      <div className="mt-2">
                        <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Avertissements :</p>
                        <ul className="list-disc list-inside space-y-1">
                          {checkResult.warnings.map((warn, i) => (
                            <li key={i} className="text-amber-300 text-sm">{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShiftDetail;
