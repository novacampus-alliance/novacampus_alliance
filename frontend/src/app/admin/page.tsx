import { PortalLayout } from '@/components/portal-layout';

export default function AdminPortalPage() {
  return (
    <PortalLayout title="Portail Administration">
      <p className="text-gray-600">
        Bienvenue sur votre espace — inscriptions, plannings, paiements.
      </p>
    </PortalLayout>
  );
}
