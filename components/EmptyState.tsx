import React from 'react';
import Icon from './Icon';

interface EmptyStateProps {
  icon: string;
  iconBg?: string;
  title: string;
  description: string;
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
    <div className="flex flex-1 h-full flex-col items-center justify-center py-16 px-8 text-center">
      <div className={`plate flex size-20 items-center justify-center mb-6 border-2 border-ink ${iconBg}`}>
        <Icon name={icon} className="text-4xl" />
      </div>
      <h2 className="font-display text-lg tracking-wide text-text-main mb-2">
        {title}
      </h2>
      <p className="mb-6 max-w-[250px] text-sm text-text-muted">
        {description}
      </p>
      {action && (
        <button onClick={action.onClick} className="flex items-center gap-2 rounded-full bg-primary text-white border-2 border-ink px-6 py-3 font-bold uppercase text-sm tracking-wide shadow-pop transition-all active:translate-y-1.5 active:shadow-none">
          {action.icon && <Icon name={action.icon} className="text-[20px]" />}
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
