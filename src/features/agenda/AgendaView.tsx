import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Barbershop, Barber, Appointment, AppointmentStatus } from '../../types';
import { api } from '../../services';
import {
  toISODateString,
  formatDateBR,
  formatTimeBR,
  DAYS_OF_WEEK_NAMES,
  parseISODateString,
} from '../../utils/date';
import { formatBRL } from '../../utils/currency';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  User,
  Scissors,
  Clock,
} from 'lucide-react';
import { ManualAppointmentModal } from './ManualAppointmentModal';
import { AppointmentDetailModal } from './AppointmentDetailModal';

interface AgendaViewProps {
  barbershop: Barbershop;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ barbershop }) => {
  const [selectedDate, setSelectedDate] = useState(toISODateString(new Date()));
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [brbs, appts] = await Promise.all([
        api.listBarbers(barbershop.id),
        api.listAppointmentsByDate(barbershop.id, selectedDate),
      ]);
      setBarbers(brbs);
      setAppointments(appts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [barbershop.id, selectedDate]);

  // Date navigation helpers
  const handlePrevDay = () => {
    const d = parseISODateString(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(toISODateString(d));
  };

  const handleNextDay = () => {
    const d = parseISODateString(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(toISODateString(d));
  };

  const handleToday = () => {
    setSelectedDate(toISODateString(new Date()));
  };

  const currentDateObj = parseISODateString(selectedDate);
  const weekdayName = DAYS_OF_WEEK_NAMES[currentDateObj.getDay()];

  // Filtering
  const filteredAppointments = appointments.filter((appt) => {
    if (selectedBarberFilter !== 'all' && appt.barber_id !== selectedBarberFilter) {
      return false;
    }
    if (selectedStatusFilter !== 'all' && appt.status !== selectedStatusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6 text-left">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F1EC]">
            Agenda Diária
          </h1>
          <p className="text-xs sm:text-sm text-[#A6A9AE]">
            Visualize e gerencie os horários de cada barbeiro
          </p>
        </div>

        <Button
          onClick={() => setIsManualModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          size="sm"
          className="self-start sm:self-auto"
        >
          Novo Agendamento
        </Button>
      </div>

      {/* Date Navigation Bar (Touch-optimized) */}
      <div className="bg-[#14171B] border border-[#2B3036] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Navigation controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handlePrevDay}
            className="p-2 min-h-[40px] min-w-[40px]"
            aria-label="Dia anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleToday}
            className="text-xs font-semibold px-3 min-h-[40px]"
          >
            Hoje
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleNextDay}
            className="p-2 min-h-[40px] min-w-[40px]"
            aria-label="Próximo dia"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Date Display & Native Picker */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-bold text-[#F3F1EC]">
              {weekdayName}, {formatDateBR(selectedDate)}
            </div>
            <div className="text-[11px] text-[#D6B875]">
              {filteredAppointments.length}{' '}
              {filteredAppointments.length === 1 ? 'atendimento' : 'atendimentos'}
            </div>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="bg-[#1B1F24] text-[#F3F1EC] border border-[#2B3036] rounded-lg px-2 py-1.5 text-xs min-h-[40px] focus:outline-none focus:border-[#D6B875]"
          />
        </div>
      </div>

      {/* Filters (Barber & Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Filtrar por Barbeiro"
          value={selectedBarberFilter}
          onChange={(e) => setSelectedBarberFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos os profissionais' },
            ...barbers.map((b) => ({ value: b.id, label: b.name })),
          ]}
        />

        <Select
          label="Filtrar por Status"
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos os status' },
            { value: 'pending', label: 'Apenas Pendentes' },
            { value: 'confirmed', label: 'Apenas Confirmados' },
            { value: 'in_progress', label: 'Apenas Em atendimento' },
            { value: 'completed', label: 'Apenas Concluídos' },
            { value: 'cancelled', label: 'Apenas Cancelados' },
            { value: 'no_show', label: 'Apenas Não compareceu' },
          ]}
        />
      </div>

      {/* Appointments Timeline / List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="Nenhum atendimento encontrado"
          description={`Não há compromissos agendados para ${weekdayName}, ${formatDateBR(selectedDate)} com os filtros selecionados.`}
          action={
            <Button
              size="sm"
              onClick={() => setIsManualModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Criar Agendamento neste dia
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filteredAppointments.map((appt) => (
            <div
              key={appt.id}
              onClick={() => setSelectedAppointment(appt)}
              className="bg-[#14171B] border border-[#2B3036] hover:border-[#D6B875]/40 rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              {/* Left: Time badge & Client info */}
              <div className="flex items-start gap-3">
                <div className="w-16 sm:w-20 text-center py-2 px-2 bg-[#1B1F24] border border-[#2B3036] rounded-xl shrink-0">
                  <div className="font-bold text-sm sm:text-base text-[#F3F1EC] leading-tight">
                    {formatTimeBR(appt.starts_at)}
                  </div>
                  <div className="text-[10px] text-[#A6A9AE] mt-0.5 leading-tight">
                    {formatTimeBR(appt.ends_at)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm sm:text-base text-[#F3F1EC]">
                      {appt.customer?.name || 'Cliente'}
                    </span>
                    <StatusBadge status={appt.status} size="sm" />
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

              {/* Right: Public code & indicator */}
              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#2B3036]/50">
                <span className="text-[11px] font-mono text-[#A6A9AE] bg-[#1B1F24] px-2 py-1 rounded border border-[#2B3036]">
                  {appt.public_code}
                </span>
                <span className="text-xs text-[#D6B875] font-medium sm:hidden">
                  Ver detalhes →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Appointment Modal */}
      <ManualAppointmentModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        barbershop={barbershop}
        onSuccess={loadData}
        initialDate={selectedDate}
      />

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onUpdated={loadData}
      />
    </div>
  );
};
