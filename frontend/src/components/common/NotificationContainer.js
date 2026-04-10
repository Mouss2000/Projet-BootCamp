import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
  error: 'bg-rose-500/20 border-rose-500 text-rose-400',
  warning: 'bg-amber-500/20 border-amber-500 text-amber-400',
  info: 'bg-cyan-500/20 border-cyan-500 text-cyan-400',
};

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 w-96">
      {notifications.map((notification) => {
        const Icon = icons[notification.type];
        return (
          <div
            key={notification.id}
            className={`${colors[notification.type]} border rounded-lg p-4 shadow-lg animate-slideIn glass`}
          >
            <div className="flex items-start gap-3">
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">{notification.title}</p>
                <p className="text-sm opacity-90">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}