import React from 'react';
import Icon from './Icon';

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  centered?: boolean;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  eyebrow,
  onBack,
  rightAction,
  centered = false,
  children,
}) => {
  return (
    <header className="sticky top-0 z-30 flex flex-col bg-ink px-5 py-4 gap-3 border-b border-white/10">
      <div className="flex items-center justify-between min-h-[40px]">
        {centered ? (
          <>
            <div className="flex items-center justify-start shrink-0 min-w-[40px]">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex size-10 items-center justify-center text-white cursor-pointer hover:bg-white/10 rounded-full transition-colors shrink-0"
                  aria-label="Go back"
                >
                  <Icon name="arrow_back" className="text-[24px]" />
                </button>
              )}
            </div>
            <div className="text-center flex-1 px-2 min-w-0">
              {eyebrow && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 truncate">
                  {eyebrow}
                </p>
              )}
              <h1 className="font-display text-lg tracking-wide text-white truncate">
                {title}
              </h1>
            </div>
            <div className="flex items-center justify-end shrink-0 min-w-[40px]">
              {rightAction}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex size-10 items-center justify-center text-white cursor-pointer hover:bg-white/10 rounded-full transition-colors shrink-0"
                  aria-label="Go back"
                >
                  <Icon name="arrow_back" className="text-[24px]" />
                </button>
              )}
              <div className="min-w-0">
                {eyebrow && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 truncate">
                    {eyebrow}
                  </p>
                )}
                <h1 className="font-display text-2xl text-white tracking-wide truncate">
                  {title}
                </h1>
              </div>
            </div>
            <div className="shrink-0">
              {rightAction}
            </div>
          </>
        )}
      </div>
      {children}
    </header>
  );
};

export default PageHeader;
