import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { FeedbackAlert } from '../../components/ui/FeedbackAlert';
import {
  Barbershop,
  Barber,
  Service,
  AvailabilitySlot,
  Appointment,
} from '../../types';
import { api } from '../../services';
import { formatBRL } from '../../utils/currency';
import { formatPhoneBR, normalizePhoneBR } from '../../utils/phone';
import {
  formatDateBR,
  formatDateLongBR,
  formatTimeBR,
  formatDuration,
  toISODateString,
  DAYS_OF_WEEK_SHORT,
  parseISODateString,
} from '../../utils/date';
import {
  Scissors,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Store,
  MapPin,
  Sparkles,
  Share2,
  AlertCircle,
} from 'lucide-react';

interface PublicBookingViewProps {
  slug: string;
}

export const PublicBookingView: React.FC<PublicBookingViewProps> = ({ slug }) => {
  const [shop, setShop] = useState<Barbershop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoadingShop, setIsLoadingShop] = useState(true);
  const [shopError, setShopError] = useState<string | null>(null);

  // Booking Flow Steps: 1..7
  const [step, setStep] = useState<number>(1);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null); // null = "Qualquer profissional"
  const [selectedDate, setSelectedDate] = useState<string>(toISODateString(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  // Customer contact info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot

  // Available slots state
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<Appointment | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Load public barbershop data
  useEffect(() => {
    const fetchShop = async () => {
      setIsLoadingShop(true);
      try {
        const barbershop = await api.getPublicBarbershop(slug);
        if (!barbershop) {
          setShopError('Barbearia não encontrada ou temporariamente desativada.');
          return;
        }
        setShop(barbershop);

        const [srvs, brbs] = await Promise.all([
          api.listServices(barbershop.id, false),
          api.listBarbers(barbershop.id, false),
        ]);
        setServices(srvs);
        setBarbers(brbs);
      } catch (e: any) {
        setShopError(e.message || 'Erro ao carregar dados da barbearia.');
      } finally {
        setIsLoadingShop(false);
      }
    };

    fetchShop();
  }, [slug]);

  // Load available slots whenever date, service, or barber selection changes
  useEffect(() => {
    if (!shop || !selectedService || !selectedDate) return;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const slots = await api.getPublicAvailableSlots(
          shop.id,
          selectedService.id,
          selectedBarberId,
          selectedDate
        );
        setAvailableSlots(slots);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [shop, selectedService, selectedBarberId, selectedDate]);

  // Generate next 14 days list for the date selector
  const generateNextDays = () => {
    const days: { dateStr: string; dayNum: number; weekDayShort: string }[] = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push({
        dateStr: toISODateString(d),
        dayNum: d.getDate(),
        weekDayShort: DAYS_OF_WEEK_SHORT[d.getDay()],
      });
    }
    return days;
  };

  const nextDays = generateNextDays();

  // Final booking submission
  const handleConfirmBooking = async () => {
    if (!shop || !selectedService || !selectedSlot) return;
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await api.bookPublicAppointment({
        barbershop_id: shop.id,
        service_id: selectedService.id,
        barber_id: selectedBarberId,
        starts_at: selectedSlot.starts_at,
        customer_name: customerName.trim(),
        customer_phone: customerPhone,
        honeypot,
      });

      if (!result.success) {
        setSubmissionError(result.message || 'Falha ao concluir agendamento.');
        // If slot conflict, return to step 4 to choose a new slot
        if (result.code === 'SLOT_CONFLICT') {
          setStep(4);
          setSelectedSlot(null);
        }
        setIsSubmitting(false);
        return;
      }

      setBookingResult(result.appointment || null);
      setStep(7); // Success confirmation step
    } catch (err: any) {
      setSubmissionError(err.message || 'Erro inesperado ao registrar o agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingShop) {
    return (
      <div className="min-h-screen bg-[#0B0D0F] text-[#F3F1EC] p-4 flex flex-col items-center justify-center">
        <Skeleton className="w-48 h-8 mb-4" />
        <Skeleton className="w-full max-w-md h-64" />
      </div>
    );
  }

  if (shopError || !shop) {
    return (
      <div className="min-h-screen bg-[#0B0D0F] text-[#F3F1EC] p-4 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-[#EF4444]/15 text-[#EF4444] rounded-full mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2">Barbearia Não Encontrada</h1>
        <p className="text-sm text-[#A6A9AE] max-w-sm mb-6">
          {shopError || 'O link informado não corresponde a nenhuma barbearia ativa no AgendaPro.'}
        </p>
        <a
          href="/"
          className="text-xs text-[#D6B875] font-semibold underline hover:text-[#E5C885]"
        >
          Voltar para a página inicial
        </a>
      </div>
    );
  }

  const eligibleBarbers = barbers.filter(
    (b) => !selectedService || (b.service_ids && b.service_ids.includes(selectedService.id))
  );

  const selectedBarberObj = barbers.find((b) => b.id === selectedBarberId);

  return (
    <div className="min-h-screen bg-[#0B0D0F] text-[#F3F1EC] flex flex-col items-center p-3.5 sm:p-6 text-left">
      {/* Brand & Shop Header */}
      <header className="w-full max-w-lg mb-4 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-[#D6B875]/15 text-[#D6B875] border border-[#D6B875]/30">
            <Store className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-[#F3F1EC]">{shop.name}</span>
        </div>
        {shop.address && (
          <p className="text-xs text-[#A6A9AE] flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#D6B875]" />
            {shop.address}
          </p>
        )}
      </header>

      {/* Booking Wizard Card */}
      <Card className="w-full max-w-lg p-4 sm:p-6 bg-[#14171B] border-[#2B3036] shadow-2xl relative">
        {/* Step Progress Indicator (1..6) */}
        {step < 7 && (
          <div className="mb-5 pb-3 border-b border-[#2B3036]/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-[#D6B875]">
              Etapa {step} de 6 —{' '}
              {step === 1 && 'Escolha o Serviço'}
              {step === 2 && 'Escolha o Profissional'}
              {step === 3 && 'Escolha o Dia'}
              {step === 4 && 'Escolha o Horário'}
              {step === 5 && 'Seus Dados'}
              {step === 6 && 'Confirmar Agendamento'}
            </span>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="text-xs text-[#A6A9AE] hover:text-[#F3F1EC] flex items-center gap-1 touch-target"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Voltar
              </button>
            )}
          </div>
        )}

        {submissionError && (
          <FeedbackAlert
            type="error"
            message={submissionError}
            className="mb-4"
            onDismiss={() => setSubmissionError(null)}
          />
        )}

        {/* ---------------------------------------------------- */}
        {/* ETAPA 1 — SELEÇÃO DE SERVIÇO */}
        {/* ---------------------------------------------------- */}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#F3F1EC] mb-2">
              Selecione o serviço desejado:
            </h2>
            <div className="space-y-2.5">
              {services.map((srv) => {
                const isSelected = selectedService?.id === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => {
                      setSelectedService(srv);
                      setStep(2);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#D6B875]/15 border-[#D6B875] shadow-xs'
                        : 'bg-[#1B1F24] border-[#2B3036] hover:border-[#D6B875]/40'
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold text-sm text-[#F3F1EC]">{srv.name}</h3>
                      {srv.description && (
                        <p className="text-xs text-[#A6A9AE] mt-0.5 line-clamp-1">
                          {srv.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-[#A6A9AE] mt-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D6B875]" />
                        <span>{formatDuration(srv.duration_minutes)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-bold text-[#D6B875]">
                        {formatBRL(srv.price_cents)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ETAPA 2 — SELEÇÃO DE PROFISSIONAL */}
        {/* ---------------------------------------------------- */}
        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#F3F1EC] mb-2">
              Com quem você gostaria de ser atendido?
            </h2>

            {/* Option: Any available barber */}
            <div
              onClick={() => {
                setSelectedBarberId(null);
                setStep(3);
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                selectedBarberId === null
                  ? 'bg-[#D6B875]/15 border-[#D6B875]'
                  : 'bg-[#1B1F24] border-[#2B3036] hover:border-[#D6B875]/40'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#0B0D0F] border border-[#2B3036] flex items-center justify-center text-[#D6B875]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-[#F3F1EC]">
                  Qualquer profissional disponível
                </div>
                <div className="text-xs text-[#A6A9AE]">
                  Maior quantidade de horários livres para você
                </div>
              </div>
            </div>

            {/* Specific barbers */}
            <div className="space-y-2 pt-1">
              {eligibleBarbers.map((b) => {
                const isSelected = selectedBarberId === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBarberId(b.id);
                      setStep(3);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-[#D6B875]/15 border-[#D6B875]'
                        : 'bg-[#1B1F24] border-[#2B3036] hover:border-[#D6B875]/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0B0D0F] border border-[#2B3036] flex items-center justify-center text-[#D6B875] font-bold overflow-hidden shrink-0">
                      {b.photo_url ? (
                        <img src={b.photo_url} alt={b.name} className="w-full h-full object-cover" />
                      ) : (
                        b.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-[#F3F1EC]">{b.name}</div>
                      {b.description && (
                        <div className="text-xs text-[#A6A9AE] line-clamp-1">{b.description}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ETAPA 3 — SELEÇÃO DE DATA */}
        {/* ---------------------------------------------------- */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#F3F1EC]">Escolha a data do agendamento:</h2>

            {/* Quick 14-day touch strip */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {nextDays.map((d) => {
                const isSelected = selectedDate === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d.dateStr);
                      setStep(4);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center min-h-[58px] transition-all ${
                      isSelected
                        ? 'bg-[#D6B875] border-[#D6B875] text-[#0B0D0F] font-bold'
                        : 'bg-[#1B1F24] border-[#2B3036] text-[#F3F1EC] hover:border-[#D6B875]/40'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-medium">{d.weekDayShort}</span>
                    <span className="text-base font-bold mt-0.5">{d.dayNum}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs text-[#A6A9AE] mb-1">Ou escolha outra data:</label>
              <input
                type="date"
                min={toISODateString(new Date())}
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setStep(4);
                  }
                }}
                className="w-full bg-[#1B1F24] text-[#F3F1EC] border border-[#2B3036] rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ETAPA 4 — SELEÇÃO DE HORÁRIO */}
        {/* ---------------------------------------------------- */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#F3F1EC]">Horários Disponíveis</h2>
                <p className="text-xs text-[#D6B875]">
                  {formatDateLongBR(selectedDate)}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setStep(3)} className="text-xs">
                Mudar dia
              </Button>
            </div>

            {isLoadingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="p-6 text-center bg-[#1B1F24] border border-[#2B3036] rounded-xl space-y-2">
                <Clock className="w-8 h-8 text-[#A6A9AE] mx-auto" />
                <h3 className="text-sm font-semibold text-[#F3F1EC]">Nenhum horário disponível</h3>
                <p className="text-xs text-[#A6A9AE] max-w-xs mx-auto">
                  Todos os horários deste dia estão ocupados ou a barbearia está fechada. Por favor, selecione outra data.
                </p>
                <Button size="sm" variant="secondary" onClick={() => setStep(3)} className="mt-2">
                  Escolher Outro Dia
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-1">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.time === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep(5);
                      }}
                      className={`p-2.5 rounded-xl border text-center font-mono font-bold text-sm min-h-[44px] transition-all touch-target ${
                        isSelected
                          ? 'bg-[#D6B875] border-[#D6B875] text-[#0B0D0F]'
                          : 'bg-[#1B1F24] border-[#2B3036] text-[#F3F1EC] hover:border-[#D6B875]'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ETAPA 5 — DADOS DO CLIENTE */}
        {/* ---------------------------------------------------- */}
        {step === 5 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!customerName.trim() || normalizePhoneBR(customerPhone).length < 10) {
                setSubmissionError('Preencha seu nome e um telefone válido com DDD.');
                return;
              }
              setSubmissionError(null);
              setStep(6);
            }}
            className="space-y-4"
          >
            <h2 className="text-base font-bold text-[#F3F1EC]">Informe seus dados de contato:</h2>
            <p className="text-xs text-[#A6A9AE]">
              Sem necessidade de cadastro ou senha. Usamos apenas para identificar e confirmar sua reserva.
            </p>

            <Input
              label="Seu Nome Completo"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ex: Gabriel Ramos"
              leftIcon={<User className="w-4 h-4 text-[#D6B875]" />}
            />

            <Input
              label="WhatsApp / Celular"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(formatPhoneBR(e.target.value))}
              placeholder="(82) 99888-7777"
              leftIcon={<Phone className="w-4 h-4 text-[#D6B875]" />}
              helperText="Informe o DDD + número para receber atualizações do agendamento."
            />

            {/* Honeypot hidden input against bots (Section 14.7) */}
            <input
              type="text"
              name="honeypot"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="flex gap-2 pt-3">
              <Button type="button" variant="secondary" onClick={() => setStep(4)} className="w-1/3">
                Voltar
              </Button>
              <Button type="submit" className="w-2/3">
                Revisar Agendamento
              </Button>
            </div>
          </form>
        )}

        {/* ---------------------------------------------------- */}
        {/* ETAPA 6 — REVISÃO E CONFIRMAÇÃO */}
        {/* ---------------------------------------------------- */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#F3F1EC]">Revise os dados da reserva:</h2>

            <div className="p-4 bg-[#1B1F24] rounded-xl border border-[#2B3036] space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#2B3036]/60">
                <span className="text-[#A6A9AE]">Barbearia</span>
                <span className="font-semibold text-sm text-[#F3F1EC]">{shop.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#A6A9AE]">Serviço</span>
                <span className="font-medium text-[#F3F1EC]">{selectedService?.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#A6A9AE]">Profissional</span>
                <span className="font-medium text-[#F3F1EC]">
                  {selectedBarberObj ? selectedBarberObj.name : 'Qualquer profissional'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#A6A9AE]">Data</span>
                <span className="font-medium text-[#F3F1EC]">{formatDateBR(selectedDate)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#A6A9AE]">Horário</span>
                <span className="font-mono font-bold text-sm text-[#D6B875]">
                  {selectedSlot?.time}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#A6A9AE]">Cliente</span>
                <span className="font-medium text-[#F3F1EC]">
                  {customerName} ({customerPhone})
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#2B3036]/60">
                <span className="text-sm font-semibold text-[#F3F1EC]">Valor Total</span>
                <span className="text-base font-bold text-[#D6B875]">
                  {formatBRL(selectedService?.price_cents)}
                </span>
              </div>
            </div>

            {shop.booking_confirmation_mode === 'manual' ? (
              <p className="text-[11px] text-[#A6A9AE]">
                * Esta barbearia opera com aprovação manual. Seu agendamento ficará reservado aguardando confirmação.
              </p>
            ) : (
              <p className="text-[11px] text-[#A6A9AE]">
                * Seu horário será confirmado automaticamente ao clicar no botão abaixo.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(5)}
                disabled={isSubmitting}
                className="w-1/3"
              >
                Alterar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmBooking}
                isLoading={isSubmitting}
                className="w-2/3"
              >
                Confirmar Reserva
              </Button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ETAPA 7 — SUCESSO CONFIRMADO */}
        {/* ---------------------------------------------------- */}
        {step === 7 && bookingResult && (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#F3F1EC]">
                {bookingResult.status === 'confirmed'
                  ? 'Agendamento Confirmado!'
                  : 'Reserva Solicitada com Sucesso!'}
              </h2>
              <p className="text-xs text-[#A6A9AE] mt-1 max-w-sm mx-auto">
                {bookingResult.status === 'confirmed'
                  ? 'Seu horário está reservado com exclusividade na barbearia.'
                  : 'Sua solicitação foi enviada para o proprietário e logo será confirmada.'}
              </p>
            </div>

            {/* Public code badge */}
            <div className="p-3 bg-[#1B1F24] rounded-xl border border-[#D6B875]/30 inline-block text-left w-full max-w-xs mx-auto">
              <div className="text-[10px] text-[#A6A9AE] uppercase tracking-wider text-center">
                Código da Reserva
              </div>
              <div className="text-lg font-mono font-bold text-[#D6B875] text-center tracking-widest mt-0.5">
                {bookingResult.public_code}
              </div>
            </div>

            {/* Summary details */}
            <div className="p-3.5 bg-[#14171B] rounded-xl border border-[#2B3036] text-xs text-left space-y-1.5 max-w-xs mx-auto">
              <div className="flex justify-between">
                <span className="text-[#A6A9AE]">Data:</span>
                <span className="font-semibold text-[#F3F1EC]">
                  {formatDateBR(bookingResult.starts_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A6A9AE]">Horário:</span>
                <span className="font-mono font-bold text-[#D6B875]">
                  {formatTimeBR(bookingResult.starts_at)} - {formatTimeBR(bookingResult.ends_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A6A9AE]">Serviço:</span>
                <span className="font-medium text-[#F3F1EC]">
                  {bookingResult.service_name_snapshot}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#2B3036]/60">
                <span className="text-[#A6A9AE]">Valor:</span>
                <span className="font-bold text-[#D6B875]">
                  {formatBRL(bookingResult.price_cents_snapshot)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep(1);
                setSelectedService(null);
                setSelectedSlot(null);
                setBookingResult(null);
              }}
              className="w-full text-xs"
            >
              Fazer Outro Agendamento
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
