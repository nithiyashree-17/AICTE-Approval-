import { RoleGuardLayout } from '@/components/layout/RoleGuardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGuardLayout allowedRoles={['COMPETENT_AUTHORITY']}>{children}</RoleGuardLayout>;
}
