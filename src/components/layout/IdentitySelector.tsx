"use client";

import { useState, useRef, useEffect } from 'react';
import { useIdentity } from './IdentityContext';
import { cn } from '@/lib/utils';
import { User, ChevronDown, Check, UserPlus } from 'lucide-react';

export function IdentitySelector({ className }: { className?: string }) {
  const { currentUser, participants, loginAs } = useIdentity();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2.5 p-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated transition-all duration-200"
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-display font-extrabold text-[10px] shadow-sm shrink-0"
            style={{ backgroundColor: currentUser.avatarColor }}
          >
            {currentUser.initials}
          </div>
          {/* Name */}
          <div className="text-left min-w-0">
            <strong className="block text-xs font-semibold text-text-primary leading-tight truncate">
              {currentUser.name}
            </strong>
            <span className="block text-[9px] text-text-secondary leading-none mt-0.5">
              Вы вошли как
            </span>
          </div>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-text-tertiary transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-surface border border-border rounded-xl shadow-xl overflow-hidden animate-fade-in max-h-56 overflow-y-auto">
          <div className="p-1.5 flex flex-col gap-0.5">
            <div className="px-2 py-1 text-[9px] font-mono font-bold tracking-wider text-text-secondary uppercase">
              Сменить участника
            </div>
            
            {participants.map((p) => {
              const isSelected = p.user.id === currentUser.id;
              return (
                <button
                  key={p.user.id}
                  onClick={() => {
                    loginAs(p.user.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors",
                    isSelected 
                      ? "bg-primary/5 text-primary font-semibold" 
                      : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-md text-white flex items-center justify-center font-display font-extrabold text-[9px] shrink-0"
                      style={{ backgroundColor: p.user.avatarColor }}
                    >
                      {p.user.initials}
                    </div>
                    <span className="truncate">{p.user.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              );
            })}

            <div className="border-t border-border/60 my-1"></div>
            
            <a
              href="/people"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left text-primary hover:bg-primary/5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Добавить друга</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
