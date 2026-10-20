import { RoleGuardLayout } from '@/components/layout/RoleGuardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGuardLayout allowedRoles={['SAC_SHC']}>{children}</RoleGuardLayout>;
}
