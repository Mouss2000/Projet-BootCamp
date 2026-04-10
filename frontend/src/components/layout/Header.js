import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import SearchInput from '../common/SearchInput';
import {
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export default function Header() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { info } = useNotification();
  const [showProfile, setShowProfile] = useState(false);
  const [alerts] = useState(3);

  const handleSearch = (query) => {
    if (query) {
      console.log('Recherche:', query);
    }
  };

  return (
    <header className="h-16 bg-dark-800 border-b border-dark-600 flex items-center justify-between px-6">
      {/* Search */}
      <div className="w-96">
        <SearchInput 
          placeholder="Rechercher soignants, services..." 
          onSearch={handleSearch}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-muted hover:text-main hover:bg-dark-700 rounded-lg transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button 
          className="p-2 text-muted hover:text-main hover:bg-dark-700 rounded-lg transition-colors relative"
          onClick={() => info('Vous avez 3 nouvelles notifications', 'Notifications')}
        >
          <Bell className="w-5 h-5" />
          {alerts > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-xs text-main flex items-center justify-center font-bold">
              {alerts}
            </span>
          )}
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-main font-bold text-sm">AD</span>
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-main">Admin</p>
              <p className="text-xs text-muted">Administrateur</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted transition-transform ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-dark-700 border border-dark-500 rounded-xl shadow-xl py-2 animate-fadeIn z-50">
              <button className="flex items-center gap-3 px-4 py-2 text-muted hover:bg-dark-600 hover:text-main transition-colors w-full">
                <User className="w-4 h-4" />
                <span>Mon Profil</span>
              </button>
              <button className="flex items-center gap-3 px-4 py-2 text-muted hover:bg-dark-600 hover:text-main transition-colors w-full">
                <Settings className="w-4 h-4" />
                <span>Paramètres</span>
              </button>
              <hr className="my-2 border-dark-500" />
              <button className="flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-dark-600 w-full transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
