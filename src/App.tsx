import React, { useState, useEffect } from 'react';
import { api, isDemoMode } from './services';
import { Barbershop, Appointment } from './types';
import { AdminLayout, AdminTab } from './features/layout/AdminLayout';
import { AuthView } from './features/auth/AuthView';
import { OnboardingView } from './features/onboarding/OnboardingView';
import { DashboardView } from './features/dashboard/DashboardView';
import { AgendaView } from './features/agenda/AgendaView';
import { AppointmentsListView } from './features/appointments/AppointmentsListView';
import { CustomersView } from './features/customers/CustomersView';
import { ServicesView } from './features/services/ServicesView';
import { BarbersView } from './features/barbers/BarbersView';
import { SettingsView } from './features/settings/SettingsView';
import { PublicBookingView } from './features/public-booking/PublicBookingView';
import { ManualAppointmentModal } from './features/agenda/ManualAppointmentModal';
import { AppointmentDetailModal } from './features/agenda/AppointmentDetailModal';
import { Skeleton } from './components/ui/Skeleton';

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Admin tab state
  const [currentTab, setCurrentTab] = useState<AdminTab>('today');

  // Global modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Sync with browser navigation
  useEffect(() => {
    const onLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Auth & shop initialization
  const loadUserAndShop = async () => {
    setIsLoadingAuth(true);
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const shop = await api.getOwnerBarbershop();
        setBarbershop(shop);
      } else {
        setBarbershop(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    loadUserAndShop();
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    await api.signOut();
    setCurrentUser(null);
    setBarbershop(null);
  };

  // ----------------------------------------------------
  // ROUTE 1: PUBLIC BOOKING PAGE (Default on root `/` and `/agendar/:slug`)
  // ----------------------------------------------------
  const isAdminRoute = currentPath.startsWith('/app') || currentPath.startsWith('/admin');
  if (!isAdminRoute) {
    const slug = currentPath.startsWith('/agendar/')
      ? currentPath.replace('/agendar/', '').split('/')[0] || 'anthonys-barbearia'
      : 'anthonys-barbearia';
    return (
      <div className="relative min-h-screen bg-[#0B0D0F]">
        {/* Floating switch to admin panel */}
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => navigateTo('/app')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14171B]/90 hover:bg-[#1C2026] border border-[#D6B875]/30 text-[#D6B875] text-[11px] font-semibold rounded-full shadow-2xl backdrop-blur-md transition-all active:scale-95"
            title="Acessar Painel Administrativo"
          >
            <span>Painel Admin</span>
            <span>→</span>
          </button>
        </div>
        <PublicBookingView slug={slug} />
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 2: ADMIN AREA
  // ----------------------------------------------------
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#0B0D0F] flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <Skeleton className="h-10 w-36 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Unauthenticated user -> Login/Register
  if (!currentUser) {
    return (
      <div className="relative min-h-screen bg-[#0B0D0F]">
        <AuthView onSuccess={loadUserAndShop} />
      </div>
    );
  }

  // Authenticated user with no barbershop yet -> Onboarding
  if (!barbershop) {
    return (
      <div className="relative min-h-screen bg-[#0B0D0F]">
        <OnboardingView onCompleted={(shop) => setBarbershop(shop)} />
      </div>
    );
  }

  // Authenticated user with barbershop -> Main Admin Experience
  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      barbershop={barbershop}
      onLogout={handleLogout}
    >
      {currentTab === 'today' && (
        <DashboardView
          barbershop={barbershop}
          onNavigateTab={setCurrentTab}
          onOpenNewAppointment={() => setIsManualModalOpen(true)}
          onSelectAppointment={(appt) => setSelectedAppointment(appt)}
        />
      )}

      {currentTab === 'agenda' && <AgendaView barbershop={barbershop} />}

      {currentTab === 'appointments' && <AppointmentsListView barbershop={barbershop} />}

      {currentTab === 'customers' && <CustomersView barbershop={barbershop} />}

      {currentTab === 'services' && <ServicesView barbershop={barbershop} />}

      {currentTab === 'barbers' && <BarbersView barbershop={barbershop} />}

      {currentTab === 'settings' && (
        <SettingsView barbershop={barbershop} onUpdated={(s) => setBarbershop(s)} />
      )}

      {/* Global Manual Appointment Modal */}
      <ManualAppointmentModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        barbershop={barbershop}
        onSuccess={() => {
          // Trigger tab re-render or notification
        }}
      />

      {/* Global Appointment Details Modal */}
      <AppointmentDetailModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onUpdated={() => {
          setSelectedAppointment(null);
        }}
      />
    </AdminLayout>
  );
}

export default App;
