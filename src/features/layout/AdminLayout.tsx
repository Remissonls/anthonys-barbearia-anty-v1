import React, { useState } from 'react';
import {
  Clock,
  Users,
  Scissors,
  UserCheck,
  Settings,
  ExternalLink,
  Menu,
  X,
  LogOut,
  Sparkles,
  ChevronRight,
  LayoutDashboard,
  CalendarDays,
} from 'lucide-react';
import { Barbershop } from '../../types';
import { isDemoMode } from '../../services';

export type AdminTab =
  | 'today'
  | 'agenda'
  | 'appointments'
  | 'customers'
  | 'services'
  | 'barbers'
  | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  barbershop: Barbershop | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  barbershop,
  onLogout,
  children,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const publicUrl = barbershop ? `/agendar/${barbershop.slug}` : '#';

  const navItems = [
    { id: 'today' as AdminTab, label: 'Hoje', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'agenda' as AdminTab, label: 'Agenda', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'appointments' as AdminTab, label: 'Histórico', icon: <Clock className="w-5 h-5" /> },
    { id: 'customers' as AdminTab, label: 'Clientes', icon: <Users className="w-5 h-5" /> },
  ];

  const moreItems = [
    { id: 'services' as AdminTab, label: 'Serviços & Preços', icon: <Scissors className="w-5 h-5" />, desc: 'Gerenciar cardápio e durações' },
    { id: 'barbers' as AdminTab, label: 'Equipe de Barbeiros', icon: <UserCheck className="w-5 h-5" />, desc: 'Profissionais, jornadas e folgas' },
    { id: 'settings' as AdminTab, label: 'Configurações', icon: <Settings className="w-5 h-5" />, desc: 'Horários, fuso e modo de agendamento' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0D0F] text-[#F3F1EC] flex flex-col lg:flex-row text-left">
      {/* DESKTOP SIDEBAR (>= 1024px) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#14171B] border-r border-[#2B3036] shrink-0 sticky top-0 h-screen">
        {/* Brand */}
        <div className="p-5 border-b border-[#2B3036] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg text-[#F3F1EC]">Agenda<span className="text-[#D6B875]">Pro</span></span>
              {isDemoMode && (
                <span className="text-[10px] font-semibold bg-[#D6B875]/20 text-[#D6B875] border border-[#D6B875]/40 px-1.5 py-0.5 rounded-full">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-xs text-[#A6A9AE] truncate max-w-[190px] mt-0.5">
              {barbershop?.name || 'Minha Barbearia'}
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#A6A9AE]/60">
            Principal
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#D6B875]/15 text-[#D6B875] border border-[#D6B875]/30'
                    : 'text-[#A6A9AE] hover:text-[#F3F1EC] hover:bg-[#1B1F24]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#A6A9AE]/60">
            Gestão
          </div>
          {moreItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#D6B875]/15 text-[#D6B875] border border-[#D6B875]/30'
                    : 'text-[#A6A9AE] hover:text-[#F3F1EC] hover:bg-[#1B1F24]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Public link & Logout */}
        <div className="p-3 border-t border-[#2B3036] space-y-2">
          {barbershop && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-[#D6B875] bg-[#D6B875]/10 hover:bg-[#D6B875]/20 border border-[#D6B875]/30 rounded-lg transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Página de Agendamento
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#A6A9AE] hover:text-[#EF4444] rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* MOBILE TOP BAR (< 1024px) */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#14171B]/95 backdrop-blur-md border-b border-[#2B3036] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-[#F3F1EC]">Agenda<span className="text-[#D6B875]">Pro</span></span>
            {isDemoMode && (
              <span className="text-[10px] font-semibold bg-[#D6B875]/20 text-[#D6B875] border border-[#D6B875]/40 px-1.5 py-0.5 rounded-full">
                DEMO
              </span>
            )}
          </div>
          {barbershop && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#D6B875] bg-[#D6B875]/10 border border-[#D6B875]/30 px-2.5 py-1.5 rounded-lg active:bg-[#D6B875]/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Link Público</span>
            </a>
          )}
        </header>

        {/* Demo banner indicator */}
        {isDemoMode && (
          <div className="bg-[#D6B875]/10 border-b border-[#D6B875]/20 px-4 py-1.5 text-xs text-[#D6B875] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Modo Demonstração Ativo</strong> — dados salvos no navegador com simulação idêntica ao PostgreSQL.
              </span>
            </div>
          </div>
        )}

        {/* Page Content with bottom padding to never be obscured by mobile nav */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (< 1024px) - Section 3.4 */}
      <nav
        aria-label="Navegação móvel"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#14171B]/95 backdrop-blur-md border-t border-[#2B3036] px-2 py-1 flex items-center justify-around safe-area-bottom"
      >
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg min-h-[48px] min-w-[56px] transition-colors ${
                isActive ? 'text-[#D6B875]' : 'text-[#A6A9AE] hover:text-[#F3F1EC]'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#D6B875] rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </button>
          );
        })}

        {/* "Mais" button */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg min-h-[48px] min-w-[56px] transition-colors ${
            moreItems.some((m) => m.id === currentTab) ? 'text-[#D6B875]' : 'text-[#A6A9AE] hover:text-[#F3F1EC]'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Mais</span>
        </button>
      </nav>

      {/* "MAIS" DRAWER MODAL ON MOBILE */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs lg:hidden animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsMoreOpen(false)} />
          <div className="relative w-full bg-[#14171B] border-t border-[#2B3036] rounded-t-2xl p-5 z-10 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B3036]">
              <h3 className="font-semibold text-[#F3F1EC]">Mais opções</h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 text-[#A6A9AE] hover:text-[#F3F1EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {moreItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setIsMoreOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
                    currentTab === item.id
                      ? 'bg-[#D6B875]/10 border-[#D6B875]/40 text-[#D6B875]'
                      : 'bg-[#1B1F24] border-[#2B3036] text-[#F3F1EC] hover:bg-[#252B32]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#0B0D0F] text-[#D6B875]">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-[#A6A9AE]">{item.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#A6A9AE]" />
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#2B3036] space-y-2">
              {barbershop && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#D6B875] text-[#0B0D0F] font-semibold text-sm rounded-xl"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir link de agendamento público
                </a>
              )}
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onLogout();
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-xs text-[#EF4444] font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
