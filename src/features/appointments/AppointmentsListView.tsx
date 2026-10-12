import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Barbershop, Appointment } from '../../types';
import { api } from '../../services';
import { formatTimeBR, formatDateBR } from '../../utils/date';
import { formatBRL } from '../../utils/currency';
import { Clock, Search, Calendar, User, Scissors } from 'lucide-react';
import { AppointmentDetailModal } from '../agenda/AppointmentDetailModal';

interface AppointmentsListViewProps {
  barbershop: Barbershop;
}

export const AppointmentsListView: React.FC<AppointmentsListViewProps> = ({ barbershop }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load last 90 days of appointments
      const now = new Date();
      const past = new Date(now.getTime() - 90 * 86400000);
      const future = new Date(now.getTime() + 30 * 86400000);

      const list = await api.listAppointmentsByRange(
        barbershop.id,
        past.toISOString(),
        future.toISOString()
      );
      setAppointments(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [barbershop.id]);

  const filtered = appointments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = a.customer?.name.toLowerCase().includes(q);
      const matchCode = a.public_code.toLowerCase().includes(q);
      const matchService = a.service_name_snapshot.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchService) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 text-left">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F1EC]">
          Histórico de Atendimentos
        </h1>
        <p className="text-xs sm:text-sm text-[#A6A9AE]">
          Registro de todos os compromissos realizados, confirmados e pendentes
        </p>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Input
            placeholder="Pesquisar por cliente, código da reserva ou serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos os status' },
            { value: 'pending', label: 'Pendentes' },
            { value: 'confirmed', label: 'Confirmados' },
            { value: 'in_progress', label: 'Em atendimento' },
            { value: 'completed', label: 'Concluídos' },
            { value: 'cancelled', label: 'Cancelados' },
            { value: 'no_show', label: 'Não compareceu' },
          ]}
        />
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-8 h-8" />}
          title="Nenhum registro encontrado"
          description="Nenhum atendimento corresponde aos critérios de busca ou filtros aplicados."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((appt) => (
            <div
              key={appt.id}
              onClick={() => setSelectedAppointment(appt)}
              className="bg-[#14171B] border border-[#2B3036] hover:border-[#D6B875]/40 rounded-xl p-3 sm:p-4 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#1B1F24] border border-[#2B3036] rounded-xl text-center shrink-0">
                  <div className="text-xs font-bold text-[#F3F1EC]">
                    {formatDateBR(appt.starts_at)}
                  </div>
                  <div className="text-[10px] text-[#D6B875] font-mono mt-0.5">
                    {formatTimeBR(appt.starts_at)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#F3F1EC]">
                      {appt.customer?.name || 'Cliente'}
                    </span>
                    <StatusBadge status={appt.status} size="sm" />
                    <span className="text-[10px] font-mono text-[#A6A9AE] bg-[#1B1F24] px-1.5 py-0.5 rounded border border-[#2B3036]">
                      {appt.public_code}
                    </span>
                  </div>

                  <div className="text-xs text-[#A6A9AE] flex flex-wrap items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-[#F3F1EC]/90">
                      <Scissors className="w-3.5 h-3.5 text-[#D6B875]" />
                      {appt.service_name_snapshot}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {appt.barber?.name || 'Barbeiro'}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-[#D6B875]">
                      {formatBRL(appt.price_cents_snapshot)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AppointmentDetailModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onUpdated={loadData}
      />
    </div>
  );
};
