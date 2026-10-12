import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Appointment, AppointmentStatus } from '../../types';
import { api } from '../../services';
import { formatTimeBR, formatDateBR } from '../../utils/date';
import { formatBRL } from '../../utils/currency';
import { formatPhoneBR } from '../../utils/phone';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  DollarSign,
  Phone,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!appointment) return null;

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    setIsLoading(true);
    try {
      await api.updateAppointmentStatus(appointment.id, newStatus);
      onUpdated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await api.cancelAppointment(appointment.id);
      onUpdated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const phone = appointment.customer?.phone_normalized || '';
  const waUrl = phone ? `https://wa.me/55${phone}` : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes do Atendimento"
      description={`Código da Reserva: ${appointment.public_code}`}
    >
      <div className="space-y-4">
        {/* Status banner */}
        <div className="flex items-center justify-between p-3 bg-[#1B1F24] rounded-lg border border-[#2B3036]">
          <span className="text-xs text-[#A6A9AE]">Status atual</span>
          <StatusBadge status={appointment.status} />
        </div>

        {/* Client details */}
        <div className="p-3 bg-[#14171B] rounded-lg border border-[#2B3036] space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#F3F1EC]">
            <User className="w-4 h-4 text-[#D6B875]" />
            <span>{appointment.customer?.name || 'Cliente'}</span>
          </div>
          {phone && (
            <div className="flex items-center justify-between text-xs text-[#A6A9AE] pt-1 border-t border-[#2B3036]/50">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {formatPhoneBR(phone)}
              </span>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#22C55E] hover:underline flex items-center gap-1 font-medium"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* Appointment Time & Service */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#1B1F24] rounded-lg border border-[#2B3036] space-y-1">
            <div className="text-[#A6A9AE] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#D6B875]" />
              Data
            </div>
            <div className="font-semibold text-sm text-[#F3F1EC]">
              {formatDateBR(appointment.starts_at)}
            </div>
          </div>

          <div className="p-3 bg-[#1B1F24] rounded-lg border border-[#2B3036] space-y-1">
            <div className="text-[#A6A9AE] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#D6B875]" />
              Horário
            </div>
            <div className="font-semibold text-sm text-[#F3F1EC]">
              {formatTimeBR(appointment.starts_at)} - {formatTimeBR(appointment.ends_at)}
            </div>
          </div>
        </div>

        {/* Service snapshot details */}
        <div className="p-3 bg-[#1B1F24] rounded-lg border border-[#2B3036] space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#A6A9AE] flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5 text-[#D6B875]" />
              Serviço
            </span>
            <span className="font-medium text-[#F3F1EC]">
              {appointment.service_name_snapshot}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#A6A9AE] flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Barbeiro
            </span>
            <span className="font-medium text-[#F3F1EC]">
              {appointment.barber?.name || 'Não especificado'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-[#2B3036]/50">
            <span className="text-[#A6A9AE] flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[#D6B875]" />
              Preço Registrado
            </span>
            <span className="font-bold text-sm text-[#D6B875]">
              {formatBRL(appointment.price_cents_snapshot)}
            </span>
          </div>
        </div>

        {/* Actions / Status Transitions */}
        <div className="pt-2 border-t border-[#2B3036] space-y-2">
          <div className="text-xs font-medium text-[#A6A9AE]">Alterar status:</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {appointment.status === 'pending' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleStatusChange('confirmed')}
                isLoading={isLoading}
              >
                Confirmar
              </Button>
            )}
            {appointment.status === 'confirmed' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleStatusChange('in_progress')}
                isLoading={isLoading}
              >
                Iniciar Atendimento
              </Button>
            )}
            {appointment.status === 'in_progress' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleStatusChange('completed')}
                isLoading={isLoading}
              >
                Concluir Atendimento
              </Button>
            )}
            {appointment.status !== 'completed' && appointment.status !== 'no_show' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('no_show')}
                isLoading={isLoading}
              >
                Não compareceu
              </Button>
            )}
          </div>

          {/* Cancellation section */}
          {appointment.status !== 'cancelled' && (
            <div className="pt-3 border-t border-[#2B3036]/60">
              {confirmCancel ? (
                <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg text-xs space-y-2">
                  <div className="text-[#EF4444] font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Confirmar cancelamento do agendamento?
                  </div>
                  <p className="text-[#F3F1EC]/80">
                    O horário será liberado imediatamente para novas reservas.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handleCancel}
                      isLoading={isLoading}
                      className="w-1/2"
                    >
                      Sim, Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setConfirmCancel(false)}
                      className="w-1/2"
                    >
                      Voltar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="danger"
                  className="w-full text-xs"
                  onClick={() => setConfirmCancel(true)}
                >
                  Cancelar este agendamento
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
