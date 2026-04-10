// src/components/StaffList.js
import React, { useState, useEffect, useCallback } from 'react';
import { staffAPI, referenceAPI, contractAPI } from '../services/api';
import Badge from './common/Badge';
import Button from './common/Button';
import Modal from './common/Modal';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit,
  Mail,
  Phone,
  Eye,
  Filter,
  Grid,
  List,
  UserCheck,
  UserX,
  X,
  Check,
  AlertCircle,
  Calendar,
  Award,
  FileText,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';

function StaffList() {
  // États principaux
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filtres et recherche
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // all, active, inactive
  const [viewMode, setViewMode] = useState('table'); // table, grid

  // Modal et formulaire
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    is_active: true,
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // États pour les contrats
  const [contractTypes, setContractTypes] = useState([]);
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractFormData, setContractFormData] = useState({
    contract_type: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    workload_percent: 100,
  });

  // Menu contextuel
  const [openMenuId, setOpenMenuId] = useState(null);

  // Charger les soignants
  const loadStaff = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = {};
      if (search) params.search = search;
      if (filterActive === 'active') params.is_active = true;
      if (filterActive === 'inactive') params.is_active = false;

      const [staffRes, contractTypesRes] = await Promise.all([
        staffAPI.getAll(params),
        referenceAPI.getContractTypes()
      ]);
      
      setStaff(staffRes.data);
      setContractTypes(contractTypesRes.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des soignants');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filterActive]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // ... (rest of the helper functions)

  const handleAddContract = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await contractAPI.create({
        ...contractFormData,
        staff: selectedStaff.id
      });
      // Recharger les détails du soignant
      const response = await staffAPI.getById(selectedStaff.id);
      setSelectedStaff(response.data);
      setShowContractForm(false);
      setContractFormData({
        contract_type: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        workload_percent: 100,
      });
    } catch (err) {
      alert('Erreur lors de l\'ajout du contrat');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContract = async (id) => {
    if (!window.confirm('Supprimer ce contrat ?')) return;
    try {
      await contractAPI.delete(id);
      const response = await staffAPI.getById(selectedStaff.id);
      setSelectedStaff(response.data);
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  // Fermer le menu contextuel quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filtrer les soignants côté client (en plus du serveur)
  const filteredStaff = staff.filter((s) => {
    const matchSearch =
      s.first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && s.is_active) ||
      (filterActive === 'inactive' && !s.is_active);

    return matchSearch && matchFilter;
  });

  // Stats rapides
  const stats = {
    total: staff.length,
    active: staff.filter((s) => s.is_active).length,
    inactive: staff.filter((s) => !s.is_active).length,
  };

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      is_active: true,
    });
    setFormError(null);
    setSelectedStaff(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      first_name: staffMember.first_name,
      last_name: staffMember.last_name,
      email: staffMember.email,
      phone: staffMember.phone || '',
      is_active: staffMember.is_active,
    });
    setModalMode('edit');
    setShowModal(true);
    setOpenMenuId(null);
  };

  const openViewModal = async (staffMember) => {
    try {
      setLoading(true);
      const response = await staffAPI.getById(staffMember.id);
      setSelectedStaff(response.data);
      setModalMode('view');
      setShowModal(true);
      setOpenMenuId(null);
    } catch (err) {
      alert('Erreur lors du chargement des détails du soignant');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    if (modalMode !== 'view') {
      resetForm();
    }
    setSelectedStaff(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (modalMode === 'edit' && selectedStaff) {
        await staffAPI.update(selectedStaff.id, formData);
      } else {
        await staffAPI.create(formData);
      }
      closeModal();
      loadStaff();
    } catch (err) {
      const errorMessage =
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Erreur lors de l\'enregistrement';
      setFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (staffMember) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer ${staffMember.first_name} ${staffMember.last_name} ?`
      )
    ) {
      return;
    }

    try {
      await staffAPI.delete(staffMember.id);
      loadStaff();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de la suppression');
    }
    setOpenMenuId(null);
  };

  const toggleActive = async (staffMember) => {
    try {
      await staffAPI.update(staffMember.id, {
        ...staffMember,
        is_active: !staffMember.is_active,
      });
      loadStaff();
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
    setOpenMenuId(null);
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Rendu du tableau
  const renderTable = () => (
    <div className="bg-dark-700 rounded-xl border border-dark-500 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-600">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Soignant
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Créé le
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-500">
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-muted">
                  {search || filterActive !== 'all'
                    ? 'Aucun soignant trouvé avec ces critères'
                    : 'Aucun soignant enregistré'}
                </td>
              </tr>
            ) : (
              filteredStaff.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-dark-600/50 transition-colors cursor-pointer"
                  onClick={() => openViewModal(s)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-main ${
                          s.is_active
                            ? 'bg-gradient-to-br from-primary-600 to-primary-400'
                            : 'bg-gray-600'
                        }`}
                      >
                        {s.first_name[0]}
                        {s.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-main">
                          {s.first_name} {s.last_name}
                        </p>
                        <p className="text-sm text-muted">ID: {s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-main">
                        <Mail className="w-4 h-4 text-muted" />
                        <span className="text-sm">{s.email}</span>
                      </div>
                      {s.phone && (
                        <div className="flex items-center gap-2 text-main">
                          <Phone className="w-4 h-4 text-muted" />
                          <span className="text-sm">{s.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={s.status === 'Actif' ? 'success' : s.status === 'Absent' ? 'warning' : 'danger'}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted text-sm">
                    {new Date(s.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => toggleMenu(e, s.id)}
                        className="p-2 text-muted hover:text-main hover:bg-dark-500 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {openMenuId === s.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-dark-600 rounded-lg shadow-xl border border-dark-500 py-1 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openViewModal(s);
                            }}
                            className="w-full px-4 py-2 text-left text-main hover:bg-dark-500 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Voir détails
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(s);
                            }}
                            className="w-full px-4 py-2 text-left text-main hover:bg-dark-500 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Modifier
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActive(s);
                            }}
                            className="w-full px-4 py-2 text-left text-main hover:bg-dark-500 flex items-center gap-2"
                          >
                            {s.is_active ? (
                              <>
                                <UserX className="w-4 h-4" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4" />
                                Activer
                              </>
                            )}
                          </button>
                          <hr className="my-1 border-dark-500" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(s);
                            }}
                            className="w-full px-4 py-2 text-left text-rose-400 hover:bg-dark-500 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Rendu en grille
  const renderGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredStaff.length === 0 ? (
        <div className="col-span-full text-center py-12 text-muted">
          {search || filterActive !== 'all'
            ? 'Aucun soignant trouvé avec ces critères'
            : 'Aucun soignant enregistré'}
        </div>
      ) : (
        filteredStaff.map((s) => (
          <div
            key={s.id}
            onClick={() => openViewModal(s)}
            className="bg-dark-700 rounded-xl border border-dark-500 p-5 hover:border-dark-400 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-main ${
                  s.is_active
                    ? 'bg-gradient-to-br from-primary-600 to-primary-400'
                    : 'bg-gray-600'
                }`}
              >
                {s.first_name[0]}
                {s.last_name[0]}
              </div>
              <Badge variant={s.is_active ? 'success' : 'danger'} size="sm">
                {s.is_active ? 'Actif' : 'Inactif'}
              </Badge>
            </div>

            <h3 className="font-semibold text-main text-lg group-hover:text-primary-400 transition-colors">
              {s.first_name} {s.last_name}
            </h3>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-muted text-sm">
                <Mail className="w-4 h-4" />
                <span className="truncate">{s.email}</span>
              </div>
              {s.phone && (
                <div className="flex items-center gap-2 text-muted text-sm">
                  <Phone className="w-4 h-4" />
                  <span>{s.phone}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-dark-500 flex justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(s);
                }}
                className="text-muted hover:text-primary-400 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleActive(s);
                }}
                className="text-muted hover:text-amber-400 transition-colors"
              >
                {s.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(s);
                }}
                className="text-muted hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Modal de création/édition
  const renderFormModal = () => (
    <Modal isOpen={showModal && modalMode !== 'view'} onClose={closeModal}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-main mb-6 flex items-center gap-2">
          {modalMode === 'create' ? (
            <>
              <Plus className="w-6 h-6 text-primary-400" />
              Nouveau Soignant
            </>
          ) : (
            <>
              <Edit className="w-6 h-6 text-primary-400" />
              Modifier le Soignant
            </>
          )}
        </h2>

        {formError && (
          <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-rose-400">{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-main mb-2">Prénom *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main placeholder-muted focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-2">Nom *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main placeholder-muted focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-main mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main placeholder-muted focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="jean.dupont@hopital.fr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-main mb-2">Téléphone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main placeholder-muted focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="06 12 34 56 78"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="w-4 h-4 rounded border-dark-400 bg-dark-600 text-primary-500 focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="text-main">
              Soignant actif
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-main rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-3 bg-dark-600 text-main rounded-lg font-medium hover:bg-dark-500 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );

  // Modal de visualisation
  const renderViewModal = () => (
    <Modal isOpen={showModal && modalMode === 'view'} onClose={closeModal} size="lg">
      {selectedStaff && (
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-main ${
                  selectedStaff.is_active
                    ? 'bg-gradient-to-br from-primary-600 to-primary-400'
                    : 'bg-gray-600'
                }`}
              >
                {selectedStaff.first_name[0]}
                {selectedStaff.last_name[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-main">
                  {selectedStaff.first_name} {selectedStaff.last_name}
                </h2>
                <Badge variant={selectedStaff.status === 'Actif' ? 'success' : selectedStaff.status === 'Absent' ? 'warning' : 'danger'}>
                  {selectedStaff.status}
                </Badge>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 text-muted hover:text-main hover:bg-dark-500 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Infos de contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-600 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/20 rounded-lg">
                  <Mail className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-sm text-muted">Email</p>
                  <p className="text-main">{selectedStaff.email}</p>
                </div>
              </div>
            </div>
            <div className="bg-dark-600 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Phone className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-muted">Téléphone</p>
                  <p className="text-main">{selectedStaff.phone || 'Non renseigné'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sections d'information */}
          <div className="space-y-4">
            {/* Contrats */}
            <div className="bg-dark-600 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-main flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Contrats
                </h3>
                <button 
                  onClick={() => setShowContractForm(!showContractForm)}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium transition-colors border border-emerald-500/20"
                >
                  {showContractForm ? <X size={14} /> : <Plus size={14} />}
                  {showContractForm ? 'Annuler' : 'Nouveau'}
                </button>
              </div>

              {showContractForm && (
                <form onSubmit={handleAddContract} className="mb-4 p-3 bg-dark-700 rounded-lg border border-emerald-500/30 space-y-3 animate-slideDown">
                  <div>
                    <label className="block text-xs text-muted mb-1">Type de contrat</label>
                    <select
                      value={contractFormData.contract_type}
                      onChange={(e) => setContractFormData({...contractFormData, contract_type: e.target.value})}
                      required
                      className="w-full px-3 py-1.5 bg-dark-600 border border-dark-500 rounded text-sm text-main focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Choisir --</option>
                      {contractTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-muted mb-1">Date début</label>
                      <input
                        type="date"
                        value={contractFormData.start_date}
                        onChange={(e) => setContractFormData({...contractFormData, start_date: e.target.value})}
                        required
                        className="w-full px-3 py-1.5 bg-dark-600 border border-dark-500 rounded text-sm text-main"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Date fin</label>
                      <input
                        type="date"
                        value={contractFormData.end_date}
                        onChange={(e) => setContractFormData({...contractFormData, end_date: e.target.value})}
                        className="w-full px-3 py-1.5 bg-dark-600 border border-dark-500 rounded text-sm text-main"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-1.5 bg-emerald-600 text-main rounded text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Ajouter le contrat
                  </button>
                </form>
              )}

              {selectedStaff.contracts && selectedStaff.contracts.length > 0 ? (
                <div className="space-y-2">
                  {selectedStaff.contracts.map((contract) => (
                    <div key={contract.id} className="group flex justify-between items-center text-sm border-b border-dark-500 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="text-main">{contract.contract_type_name}</p>
                        <p className="text-muted">
                          Du {new Date(contract.start_date).toLocaleDateString()} 
                          {contract.end_date ? ` au ${new Date(contract.end_date).toLocaleDateString()}` : " (Indéfini)"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={contract.is_active ? 'success' : 'neutral'} size="sm">
                          {contract.workload_percent}%
                        </Badge>
                        <button 
                          onClick={() => handleDeleteContract(contract.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-rose-400 transition-all"
                          title="Supprimer le contrat"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm">Aucun contrat enregistré</p>
              )}
            </div>

            {/* Certifications */}
            <div className="bg-dark-600 rounded-lg p-4">
              <h3 className="font-semibold text-main mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Certifications
              </h3>
              {selectedStaff.certifications && selectedStaff.certifications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedStaff.certifications.map((cert) => (
                    <div key={cert.id} className="relative group">
                      <Badge variant={cert.is_expired ? 'danger' : 'warning'}>
                        {cert.certification_name}
                      </Badge>
                      {cert.expiration_date && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-dark-800 text-xs text-main rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          Obtenue le: {new Date(cert.obtained_date).toLocaleDateString()}<br/>
                          Expire le: {new Date(cert.expiration_date).toLocaleDateString()}
                          {cert.days_until_expiration < 30 && cert.days_until_expiration > 0 && (
                            <p className="text-amber-400 mt-1 font-bold">Expire bientôt !</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm">Aucune certification enregistrée</p>
              )}
            </div>

            {/* Absences récentes */}
            <div className="bg-dark-600 rounded-lg p-4">
              <h3 className="font-semibold text-main mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-400" />
                Dernière absence
              </h3>
              {selectedStaff.last_absence ? (
                <div className="text-sm">
                   <p className="text-main font-medium">{selectedStaff.last_absence.absence_type_name}</p>
                   <p className="text-muted">
                     Du {new Date(selectedStaff.last_absence.start_date).toLocaleDateString()} 
                     au {new Date(selectedStaff.last_absence.expected_end_date).toLocaleDateString()}
                   </p>
                </div>
              ) : (
                <p className="text-muted text-sm">Aucune absence récente</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-dark-500">
            <button
              onClick={() => {
                closeModal();
                openEditModal(selectedStaff);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-main rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={() => toggleActive(selectedStaff)}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStaff.is_active
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
            >
              {selectedStaff.is_active ? (
                <>
                  <UserX className="w-4 h-4" />
                  Désactiver
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Activer
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );

  // Chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-muted">Chargement des soignants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-main flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-400" />
            Soignants
          </h1>
          <p className="text-muted mt-1">
            {stats.total} soignants • {stats.active} actifs • {stats.inactive} inactifs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadStaff(true)}
            disabled={refreshing}
            className="p-2 text-muted hover:text-main hover:bg-dark-600 rounded-lg transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-main rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau soignant
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main placeholder-muted focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Filtre statut */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main focus:outline-none focus:border-primary-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs uniquement</option>
              <option value="inactive">Inactifs uniquement</option>
            </select>
          </div>

          {/* Toggle vue */}
          <div className="flex items-center gap-1 bg-dark-600 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-primary-500 text-main'
                  : 'text-muted hover:text-main'
              }`}
              title="Vue tableau"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-500 text-main'
                  : 'text-muted hover:text-main'
              }`}
              title="Vue grille"
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <p className="text-rose-400">{error}</p>
        </div>
      )}

      {/* Contenu */}
      {viewMode === 'table' ? renderTable() : renderGrid()}

      {/* Modals */}
      {renderFormModal()}
      {renderViewModal()}
    </div>
  );
}

export default StaffList;
