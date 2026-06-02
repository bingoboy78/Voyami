"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserIdCookie, setUserIdCookie } from '@/lib/user';

export interface UserDetail {
  id: string;
  name: string;
  avatarColor: string;
  initials: string;
}

export interface Participant {
  id: string;
  role: string;
  user: UserDetail;
}

interface IdentityContextType {
  currentUser: UserDetail | null;
  participants: Participant[];
  isLoading: boolean;
  loginAs: (userId: string) => void;
  refreshIdentity: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityContextProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIdentityData = async () => {
    try {
      const res = await fetch('/api/participants');
      if (!res.ok) throw new Error('Failed to fetch participants');
      const data = await res.json();
      
      const parts: Participant[] = data.participants || [];
      setParticipants(parts);

      // Read cookie
      let activeUserId = getUserIdCookie();
      
      // Verify if user exists in active participants
      let foundParticipant = parts.find(p => p.user.id === activeUserId);
      
      if (!foundParticipant && parts.length > 0) {
        // If not found in cookie or invalid user, default to OWNER or first member
        const owner = parts.find(p => p.role === 'OWNER') || parts[0];
        activeUserId = owner.user.id;
        setUserIdCookie(activeUserId);
        foundParticipant = owner;
      }

      if (foundParticipant) {
        setCurrentUser(foundParticipant.user);
      }
    } catch (err) {
      console.error('IdentityContext load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentityData();

    // Listen for participant updates to sync active identity list
    const handleUpdate = () => {
      fetchIdentityData();
    };
    window.addEventListener('participants-updated', handleUpdate);
    window.addEventListener('trip-updated', handleUpdate);
    return () => {
      window.removeEventListener('participants-updated', handleUpdate);
      window.removeEventListener('trip-updated', handleUpdate);
    };
  }, []);

  const loginAs = (userId: string) => {
    setUserIdCookie(userId);
    const userObj = participants.find(p => p.user.id === userId)?.user || null;
    setCurrentUser(userObj);
    
    // Dispatch event and force reload to refresh Server Components & Server Actions cache
    window.dispatchEvent(new CustomEvent('identity-changed', { detail: userId }));
    window.dispatchEvent(new CustomEvent('show-toast', { detail: `Вы вошли как ${userObj?.name || 'Пользователь'}` }));
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <IdentityContext.Provider value={{
      currentUser,
      participants,
      isLoading,
      loginAs,
      refreshIdentity: fetchIdentityData
    }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error('useIdentity must be used within an IdentityContextProvider');
  }
  return context;
}
