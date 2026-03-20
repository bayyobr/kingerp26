import React from 'react';
import { SmartAlert } from '../../services/dashboardService';
import { Link } from 'react-router-dom';

interface DashboardAlertsProps {
    alerts: SmartAlert[];
}

export const DashboardAlerts: React.FC<DashboardAlertsProps> = ({ alerts }) => {
    if (alerts.length === 0) return null;

    const getStyles = (type: string) => {
        switch (type) {
            case 'critical': return 'bg-rose-500/10 border-rose-500/30 text-rose-400 icon-rose-500';
            case 'warning': return 'bg-amber-500/10 border-amber-500/30 text-amber-400 icon-amber-500';
            default: return 'bg-blue-500/10 border-blue-500/30 text-blue-400 icon-blue-500';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'critical': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    };

    return (
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
            {alerts.map((alert) => (
                <Link 
                    key={alert.id}
                    to={alert.link || '#'}
                    className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:brightness-110 active:scale-95 ${getStyles(alert.type)}`}
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {getIcon(alert.type)}
                    </span>
                    <span className="text-sm font-medium whitespace-nowrap">{alert.message}</span>
                    <span className="material-symbols-outlined text-[16px] opacity-50">
                        chevron_right
                    </span>
                </Link>
            ))}
        </div>
    );
};
