'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardIndexPage() {
  const router = useRouter();
  const { roleHome, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      router.replace(roleHome);
    }
  }, [roleHome, isLoading, router]);

  return (
    <div className="py-24 flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 text-[#8C653B] animate-spin" />
      <p className="text-xs font-semibold text-[#5C5449]">
        Directing to your role command desk...
      </p>
    </div>
  );
}
