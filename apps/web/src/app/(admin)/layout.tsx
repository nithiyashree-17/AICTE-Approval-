import { RoleGuardLayout } from '@/components/layout/RoleGuardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGuardLayout allowedRoles={['SYSTEM_ADMINISTRATOR', 'AUDITOR']}>{children}</RoleGuardLayout>;
}
