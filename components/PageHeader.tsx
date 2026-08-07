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
    <header className="sticky top-0 z-30 flex flex-col bg-ink px-5 py-5 gap-3">
      <div className={`flex items-center ${centered ? 'justify-between' : 'justify-between'}`}>
        {centered ? (
          <>
            <div className="w-10">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex size-10 items-center justify-start text-white cursor-pointer"
                >
                  <Icon name="arrow_back" className="text-[24px]" />
                </button>
              )}
            </div>
            <div className="text-center flex-1">
              {eyebrow && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  {eyebrow}
                </p>
              )}
              <h1 className="font-display text-lg tracking-wide text-white">
                {title}
              </h1>
            </div>
            <div className="w-10 flex justify-end">
              {rightAction}
            </div>
          </>
        ) : (
          <>
            <div>
              {eyebrow && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  {eyebrow}
                </p>
              )}
              <h1 className="font-display text-2xl text-white tracking-wide">
                {title}
              </h1>
            </div>
            {rightAction}
          </>
        )}
      </div>
      {children}
    </header>
  );
};

export default PageHeader;
