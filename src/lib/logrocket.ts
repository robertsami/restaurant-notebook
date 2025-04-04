'use client';

import LogRocket from 'logrocket';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function LogRocketProvider() {
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_APP_ID || 'restaurant-notebook/dev');
      
      // Identify the user for LogRocket
      if (session?.user) {
        LogRocket.identify(session.user.id, {
          name: session.user.name || 'Unknown User',
          email: session.user.email || 'unknown@example.com',
        });
      }
    }
  }, [session]);

  return null;
}