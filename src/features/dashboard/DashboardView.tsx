import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Barbershop, DashboardMetrics, Appointment, AppointmentStatus } from '../../types';
import { api } from '../../services';
import { toISODateString, formatTimeBR, formatDateLongBR } from '../../utils/date';
import { formatBRL } from '../../utils/currency';
import {
  Calendar,
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  TrendingUp,
  User,
  Scissors,
  Share2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface DashboardViewProps {
  barbershop: Barbershop;
  onNavigateTab: (tab: any) => void;
  onOpenNewAppointment: () => void;
  onSelectAppointment: (appt: Appointment) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  barbershop,
  onNavigateTab,
  onOpenNewAppointment,
  onSelectAppointment,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayStr = toISODateString(new Date());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [m, appts] = await Promise.all([
        api.getDashboardMetrics(barbershop.id, todayStr),
        api.listAppointmentsByDate(barbershop.id, todayStr),
      ]);
      setMetrics(m);
      setTodayAppointments(appts);
    } catch (e) {
      console.error('Error loading dashboard metrics', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [barbershop.id]);

  const handleQuickStatusChange = async (
    e: React.MouseEvent,
    apptId: string,
    newStatus: AppointmentStatus
  ) => {
    e.stopPropagation();
    try {
      await api.updateAppointmentStatus(apptId, newStatus);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/agendar/${barbershop.slug}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado para a área de transferência!');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const pendingAppointments = todayAppointments.filter((a) => a.status === 'pending');

  return (
    <div className="space-y-6 text-left">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F1EC]">
            Hoje, {formatDateLongBR(new Date())}
          </h1>
          <p className="text-xs sm:text-sm text-[#A6A9AE]">
            Visão operacional e movimentação da {barbershop.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyPublicLink}
            leftIcon={<Share2 className="w-4 h-4" />}
            className="text-xs"
          >
            Compartilhar Link
          </Button>
          <Button
            size="sm"
            onClick={onOpenNewAppointment}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs"
          >
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* QUESTION 2 (Section 3.5): PENDÊNCIAS QUE PRECISAM DE ATENÇÃO */}
      {pendingAppointments.length > 0 && (
        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#F59E0B] font-semibold text-sm mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {pendingAppointments.length}{' '}
              {pendingAppointments.length === 1
                ? 'agendamento aguardando confirmação'
                : 'agendamentos aguardando confirmação'}
            </span>
          </div>
          <p className="text-xs text-[#F3F1EC]/80 mb-3">
            Clientes que solicitaram horários e aguardam sua aprovação:
          </p>
          <div className="space-y-2">
            {pendingAppointments.map((appt) => (
              <div
                key={appt.id}
                onClick={() => onSelectAppointment(appt)}
                className="bg-[#14171B] border border-[#2B3036] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:border-[#D6B875]/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#F3F1EC]">
                      {appt.customer?.name || 'Cliente'}
                    </span>
                    <span className="text-xs text-[#D6B875] font-mono">
                      {formatTimeBR(appt.starts_at)} - {formatTimeBR(appt.ends_at)}
                    </span>
                  </div>
                  <div className="text-xs text-[#A6A9AE] mt-0.5">
                    {appt.service_name_snapshot} com {appt.barber?.name || 'Barbeiro'} •{' '}
                    {formatBRL(appt.price_cents_snapshot)}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => handleQuickStatusChange(e, appt.id, 'confirmed')}
                    className="text-xs py-1 px-2.5 min-h-[36px]"
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={(e) => handleQuickStatusChange(e, appt.id, 'cancelled')}
                    className="text-xs py-1 px-2.5 min-h-[36px]"
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUESTION 3 (Section 3.5): COMO ESTÁ A MOVIMENTAÇÃO DE HOJE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Atendimentos Hoje */}
        <Card className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-[#A6A9AE] text-xs font-medium">
            <span>Atendimentos Hoje</span>
            <Calendar className="w-4 h-4 text-[#D6B875]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#F3F1EC] mt-2">
            {metrics?.total_today || 0}
          </div>
          <div className="text-[11px] text-[#A6A9AE] mt-1">
            {metrics?.confirmed || 0} confirmados • {metrics?.completed || 0} concluídos
          </div>
        </Card>

        {/* Em Atendimento */}
        <Card className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-[#A6A9AE] text-xs font-medium">
            <span>Na Cadeira Agora</span>
            <PlayCircle className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#38BDF8] mt-2">
            {metrics?.in_progress || 0}
          </div>
          <div className="text-[11px] text-[#A6A9AE] mt-1">
            {metrics?.pending || 0} pendentes de aprovação
          </div>
        </Card>

        {/* Concluídos */}
        <Card className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-[#A6A9AE] text-xs font-medium">
            <span>Finalizados</span>
            <CheckCircle className="w-4 h-4 text-[#22C55E]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#22C55E] mt-2">
            {metrics?.completed || 0}
          </div>
          <div className="text-[11px] text-[#A6A9AE] mt-1">
            {metrics?.cancelled || 0} cancelados
          </div>
        </Card>

        {/* Estimativa de Faturamento */}
        <Card className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-[#A6A9AE] text-xs font-medium">
            <span>Movimentação Estimada</span>
            <TrendingUp className="w-4 h-4 text-[#D6B875]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#D6B875] mt-2">
            {formatBRL(metrics?.estimated_revenue_cents || 0)}
          </div>
          <div className="text-[11px] text-[#A6A9AE] mt-1 truncate" title="Soma dos serviços confirmados e realizados hoje">
            Serviços confirmados e realizados
          </div>
        </Card>
      </div>

      {/* QUESTION 1 (Section 3.5): QUAIS SÃO OS PRÓXIMOS ATENDIMENTOS DE HOJE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[#F3F1EC] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D6B875]" />
            Cronograma do Dia
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onNavigateTab('agenda')}
            className="text-xs"
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Ver Agenda Completa
          </Button>
        </div>

        {todayAppointments.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-6 h-6" />}
            title="Nenhum agendamento para hoje"
            description="Sua agenda está livre hoje. Crie um agendamento manual ou compartilhe o link público com seus clientes."
            action={
              <Button size="sm" onClick={onOpenNewAppointment} leftIcon={<Plus className="w-4 h-4" />}>
                Novo Agendamento
              </Button>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {todayAppointments.map((appt) => (
              <div
                key={appt.id}
                onClick={() => onSelectAppointment(appt)}
                className="bg-[#14171B] border border-[#2B3036] hover:border-[#D6B875]/40 p-3.5 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Time & Client info */}
                <div className="flex items-start gap-3">
                  <div className="w-14 sm:w-16 text-center py-1.5 px-2 bg-[#1B1F24] border border-[#2B3036] rounded-lg shrink-0">
                    <div className="font-bold text-sm text-[#F3F1EC] leading-none">
                      {formatTimeBR(appt.starts_at)}
                    </div>
                    <div className="text-[10px] text-[#A6A9AE] mt-1 leading-none">
                      {formatTimeBR(appt.ends_at)}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#F3F1EC]">
                        {appt.customer?.name || 'Cliente'}
                      </span>
                      <StatusBadge status={appt.status} size="sm" />
                    </div>
                    <div className="text-xs text-[#A6A9AE] flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-[#D6B875]" />
                        {appt.service_name_snapshot}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {appt.barber?.name || 'Barbeiro'}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-[#F3F1EC]">
                        {formatBRL(appt.price_cents_snapshot)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operational Quick Actions (Section 7.2) */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  {appt.status === 'confirmed' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => handleQuickStatusChange(e, appt.id, 'in_progress')}
                      className="text-xs py-1 px-2.5 min-h-[36px]"
                    >
                      Iniciar
                    </Button>
                  )}
                  {appt.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => handleQuickStatusChange(e, appt.id, 'completed')}
                      className="text-xs py-1 px-2.5 min-h-[36px]"
                    >
                      Concluir
                    </Button>
                  )}
                  {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleQuickStatusChange(e, appt.id, 'cancelled')}
                      className="text-xs py-1 px-2 min-h-[36px] text-[#EF4444] hover:bg-[#EF4444]/15"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
