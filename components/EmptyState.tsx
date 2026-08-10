import React from 'react';
import Icon from './Icon';

interface EmptyStateProps {
  icon: string;
  iconBg?: string;
  title: string;
  description?: string;
  action?: { label: string; icon?: string; onClick: () => void };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconBg = 'bg-ink text-volt',
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-4 px-4 text-center">
      <div className={`plate flex size-14 items-center justify-center mb-3 border-2 border-ink ${iconBg}`}>
        <Icon name={icon} className="text-2xl" />
      </div>
      <h2 className="font-display text-base tracking-wide text-text-main mb-0.5">
        {title}
      </h2>
      {description && (
        <p className="mt-1 mb-3 max-w-[250px] text-xs text-text-muted">
          {description}
        </p>
      )}
      {action && (
        <button onClick={action.onClick} className={`flex items-center gap-2 rounded-full bg-primary text-white border-2 border-ink px-5 py-2.5 font-bold uppercase text-xs tracking-wide shadow-pop transition-all active:translate-y-1.5 active:shadow-none ${!description ? 'mt-2' : ''}`}>
          {action.icon && <Icon name={action.icon} className="text-[18px]" />}
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
