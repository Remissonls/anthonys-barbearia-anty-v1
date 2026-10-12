import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FeedbackAlert } from '../../components/ui/FeedbackAlert';
import { Barbershop, Barber, Service, Customer } from '../../types';
import { api } from '../../services';
import { formatBRL } from '../../utils/currency';
import { formatPhoneBR, normalizePhoneBR } from '../../utils/phone';
import { toISODateString, combineDateAndTime } from '../../utils/date';

interface ManualAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  barbershop: Barbershop;
  onSuccess: () => void;
  initialDate?: string;
}

export const ManualAppointmentModal: React.FC<ManualAppointmentModalProps> = ({
  isOpen,
  onClose,
  barbershop,
  onSuccess,
  initialDate,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [date, setDate] = useState(initialDate || toISODateString(new Date()));
  const [time, setTime] = useState('09:00');

  // Customer selection or new customer
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    const loadData = async () => {
      try {
        const [srvs, brbs, custs] = await Promise.all([
          api.listServices(barbershop.id),
          api.listBarbers(barbershop.id),
          api.listCustomers(barbershop.id),
        ]);
        setServices(srvs);
        setBarbers(brbs);
        setCustomers(custs);

        if (srvs.length > 0) setSelectedServiceId(srvs[0].id);
        if (brbs.length > 0) setSelectedBarberId(brbs[0].id);
        if (custs.length > 0) {
          setSelectedCustomerId(custs[0].id);
          setCustomerMode('existing');
        } else {
          setCustomerMode('new');
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadData();
  }, [isOpen, barbershop.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!selectedServiceId) throw new Error('Selecione um serviço.');
      if (!selectedBarberId) throw new Error('Selecione um profissional.');

      const targetDate = new Date(`${date}T00:00:00`);
      const startsAt = combineDateAndTime(targetDate, time).toISOString();

      let result;
      if (customerMode === 'existing') {
        if (!selectedCustomerId) throw new Error('Selecione um cliente cadastrado.');
        result = await api.createManualAppointment({
          barbershop_id: barbershop.id,
          barber_id: selectedBarberId,
          service_id: selectedServiceId,
          customer_id: selectedCustomerId,
          starts_at: startsAt,
        });
      } else {
        if (!newCustomerName.trim()) throw new Error('Informe o nome do cliente.');
        if (normalizePhoneBR(newCustomerPhone).length < 10) {
          throw new Error('Informe um telefone válido para o cliente.');
        }
        result = await api.createManualAppointment({
          barbershop_id: barbershop.id,
          barber_id: selectedBarberId,
          service_id: selectedServiceId,
          customer_name: newCustomerName.trim(),
          customer_phone: newCustomerPhone,
          starts_at: startsAt,
        });
      }

      if (!result.success) {
        setError(result.message || 'Falha ao agendar horário.');
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Agendamento Manual"
      description="Reserve um horário na agenda pelo painel do proprietário."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FeedbackAlert type="error" message={error} />}

        {/* Customer Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#A6A9AE]">Cliente</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCustomerMode('existing')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  customerMode === 'existing'
                    ? 'bg-[#D6B875] text-[#0B0D0F] font-semibold'
                    : 'text-[#A6A9AE] hover:text-[#F3F1EC]'
                }`}
              >
                Cadastrado
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode('new')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  customerMode === 'new'
                    ? 'bg-[#D6B875] text-[#0B0D0F] font-semibold'
                    : 'text-[#A6A9AE] hover:text-[#F3F1EC]'
                }`}
              >
                + Novo Cliente
              </button>
            </div>
          </div>

          {customerMode === 'existing' ? (
            customers.length > 0 ? (
              <Select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                options={customers.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${formatPhoneBR(c.phone_normalized)})`,
                }))}
              />
            ) : (
              <p className="text-xs text-[#A6A9AE]">
                Nenhum cliente cadastrado. Use a opção "+ Novo Cliente" ao lado.
              </p>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder="Nome do Cliente"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                required
              />
              <Input
                placeholder="WhatsApp / Telefone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(formatPhoneBR(e.target.value))}
                required
              />
            </div>
          )}
        </div>

        {/* Service & Barber Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Serviço"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            options={services.map((s) => ({
              value: s.id,
              label: `${s.name} (${formatBRL(s.price_cents)})`,
            }))}
          />

          <Select
            label="Profissional"
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            options={barbers.map((b) => ({
              value: b.id,
              label: b.name,
            }))}
          />
        </div>

        {/* Date and Time Selection */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <Input
            label="Horário de Início"
            type="time"
            step="900" // 15-minute intervals
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        {selectedService && (
          <div className="p-3 bg-[#1B1F24] rounded-lg border border-[#2B3036] text-xs text-[#A6A9AE] flex justify-between items-center">
            <span>Duração estimada: {selectedService.duration_minutes} min</span>
            <span className="font-bold text-[#D6B875]">
              Total: {formatBRL(selectedService.price_cents)}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[#2B3036]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Confirmar Reserva
          </Button>
        </div>
      </form>
    </Modal>
  );
};
