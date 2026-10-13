import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
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
import { getInitialDemoState } from '../../services/demoData';
import { formatBRL } from '../../utils/currency';
import { formatPhoneBR, normalizePhoneBR } from '../../utils/phone';
import {
  formatDateBR,
  formatDateLongBR,
  formatTimeBR,
  formatDuration,
  toISODateString,
  DAYS_OF_WEEK_SHORT,
} from '../../utils/date';
import { AnthonysLogo } from '../../components/brand/AnthonysLogo';
import { ServiceIcon } from '../../components/brand/ServiceIcons';
import {
  Scissors,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  MessageCircle,
  CalendarPlus,
  ShieldCheck,
  ArrowRight,
  Shield,
  Crown,
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

  // Modern Fluid Steps:
  // 1: Tabela de Preços/Serviço | 2: Barbeiro | 3: Data & Horário | 4: Dados & Confirmar | 5: Voucher Sucesso
  const [step, setStep] = useState<number>(1);

  // User selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(toISODateString(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  // Customer contact info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Available slots state
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<Appointment | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Date strip scroll ref
  const dateStripRef = useRef<HTMLDivElement>(null);

  // Load public barbershop data
  useEffect(() => {
    const fetchShop = async () => {
      setIsLoadingShop(true);
      try {
        const barbershop = await api.getPublicBarbershop(slug);
        const activeShop = barbershop || getInitialDemoState().barbershop;
        setShop(activeShop);

        const [srvs, brbs] = await Promise.all([
          api.listServices(activeShop.id, false),
          api.listBarbers(activeShop.id, false),
        ]);
        setServices(srvs && srvs.length > 0 ? srvs : getInitialDemoState().services);
        setBarbers(brbs && brbs.length > 0 ? brbs : getInitialDemoState().barbers);
      } catch (e: any) {
        console.warn('Fallback loading Anthony\'s Barbearia demo state:', e);
        const fallback = getInitialDemoState();
        setShop(fallback.barbershop);
        setServices(fallback.services);
        setBarbers(fallback.barbers);
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
        if (selectedSlot && !slots.some((s) => s.time === selectedSlot.time)) {
          setSelectedSlot(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [shop, selectedService, selectedBarberId, selectedDate]);

  // Generate next 14 days list for horizontal date strip
  const nextDays = useMemo(() => {
    const days: { dateStr: string; dayNum: number; weekDayShort: string; isToday: boolean; isTomorrow: boolean }[] = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push({
        dateStr: toISODateString(d),
        dayNum: d.getDate(),
        weekDayShort: DAYS_OF_WEEK_SHORT[d.getDay()],
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }
    return days;
  }, []);

  // Filter barbers eligible for the selected service
  const eligibleBarbers = useMemo(() => {
    return barbers.filter(
      (b) => !selectedService || (b.service_ids && b.service_ids.includes(selectedService.id))
    );
  }, [barbers, selectedService]);

  const selectedBarberObj = barbers.find((b) => b.id === selectedBarberId);

  // Group slots by period: Manhã (<12:00), Tarde (12:00-17:59), Noite (>=18:00)
  const groupedSlots = useMemo(() => {
    const morning: AvailabilitySlot[] = [];
    const afternoon: AvailabilitySlot[] = [];
    const night: AvailabilitySlot[] = [];

    availableSlots.forEach((slot) => {
      const hour = parseInt(slot.time.split(':')[0], 10);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 18) {
        afternoon.push(slot);
      } else {
        night.push(slot);
      }
    });

    return { morning, afternoon, night };
  }, [availableSlots]);

  // Slot selection with instant feedback and smooth advance
  const handleSelectSlot = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setTimeout(() => {
      setStep(4);
    }, 180);
  };

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
        if (result.code === 'SLOT_CONFLICT') {
          setStep(3);
          setSelectedSlot(null);
        }
        setIsSubmitting(false);
        return;
      }

      setBookingResult(result.appointment || null);
      setStep(5);
    } catch (err: any) {
      setSubmissionError(err.message || 'Erro inesperado ao registrar o agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // WhatsApp click handler
  const handleSendToWhatsApp = () => {
    if (!shop || !bookingResult) return;
    const phone = shop.whatsapp || shop.phone;
    const cleanPhone = phone.replace(/\D/g, '');
    const dateFormatted = formatDateBR(bookingResult.starts_at);
    const timeFormatted = formatTimeBR(bookingResult.starts_at);
    const text = encodeURIComponent(
      `Olá! Acabei de agendar na *Anthony's Barbearia*:\n` +
      `✂️ *Serviço:* ${bookingResult.service_name_snapshot}\n` +
      `📅 *Data:* ${dateFormatted} às ${timeFormatted}\n` +
      `🔑 *Código:* ${bookingResult.public_code}\n` +
      `👤 *Cliente:* ${customerName}`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    if (!bookingResult) return '#';
    const start = new Date(bookingResult.starts_at).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(bookingResult.ends_at).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(`Anthony's Barbearia - ${bookingResult.service_name_snapshot}`);
    const details = encodeURIComponent(
      `Agendamento confirmado na Anthony's Barbearia.\nCódigo: ${bookingResult.public_code}\nBarbeiro: ${bookingResult.barber_name_snapshot || 'Equipe Anthony\'s'}\nEstilo • Respeito • Autoestima`
    );
    const location = encodeURIComponent(shop?.address || "Anthony's Barbearia");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  if (isLoadingShop) {
    return (
      <div className="min-h-screen bg-[#090A0C] text-[#F3F1EC] p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-32 h-3" />
          </div>
          <Skeleton className="w-full h-10 rounded-full" />
          <Skeleton className="w-full h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (shopError || !shop) {
    return (
      <div className="min-h-screen bg-[#090A0C] text-[#F3F1EC] p-5 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-[#EF4444]/10 text-[#EF4444] rounded-2xl mb-4 border border-[#EF4444]/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2">Barbearia Não Encontrada</h1>
        <p className="text-sm text-[#8E939B] max-w-xs mb-6">
          {shopError || 'O link informado não corresponde a nenhuma barbearia ativa.'}
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

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F3F1EC] flex flex-col selection:bg-[#D6B875] selection:text-[#090A0C] relative overflow-x-hidden">
      {/* ---------------------------------------------------- */}
      {/* CORNER GOLD DIAGONAL PINSTRIPES (Inspired by flyer) */}
      {/* ---------------------------------------------------- */}
      <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none opacity-25 overflow-hidden z-0">
        <div className="w-full h-full bg-[repeating-linear-gradient(45deg,#D6B875_0,#D6B875_1px,transparent_0,transparent_9px)]" />
      </div>

      {/* ---------------------------------------------------- */}
      {/* COMPACT MOBILE-FIRST APP BAR (Sticky & Non-intrusive) */}
      {/* ---------------------------------------------------- */}
      <header className="sticky top-0 z-30 glass-header border-b border-[#1E232B]/80 px-3.5 py-2 transition-all">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {step > 1 && step < 5 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-full bg-[#181C22] border border-[#252B33] flex items-center justify-center text-[#D6B875] active-press touch-target shrink-0"
                aria-label="Voltar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#D6B875]/15 border border-[#D6B875]/40 flex items-center justify-center text-[#D6B875] shrink-0">
                <Crown className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-cinzel font-bold text-xs sm:text-sm gold-gradient-text tracking-[0.14em] truncate">
                  ANTHONY'S BARBEARIA
                </h1>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D6B875] shrink-0" />
              </div>
              <p className="text-[10px] text-[#8E939B] truncate tracking-wider uppercase font-semibold">
                Estilo • Respeito • Autoestima
              </p>
            </div>
          </div>

          {/* Step Pill */}
          {step < 5 && (
            <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#14171D] border border-[#D6B875]/30 text-[10px] font-bold text-[#D6B875] uppercase tracking-wider">
              <span>Etapa {step}/4</span>
            </div>
          )}
        </div>

        {/* 3px Slim Golden Progress Bar */}
        {step < 5 && (
          <div className="max-w-md mx-auto mt-1.5 h-[2.5px] bg-[#161A20] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D6B875] via-[#F3DB9A] to-[#D6B875] transition-all duration-300 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}
      </header>

      {/* ---------------------------------------------------- */}
      {/* MAIN CONTENT CONTAINER (Edge-to-edge mobile, max-w-md) */}
      {/* ---------------------------------------------------- */}
      <main className="flex-1 w-full max-w-md mx-auto px-3.5 pt-3 pb-24 flex flex-col relative z-10">
        {/* Error notification banner */}
        {submissionError && (
          <FeedbackAlert
            type="error"
            message={submissionError}
            className="mb-3 text-xs"
            onDismiss={() => setSubmissionError(null)}
          />
        )}

        {/* Active Breadcrumb Selection Preview (Ultra Compact) */}
        {step > 1 && step < 5 && (
          <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14171D] border border-[#242A33] text-[#D6B875] font-medium text-[11px] shrink-0 active-press hover:border-[#D6B875]/40"
            >
              <Scissors className="w-3 h-3 text-[#D6B875]" />
              <span className="truncate max-w-[110px]">{selectedService?.name}</span>
            </button>

            {step >= 3 && (
              <>
                <span className="text-[#3A404A] text-xs">›</span>
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14171D] border border-[#242A33] text-[#F3F1EC] font-medium text-[11px] shrink-0 active-press hover:border-[#D6B875]/40"
                >
                  <User className="w-3 h-3 text-[#D6B875]" />
                  <span className="truncate max-w-[110px]">
                    {selectedBarberObj ? selectedBarberObj.name : 'Qualquer profissional'}
                  </span>
                </button>
              </>
            )}

            {step >= 4 && selectedSlot && (
              <>
                <span className="text-[#3A404A] text-xs">›</span>
                <button
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14171D] border border-[#242A33] text-[#F3F1EC] font-medium text-[11px] shrink-0 active-press hover:border-[#D6B875]/40"
                >
                  <Clock className="w-3 h-3 text-[#D6B875]" />
                  <span>{selectedSlot.time}</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ETAPA 1: TABELA DE PREÇOS (Idêntica ao flyer) */}
        {/* ---------------------------------------------------- */}
        {step === 1 && (
          <div className="space-y-3 animate-fade-in-up">
            {/* Brand Crown & A Monogram Hero */}
            <div className="pt-1 pb-1">
              <AnthonysLogo size="sm" showTagline={false} />
            </div>

            {/* Brushed Gold Banner: TABELA DE PREÇOS */}
            <div className="text-center my-1">
              <div className="inline-block px-6 py-1.5 rounded-full gold-brush-banner shadow-md">
                <span className="font-cinzel text-xs font-black tracking-[0.25em] text-[#090A0C]">
                  TABELA DE PREÇOS
                </span>
              </div>
            </div>

            {/* Services List matching flyer */}
            <div className="space-y-2 pt-1">
              {services.map((srv) => {
                const isSelected = selectedService?.id === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => {
                      setSelectedService(srv);
                      setStep(2);
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 active-press ${
                      isSelected
                        ? 'bg-[#181C22] border-[#D6B875] gold-glow-subtle'
                        : 'bg-[#12151A] border-[#22272F] hover:border-[#D6B875]/50 hover:bg-[#161A20]'
                    }`}
                  >
                    {/* Circular Gold Icon */}
                    <div className="w-9 h-9 rounded-full bg-[#181C22] border border-[#D6B875]/50 flex items-center justify-center text-[#D6B875] shrink-0 shadow-inner">
                      <ServiceIcon serviceId={srv.id} serviceName={srv.name} className="w-4 h-4 text-[#D6B875]" />
                    </div>

                    {/* Service Name + Dotted Leader */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm text-[#F3F1EC] uppercase tracking-wide truncate">
                          {srv.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#8E939B]">
                          <Clock className="w-2.5 h-2.5 text-[#D6B875]" />
                          <span>{formatDuration(srv.duration_minutes)}</span>
                        </div>
                      </div>

                      {/* Dotted leader line like in flyer */}
                      <div className="flex-1 border-b border-dotted border-[#D6B875]/30 mx-1 hidden xs:block" />
                    </div>

                    {/* Brushed Gold Price Pill Badge */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      <div className="px-3 py-1 rounded-full gold-brush-tag text-xs sm:text-sm tracking-tight font-extrabold text-[#090A0C]">
                        {formatBRL(srv.price_cents)}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8E939B]" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Slogan cursivo do flyer */}
            <div className="text-center pt-3 pb-1">
              <p className="font-cursive text-xl sm:text-2xl text-[#D6B875] tracking-wide leading-tight">
                Mais que um corte, é um cuidado com você!
              </p>
            </div>

            {/* 3 Pilares / Selos do rodapé do flyer */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1E232B] text-center">
              <div className="flex flex-col items-center p-2 rounded-xl bg-[#12151A]/60 border border-[#22272F]">
                <div className="w-6 h-6 rounded-full bg-[#D6B875]/10 border border-[#D6B875]/30 flex items-center justify-center text-[#D6B875] mb-1">
                  <Shield className="w-3 h-3" />
                </div>
                <span className="text-[8px] font-bold text-[#F3F1EC] uppercase tracking-wider leading-tight">
                  ATENDIMENTO DE QUALIDADE
                </span>
              </div>

              <div className="flex flex-col items-center p-2 rounded-xl bg-[#12151A]/60 border border-[#22272F]">
                <div className="w-6 h-6 rounded-full bg-[#D6B875]/10 border border-[#D6B875]/30 flex items-center justify-center text-[#D6B875] mb-1">
                  <Clock className="w-3 h-3" />
                </div>
                <span className="text-[8px] font-bold text-[#F3F1EC] uppercase tracking-wider leading-tight">
                  SEU TEMPO É IMPORTANTE
                </span>
              </div>

              <div className="flex flex-col items-center p-2 rounded-xl bg-[#12151A]/60 border border-[#22272F]">
                <div className="w-6 h-6 rounded-full bg-[#D6B875]/10 border border-[#D6B875]/30 flex items-center justify-center text-[#D6B875] mb-1">
                  <Crown className="w-3 h-3" />
                </div>
                <span className="text-[8px] font-bold text-[#F3F1EC] uppercase tracking-wider leading-tight">
                  AQUI VOCÊ SE SENTE BEM
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ETAPA 2: SELEÇÃO DE PROFISSIONAL */}
        {/* ---------------------------------------------------- */}
        {step === 2 && (
          <div className="space-y-2.5 animate-fade-in-up">
            <div className="pb-1">
              <h2 className="text-sm font-bold text-[#F3F1EC] tracking-tight">
                Com quem deseja cortar?
              </h2>
              <p className="text-[11px] text-[#8E939B]">
                Escolha seu barbeiro de preferência ou o primeiro disponível
              </p>
            </div>

            {/* Quick Option: Qualquer Profissional */}
            <div
              onClick={() => {
                setSelectedBarberId(null);
                setStep(3);
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active-press ${
                selectedBarberId === null
                  ? 'bg-[#181C22] border-[#D6B875] gold-glow-subtle'
                  : 'bg-[#12151A] border-[#22272F] hover:border-[#D6B875]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D6B875]/20 to-[#181C22] border border-[#D6B875]/40 flex items-center justify-center text-[#D6B875] shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#F3F1EC] flex items-center gap-1.5">
                    <span>Qualquer profissional</span>
                    <span className="text-[9px] font-bold bg-[#D6B875] text-[#090A0C] px-1.5 py-0.5 rounded-full uppercase">
                      Mais Rápido
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8E939B]">
                    Maior variedade de horários livres hoje
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#474E58] shrink-0" />
            </div>

            {/* Specific Barbers List */}
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
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active-press ${
                      isSelected
                        ? 'bg-[#181C22] border-[#D6B875] gold-glow-subtle'
                        : 'bg-[#12151A] border-[#22272F] hover:border-[#D6B875]/50 hover:bg-[#161A20]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#181C22] border-2 border-[#D6B875]/50 flex items-center justify-center text-[#D6B875] font-bold overflow-hidden shrink-0">
                        {b.photo_url ? (
                          <img
                            src={b.photo_url}
                            alt={b.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          b.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[#F3F1EC] truncate">
                          {b.name}
                        </div>
                        {b.description ? (
                          <div className="text-[11px] text-[#8E939B] line-clamp-1">
                            {b.description}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#22C55E] flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                            Disponível hoje
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#474E58] shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ETAPA 3: DATA & HORÁRIO (Super Fluido em Tela Única) */}
        {/* ---------------------------------------------------- */}
        {step === 3 && (
          <div className="space-y-3.5 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#F3F1EC] tracking-tight">
                  Quando você deseja ser atendido?
                </h2>
                <p className="text-[11px] text-[#8E939B]">
                  {formatDateLongBR(selectedDate)}
                </p>
              </div>

              {/* Native calendar date picker button */}
              <label className="text-[11px] font-semibold text-[#D6B875] bg-[#181C22] border border-[#2B3036] px-2.5 py-1 rounded-xl cursor-pointer flex items-center gap-1.5 active-press">
                <Calendar className="w-3.5 h-3.5 text-[#D6B875]" />
                <span>Outro dia</span>
                <input
                  type="date"
                  min={toISODateString(new Date())}
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setSelectedSlot(null);
                    }
                  }}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Horizontal 14-Day Scrollable Strip */}
            <div
              ref={dateStripRef}
              className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-3.5 px-3.5 scroll-smooth"
            >
              {nextDays.map((d) => {
                const isSelected = selectedDate === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d.dateStr);
                      setSelectedSlot(null);
                    }}
                    className={`flex flex-col items-center justify-center min-w-[58px] py-2 px-1.5 rounded-2xl border transition-all active-press shrink-0 ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#E5C885] to-[#D6B875] border-[#D6B875] text-[#090A0C] font-bold shadow-md'
                        : 'bg-[#12151A] border-[#22272F] text-[#F3F1EC] hover:border-[#D6B875]/40'
                    }`}
                  >
                    <span className={`text-[10px] uppercase font-semibold tracking-wider ${isSelected ? 'text-[#090A0C]' : 'text-[#8E939B]'}`}>
                      {d.isToday ? 'Hoje' : d.isTomorrow ? 'Amanhã' : d.weekDayShort}
                    </span>
                    <span className="text-base font-bold mt-0.5 leading-none">
                      {d.dayNum}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time Slots Section */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#F3F1EC] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D6B875]" />
                  Horários livres
                </span>
                {availableSlots.length > 0 && (
                  <span className="text-[11px] text-[#8E939B]">
                    {availableSlots.length} horários encontrados
                  </span>
                )}
              </div>

              {isLoadingSlots ? (
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded-xl" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-6 text-center bg-[#12151A] border border-[#22272F] rounded-2xl space-y-2 mt-1">
                  <Clock className="w-7 h-7 text-[#8E939B] mx-auto opacity-70" />
                  <h3 className="text-xs font-bold text-[#F3F1EC]">Sem horários disponíveis</h3>
                  <p className="text-[11px] text-[#8E939B] max-w-xs mx-auto">
                    A barbearia está fechada ou todos os horários deste dia foram preenchidos.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const next = nextDays.find((d) => d.dateStr > selectedDate);
                      if (next) setSelectedDate(next.dateStr);
                    }}
                    className="text-xs font-semibold text-[#D6B875] underline pt-1 active-press"
                  >
                    Ver próximo dia disponível
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {/* Period: Manhã */}
                  {groupedSlots.morning.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-[#8E939B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span>🌅 Manhã</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {groupedSlots.morning.map((slot) => {
                          const isSelected = selectedSlot?.time === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => handleSelectSlot(slot)}
                              className={`py-2 rounded-xl border text-center font-mono font-bold text-xs min-h-[40px] transition-all active-press ${
                                isSelected
                                  ? 'bg-[#D6B875] border-[#D6B875] text-[#090A0C] gold-glow'
                                  : 'bg-[#12151A] border-[#22272F] text-[#F3F1EC] hover:border-[#D6B875]/50'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Period: Tarde */}
                  {groupedSlots.afternoon.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-[#8E939B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span>☀️ Tarde</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {groupedSlots.afternoon.map((slot) => {
                          const isSelected = selectedSlot?.time === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => handleSelectSlot(slot)}
                              className={`py-2 rounded-xl border text-center font-mono font-bold text-xs min-h-[40px] transition-all active-press ${
                                isSelected
                                  ? 'bg-[#D6B875] border-[#D6B875] text-[#090A0C] gold-glow'
                                  : 'bg-[#12151A] border-[#22272F] text-[#F3F1EC] hover:border-[#D6B875]/50'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Period: Noite */}
                  {groupedSlots.night.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-[#8E939B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span>🌙 Noite</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {groupedSlots.night.map((slot) => {
                          const isSelected = selectedSlot?.time === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => handleSelectSlot(slot)}
                              className={`py-2 rounded-xl border text-center font-mono font-bold text-xs min-h-[40px] transition-all active-press ${
                                isSelected
                                  ? 'bg-[#D6B875] border-[#D6B875] text-[#090A0C] gold-glow'
                                  : 'bg-[#12151A] border-[#22272F] text-[#F3F1EC] hover:border-[#D6B875]/50'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ETAPA 4: SEUS DADOS & CONFIRMAÇÃO (Ultra Fluido & Clean) */}
        {/* ---------------------------------------------------- */}
        {step === 4 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!customerName.trim() || normalizePhoneBR(customerPhone).length < 10) {
                setSubmissionError('Preencha seu nome e um WhatsApp válido com DDD.');
                return;
              }
              handleConfirmBooking();
            }}
            className="space-y-3.5 animate-fade-in-up"
          >
            <div>
              <h2 className="text-sm font-bold text-[#F3F1EC] tracking-tight">
                Quase pronto! Seus dados
              </h2>
              <p className="text-[11px] text-[#8E939B]">
                Sem senhas ou burocracia. Usamos apenas para identificar sua reserva.
              </p>
            </div>

            {/* VIP Booking Ticket Summary Card */}
            <div className="p-3.5 bg-[#12151A] rounded-2xl border border-[#D6B875]/40 space-y-2.5 text-xs relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-[#22272F]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#D6B875]/15 text-[#D6B875] flex items-center justify-center">
                    <Scissors className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-[#F3F1EC] text-xs uppercase tracking-wide">
                    {selectedService?.name}
                  </span>
                </div>
                <span className="font-black text-sm text-[#D6B875]">
                  {formatBRL(selectedService?.price_cents)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#8E939B] block">Profissional:</span>
                  <span className="font-semibold text-[#F3F1EC]">
                    {selectedBarberObj ? selectedBarberObj.name : 'Qualquer disponível'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E939B] block">Data & Horário:</span>
                  <span className="font-bold text-[#D6B875]">
                    {formatDateBR(selectedDate)} às {selectedSlot?.time}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#22272F] flex items-center justify-between text-[11px] text-[#8E939B]">
                <span>Duração: {formatDuration(selectedService?.duration_minutes || 30)}</span>
                <span className="text-[#22C55E] flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Pague no local
                </span>
              </div>
            </div>

            {/* Input fields */}
            <div className="space-y-2.5">
              <Input
                label="Seu Nome Completo"
                required
                autoFocus
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Gabriel Ramos"
                leftIcon={<User className="w-4 h-4 text-[#D6B875]" />}
              />

              <Input
                label="Seu WhatsApp"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(formatPhoneBR(e.target.value))}
                placeholder="(82) 99888-7777"
                leftIcon={<Phone className="w-4 h-4 text-[#D6B875]" />}
                helperText="Você receberá a confirmação da barbearia neste número."
              />

              {/* Honeypot hidden input */}
              <input
                type="text"
                name="honeypot"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Sticky Submit Button Container */}
            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full py-3.5 text-sm font-bold bg-gradient-to-r from-[#D6B875] to-[#E5C885] text-[#090A0C] hover:brightness-105 rounded-xl shadow-lg gold-glow-subtle active-press"
              >
                Confirmar Agendamento
              </Button>
              <p className="text-[10px] text-center text-[#8E939B] mt-2">
                🔒 Agendamento gratuito. Nenhum pagamento é cobrado online.
              </p>
            </div>
          </form>
        )}

        {/* ---------------------------------------------------- */}
        {/* ETAPA 5: COMPROVANTE & SUCESSO (Voucher Digital VIP) */}
        {/* ---------------------------------------------------- */}
        {step === 5 && bookingResult && (
          <div className="space-y-4 text-center py-2 animate-fade-in-up">
            <div className="w-14 h-14 bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#F3F1EC]">
                {bookingResult.status === 'confirmed'
                  ? 'Agendamento Confirmado!'
                  : 'Reserva Solicitada com Sucesso!'}
              </h2>
              <p className="text-xs text-[#8E939B] mt-0.5">
                Anthony's Barbearia aguarda você!
              </p>
            </div>

            {/* Digital Voucher Ticket Card */}
            <div className="p-4 bg-[#12151A] rounded-2xl border border-[#D6B875]/40 text-left space-y-3 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#22272F]">
                <div>
                  <span className="text-[10px] uppercase text-[#8E939B] font-semibold tracking-wider">
                    Código da Reserva
                  </span>
                  <div className="text-lg font-mono font-bold text-[#D6B875] tracking-wider">
                    {bookingResult.public_code}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(bookingResult.public_code)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#181C22] border border-[#2E353F] text-xs text-[#D6B875] flex items-center gap-1 active-press"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                      <span className="text-[#22C55E] font-semibold">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8E939B]">Serviço:</span>
                  <span className="font-semibold text-[#F3F1EC]">
                    {bookingResult.service_name_snapshot}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E939B]">Profissional:</span>
                  <span className="font-medium text-[#F3F1EC]">
                    {bookingResult.barber_name_snapshot || "Anthony's Equipe"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E939B]">Data:</span>
                  <span className="font-semibold text-[#F3F1EC]">
                    {formatDateBR(bookingResult.starts_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E939B]">Horário:</span>
                  <span className="font-mono font-bold text-[#D6B875]">
                    {formatTimeBR(bookingResult.starts_at)} - {formatTimeBR(bookingResult.ends_at)}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-[#22272F]">
                  <span className="text-[#8E939B]">Valor a pagar no local:</span>
                  <span className="font-bold text-[#D6B875]">
                    {formatBRL(bookingResult.price_cents_snapshot)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSendToWhatsApp}
                className="w-full py-3 px-4 rounded-xl bg-[#22C55E]/15 hover:bg-[#22C55E]/25 border border-[#22C55E]/40 text-[#22C55E] font-semibold text-xs flex items-center justify-center gap-2 active-press transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Avisar Barbearia no WhatsApp</span>
              </button>

              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#14171D] hover:bg-[#1A1F26] border border-[#262D37] text-[#F3F1EC] font-semibold text-xs flex items-center justify-center gap-2 active-press transition-all inline-flex"
              >
                <CalendarPlus className="w-4 h-4 text-[#D6B875]" />
                <span>Adicionar ao Google Agenda</span>
              </a>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedSlot(null);
                  setBookingResult(null);
                }}
                className="w-full text-xs py-2.5 mt-2"
              >
                Fazer Outro Agendamento
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ---------------------------------------------------- */}
      {/* FLOATING MOBILE BOTTOM BAR (On Step 3 when slot is picked) */}
      {/* ---------------------------------------------------- */}
      {step === 3 && selectedSlot && (
        <div className="fixed bottom-0 inset-x-0 z-30 p-3 glass-header border-t border-[#1E232B] animate-fade-in-up">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-[#8E939B] block">Horário Selecionado</span>
              <span className="text-xs font-bold text-[#D6B875]">
                {formatDateBR(selectedDate)} às {selectedSlot.time}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-4 py-2.5 rounded-xl bg-[#D6B875] text-[#090A0C] font-bold text-xs flex items-center gap-1.5 shadow-md active-press"
            >
              <span>Continuar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
