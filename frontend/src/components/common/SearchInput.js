import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({ 
  placeholder = 'Rechercher...', 
  onSearch, 
  className = '',
  debounceMs = 300 
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) onSearch(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, onSearch, debounceMs]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}