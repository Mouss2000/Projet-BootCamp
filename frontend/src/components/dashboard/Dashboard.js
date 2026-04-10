// src/components/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { staffAPI, shiftAPI, absenceAPI, serviceAPI } from '../../services/api';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import {
  Users,
  Calendar,
  CalendarOff,
  Building2,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  CalendarPlus,
  Activity,
  RefreshCw,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    todayShifts: 0,
    understaffedShifts: 0,
    currentAbsences: 0,
    totalServices: 0,
    weekShifts: 0,
    fullyStaffedShifts: 0,
  });
  const [recentShifts, setRecentShifts] = useState([]);
  const [recentAbsences, setRecentAbsences] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const today = new Date().toISOString().split('T')[0];
      const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [staffRes, todayShiftsRes, weekShiftsRes, absencesRes, servicesRes] = await Promise.all([
        staffAPI.getAll(),
        shiftAPI.getAll({ date_from: today, date_to: today }),
        shiftAPI.getAll({ date_from: today, date_to: weekLater }),
        absenceAPI.getAll(),
        serviceAPI.getAll(),
      ]);

      const activeStaff = staffRes.data.filter((s) => s.is_active);
      const todayUnderstaffed = todayShiftsRes.data.filter((s) => !s.is_fully_staffed);
      const todayFullyStaffed = todayShiftsRes.data.filter((s) => s.is_fully_staffed);

      // Filtrer les absences en cours
      const currentAbsences = absencesRes.data.filter((a) => {
        const start = new Date(a.start_date);
        const end = new Date(a.expected_end_date);
        const now = new Date();
        return start <= now && end >= now;
      });

      setStats({
        totalStaff: staffRes.data.length,
        activeStaff: activeStaff.length,
        todayShifts: todayShiftsRes.data.length,
        understaffedShifts: todayUnderstaffed.length,
        currentAbsences: currentAbsences.length,
        totalServices: servicesRes.data.length,
        weekShifts: weekShiftsRes.data.length,
        fullyStaffedShifts: todayFullyStaffed.length,
      });

      setRecentShifts(todayShiftsRes.data.slice(0, 5));
      setRecentAbsences(currentAbsences.slice(0, 4));

      // Générer les alertes
      const newAlerts = [];
      if (todayUnderstaffed.length > 0) {
        newAlerts.push({
          type: 'warning',
          icon: AlertTriangle,
          message: `${todayUnderstaffed.length} poste(s) en sous-effectif aujourd'hui`,
          link: '/planning',
          linkText: 'Voir les postes',
        });
      }
      if (currentAbsences.length > 0) {
        newAlerts.push({
          type: 'info',
          icon: CalendarOff,
          message: `${currentAbsences.length} absence(s) en cours`,
          link: '/absences',
          linkText: 'Gérer les absences',
        });
      }
      if (activeStaff.length < 5) {
        newAlerts.push({
          type: 'danger',
          icon: Users,
          message: 'Effectif critique : moins de 5 soignants actifs',
          link: '/staff',
          linkText: 'Ajouter du personnel',
        });
      }
      setAlerts(newAlerts);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getShiftTypeBadgeVariant = (typeName) => {
    switch (typeName?.toLowerCase()) {
      case 'nuit':
        return 'info';
      case 'matin':
        return 'warning';
      case 'après-midi':
      case 'apres-midi':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getAlertStyle = (type) => {
    switch (type) {
      case 'danger':
        return 'border-rose-500/30 bg-rose-500/10';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/10';
      case 'info':
        return 'border-cyan-500/30 bg-cyan-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getAlertIconColor = (type) => {
    switch (type) {
      case 'danger':
        return 'text-rose-400';
      case 'warning':
        return 'text-amber-400';
      case 'info':
        return 'text-cyan-400';
      default:
        return 'text-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-muted">Chargement du tableau de bord...</p>
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
            <Activity className="w-8 h-8 text-primary-400" />
            Tableau de Bord
          </h1>
          <p className="text-muted mt-1">Bienvenue sur MedPlan Healthcare - Vue d'ensemble</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-dark-600 text-main rounded-lg hover:bg-dark-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-sm text-muted">Aujourd'hui</p>
            <p className="text-lg font-semibold text-main">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 rounded-xl border ${getAlertStyle(alert.type)}`}
            >
              <div className="flex items-center gap-3">
                <alert.icon className={`w-5 h-5 ${getAlertIconColor(alert.type)}`} />
                <span className="text-main">{alert.message}</span>
              </div>
              <Link
                to={alert.link}
                className="flex items-center gap-1 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
              >
                {alert.linkText}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Soignants Actifs"
          value={stats.activeStaff}
          subtitle={`sur ${stats.totalStaff} total`}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Postes Aujourd'hui"
          value={stats.todayShifts}
          subtitle={
            stats.understaffedShifts > 0
              ? `${stats.understaffedShifts} en sous-effectif`
              : 'Tous couverts ✓'
          }
          icon={Calendar}
          color="cyan"
        />
        <StatCard
          title="Absences en Cours"
          value={stats.currentAbsences}
          subtitle="soignants indisponibles"
          icon={CalendarOff}
          color={stats.currentAbsences > 3 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Services Actifs"
          value={stats.totalServices}
          subtitle="unités de soins"
          icon={Building2}
          color="emerald"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dark-700 rounded-xl border border-dark-500 p-4 flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-lg">
            <CheckCircle className="w-6 h-6 text-main" />
          </div>
          <div>
            <p className="text-2xl font-bold text-main">{stats.fullyStaffedShifts}</p>
            <p className="text-sm text-muted">Postes complets aujourd'hui</p>
          </div>
        </div>
        <div className="bg-dark-700 rounded-xl border border-dark-500 p-4 flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-amber-600 to-amber-400 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-main" />
          </div>
          <div>
            <p className="text-2xl font-bold text-main">{stats.understaffedShifts}</p>
            <p className="text-sm text-muted">Postes en sous-effectif</p>
          </div>
        </div>
        <div className="bg-dark-700 rounded-xl border border-dark-500 p-4 flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-cyan-600 to-cyan-400 rounded-lg">
            <TrendingUp className="w-6 h-6 text-main" />
          </div>
          <div>
            <p className="text-2xl font-bold text-main">{stats.weekShifts}</p>
            <p className="text-sm text-muted">Postes cette semaine</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Shifts */}
        <div className="lg:col-span-2 bg-dark-700 rounded-xl border border-dark-500 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-main flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-400" />
              Postes du Jour
            </h2>
            <Link
              to="/planning"
              className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
            >
              Voir tout
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentShifts.length > 0 ? (
            <div className="space-y-3">
              {recentShifts.map((shift) => (
                <Link
                  key={shift.id}
                  to={`/shifts/${shift.id}`}
                  className="flex items-center justify-between p-4 bg-dark-600 rounded-lg hover:bg-dark-500 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        shift.is_fully_staffed ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-main group-hover:text-primary-400 transition-colors">
                        {shift.service_name}
                      </p>
                      <p className="text-sm text-muted">{shift.care_unit_name}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge variant={getShiftTypeBadgeVariant(shift.shift_type_name)}>
                      {shift.shift_type_name}
                    </Badge>
                    <p className="text-sm text-muted mt-1">
                      {formatTime(shift.start_datetime)} - {formatTime(shift.end_datetime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {shift.is_fully_staffed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-amber-400" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        shift.is_fully_staffed ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {shift.assigned_count}/{shift.min_staff}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-muted text-lg">Aucun poste pour aujourd'hui</p>
              <Link
                to="/planning"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors"
              >
                <CalendarPlus className="w-4 h-4" />
                Voir le planning
              </Link>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Current Absences */}
          <div className="bg-dark-700 rounded-xl border border-dark-500 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-main flex items-center gap-2">
                <CalendarOff className="w-5 h-5 text-amber-400" />
                Absences en cours
              </h2>
              <Link
                to="/absences"
                className="text-primary-400 hover:text-primary-300 text-sm font-medium"
              >
                Voir tout
              </Link>
            </div>

            {recentAbsences.length > 0 ? (
              <div className="space-y-3">
                {recentAbsences.map((absence) => (
                  <div
                    key={absence.id}
                    className="flex items-center gap-3 p-3 bg-dark-600 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-main truncate">{absence.staff_name}</p>
                      <p className="text-xs text-muted">{absence.absence_type_name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="warning" size="sm">
                        {new Date(absence.expected_end_date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-emerald-400/50 mx-auto mb-2" />
                <p className="text-muted text-sm">Aucune absence en cours</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-dark-700 rounded-xl border border-dark-500 p-6">
            <h2 className="text-lg font-semibold text-main mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-400" />
              Actions Rapides
            </h2>

            <div className="space-y-2">
              <Link
                to="/planning"
                className="flex items-center gap-3 p-3 bg-dark-600 rounded-lg hover:bg-dark-500 transition-colors group"
              >
                <div className="p-2 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg">
                  <Calendar className="w-5 h-5 text-main" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-main">Planning</p>
                  <p className="text-xs text-muted">Voir les gardes</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary-400 transition-colors" />
              </Link>

              <Link
                to="/staff"
                className="flex items-center gap-3 p-3 bg-dark-600 rounded-lg hover:bg-dark-500 transition-colors group"
              >
                <div className="p-2 bg-gradient-to-br from-cyan-600 to-cyan-400 rounded-lg">
                  <UserPlus className="w-5 h-5 text-main" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-main">Soignants</p>
                  <p className="text-xs text-muted">Gérer le personnel</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-cyan-400 transition-colors" />
              </Link>

              <Link
                to="/absences"
                className="flex items-center gap-3 p-3 bg-dark-600 rounded-lg hover:bg-dark-500 transition-colors group"
              >
                <div className="p-2 bg-gradient-to-br from-amber-600 to-amber-400 rounded-lg">
                  <CalendarOff className="w-5 h-5 text-main" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-main">Absences</p>
                  <p className="text-xs text-muted">Déclarer une absence</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-amber-400 transition-colors" />
              </Link>

              <Link
                to="/services"
                className="flex items-center gap-3 p-3 bg-dark-600 rounded-lg hover:bg-dark-500 transition-colors group"
              >
                <div className="p-2 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-lg">
                  <Building2 className="w-5 h-5 text-main" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-main">Services</p>
                  <p className="text-xs text-muted">Unités de soins</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-emerald-400 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-gradient-to-r from-primary-600/20 via-cyan-600/20 to-emerald-600/20 rounded-xl border border-primary-500/30 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-main flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-400" />
              Résumé de la semaine
            </h3>
            <p className="text-muted text-sm mt-1">
              {stats.weekShifts} postes planifiés • {stats.activeStaff} soignants disponibles •{' '}
              {stats.currentAbsences} absence(s) en cours
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/planning"
              className="px-4 py-2 bg-primary-500 text-main rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Planning complet
            </Link>
            <Link
              to="/staff"
              className="px-4 py-2 bg-dark-600 text-main rounded-lg hover:bg-dark-500 transition-colors font-medium flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Gérer l'équipe
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
