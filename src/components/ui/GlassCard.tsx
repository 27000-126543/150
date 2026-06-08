import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

const GlassCard = ({ children, className, title, icon, action }: GlassCardProps) => {
  return (
    <div
      className={cn(
        'rounded-xl backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 shadow-2xl shadow-cyan-500/10',
        className
      )}
      style={{ fontFamily: 'Rajdhani, sans-serif' }}
    >
      {(title || icon) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
          <div className="flex items-center gap-2">
            {icon && <span className="text-cyan-400">{icon}</span>}
            {title && (
              <h3 className="text-cyan-400 font-bold text-sm tracking-wider">{title}</h3>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn('p-4', title || icon ? '' : 'p-4')}>{children}</div>
    </div>
  );
};

export default GlassCard;
