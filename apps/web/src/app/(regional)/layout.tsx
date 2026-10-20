import { RoleGuardLayout } from '@/components/layout/RoleGuardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGuardLayout allowedRoles={['REGIONAL_OFFICER']}>{children}</RoleGuardLayout>;
}
