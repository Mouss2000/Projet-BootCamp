// src/components/layout/Sidebar.js
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  CalendarOff,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Award,
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/planning', icon: Calendar, label: 'Planning' },
  { path: '/staff', icon: Users, label: 'Soignants' },
  { path: '/absences', icon: CalendarOff, label: 'Absences' },
  { path: '/certifications', icon: Award, label: 'Certifications' },
  { path: '/services', icon: Building2, label: 'Services' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside 
      className={`${collapsed ? 'w-20' : 'w-64'} bg-dark-800 border-r border-dark-600 flex flex-col transition-all duration-300`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-dark-600 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-main">MedPlan</h1>
              <p className="text-xs text-muted">Healthcare</p>
            </div>
          )}        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30' 
                  : 'text-muted hover:bg-dark-700 hover:text-main'
                }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'group-hover:text-primary-400'}`} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="p-4 border-t border-dark-600">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-muted hover:text-main hover:bg-dark-700 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="text-sm">Réduire</span>}
        </button>
      </div>
    </aside>
  );
}