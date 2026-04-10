// src/components/CertificationList.js
import React, { useState, useEffect, useCallback } from 'react';
import { certificationAPI, staffCertificationAPI, staffAPI } from '../services/api';
import Badge from './common/Badge';
import Modal from './common/Modal';
import {
  Award,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Users,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Calendar,
  UserPlus,
  Clock,
  AlertTriangle,
} from 'lucide-react';

function CertificationList() {
  const [certifications, setCertifications] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [staffCertifications, setStaffCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('certifications');

  const [showCertModal, setShowCertModal] = useState(false);
  const [certModalMode, setCertModalMode] = useState('create');
  const [selectedCert, setSelectedCert] = useState(null);
  const [certFormData, setCertFormData] = useState({ name: '' });
  const [certFormError, setCertFormError] = useState(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaffForCert, setSelectedStaffForCert] = useState(null);
  const [assignFormData, setAssignFormData] = useState({
    certification: '',
    obtained_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
  });
  const [assignFormError, setAssignFormError] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const [certsRes, staffRes, staffCertsRes] = await Promise.all([
        certificationAPI.getAll(),
        staffAPI.getAll({ is_active: true }),
        staffCertificationAPI.getAll(),
      ]);
      setCertifications(certsRes.data);
      setStaffList(staffRes.data);
      setStaffCertifications(staffCertsRes.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredCertifications = certifications.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const filteredStaff = staffList.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()));

  const handleCertSubmit = async (e) => {
    e.preventDefault();
    try {
      if (certModalMode === 'edit') await certificationAPI.update(selectedCert.id, certFormData);
      else await certificationAPI.create(certFormData);
      setShowCertModal(false);
      loadData();
    } catch (err) { setCertFormError('Erreur lors de l\'enregistrement'); }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await staffCertificationAPI.create({
        staff: selectedStaffForCert.id,
        certification: parseInt(assignFormData.certification),
        obtained_date: assignFormData.obtained_date,
        expiration_date: assignFormData.expiration_date || null,
      });
      setShowAssignModal(false);
      loadData();
    } catch (err) { setAssignFormError('Erreur lors de l\'affectation'); }
  };

  const handleRemoveStaffCert = async (id) => {
    if (!window.confirm('Retirer cette certification ?')) return;
    try {
      await staffCertificationAPI.delete(id);
      loadData();
    } catch (err) { alert('Erreur lors de la suppression'); }
  };

  if (loading) return <div className="p-12 text-center text-muted">Chargement...</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-main flex items-center gap-3">
          <Award className="w-8 h-8 text-amber-400" /> Certifications
        </h1>
        <button onClick={() => { setCertModalMode('create'); setCertFormData({name:''}); setShowCertModal(true); }} className="bg-amber-500 text-main px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus /> Nouvelle certification
        </button>
      </div>

      <div className="flex gap-4 border-b border-dark-500">
        <button onClick={() => setActiveTab('certifications')} className={`pb-2 px-4 ${activeTab === 'certifications' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-muted'}`}>Types</button>
        <button onClick={() => setActiveTab('staff')} className={`pb-2 px-4 ${activeTab === 'staff' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-muted'}`}>Par soignant</button>
      </div>

      <div className="bg-dark-700 p-4 rounded-xl border border-dark-500 flex items-center gap-3">
        <Search className="text-muted" />
        <input type="text" placeholder="Rechercher..." className="bg-transparent border-none text-main w-full focus:outline-none" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {activeTab === 'certifications' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredCertifications.map(cert => (
            <div key={cert.id} className="bg-dark-700 p-5 rounded-xl border border-dark-500 flex justify-between items-center">
              <span className="text-main font-medium">{cert.name}</span>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedCert(cert); setCertFormData({name: cert.name}); setCertModalMode('edit'); setShowCertModal(true); }} className="text-muted hover:text-main"><Edit size={18} /></button>
                <button onClick={async () => { if(window.confirm('Supprimer ?')) { await certificationAPI.delete(cert.id); loadData(); } }} className="text-muted hover:text-red-400"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-700 rounded-xl border border-dark-500 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-dark-600 text-muted text-sm">
              <tr>
                <th className="p-4">Soignant</th>
                <th className="p-4">Certifications</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-500">
              {filteredStaff.map(staff => {
                const myCerts = staffCertifications.filter(sc => sc.staff === staff.id);
                return (
                  <tr key={staff.id} className="hover:bg-dark-600/50">
                    <td className="p-4 text-main font-medium">{staff.first_name} {staff.last_name}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {myCerts.map(sc => (
                          <div key={sc.id} className="bg-dark-600 px-3 py-1 rounded-full flex items-center gap-2 group">
                            <span className="text-xs text-main">{certifications.find(c => c.id === sc.certification)?.name}</span>
                            <button onClick={() => handleRemoveStaffCert(sc.id)} className="text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setSelectedStaffForCert(staff); setShowAssignModal(true); }} className="text-amber-400 hover:text-amber-300 flex items-center gap-1 ml-auto">
                        <UserPlus size={18} /> Ajouter
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals are kept simple for the fix */}
      <Modal isOpen={showCertModal} onClose={() => setShowCertModal(false)}>
        <form onSubmit={handleCertSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-main">{certModalMode === 'edit' ? 'Modifier' : 'Nouveau Type'}</h2>
          <input type="text" required value={certFormData.name} onChange={e => setCertFormData({name: e.target.value})} className="w-full bg-dark-600 border border-dark-400 p-2 rounded text-main" placeholder="Nom..." />
          <button type="submit" className="w-full bg-amber-500 text-main py-2 rounded">Enregistrer</button>
        </form>
      </Modal>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-main">Affecter à {selectedStaffForCert?.first_name}</h2>
          <select required value={assignFormData.certification} onChange={e => setAssignFormData({...assignFormData, certification: e.target.value})} className="w-full bg-dark-600 border border-dark-400 p-2 rounded text-main">
            <option value="">-- Choisir --</option>
            {certifications.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" required value={assignFormData.obtained_date} onChange={e => setAssignFormData({...assignFormData, obtained_date: e.target.value})} className="bg-dark-600 border border-dark-400 p-2 rounded text-main" />
            <input type="date" value={assignFormData.expiration_date} onChange={e => setAssignFormData({...assignFormData, expiration_date: e.target.value})} className="bg-dark-600 border border-dark-400 p-2 rounded text-main" />
          </div>
          <button type="submit" className="w-full bg-amber-500 text-main py-2 rounded">Affecter</button>
        </form>
      </Modal>
    </div>
  );
}

export default CertificationList;
