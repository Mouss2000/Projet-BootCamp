import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);

    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const success = (message, title = 'Succès') => 
    addNotification({ type: 'success', title, message });

  const error = (message, title = 'Erreur') => 
    addNotification({ type: 'error', title, message });

  const warning = (message, title = 'Attention') => 
    addNotification({ type: 'warning', title, message });

  const info = (message, title = 'Information') => 
    addNotification({ type: 'info', title, message });

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, success, error, warning, info }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);