import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { FeedbackAlert } from '../../components/ui/FeedbackAlert';
import { Barbershop, BusinessHour, ConfirmationMode } from '../../types';
import { api } from '../../services';
import { DAYS_OF_WEEK_NAMES } from '../../utils/date';
import { formatPhoneBR, normalizePhoneBR } from '../../utils/phone';
import {
  Settings,
  Store,
  Clock,
  ExternalLink,
  ShieldCheck,
  Globe,
  Share2,
} from 'lucide-react';

interface SettingsViewProps {
  barbershop: Barbershop;
  onUpdated: (shop: Barbershop) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ barbershop, onUpdated }) => {
  const [name, setName] = useState(barbershop.name);
  const [slug, setSlug] = useState(barbershop.slug);
  const [phone, setPhone] = useState(barbershop.phone);
  const [whatsapp, setWhatsapp] = useState(barbershop.whatsapp || '');
  const [address, setAddress] = useState(barbershop.address || '');
  const [description, setDescription] = useState(barbershop.description || '');
  const [timezone, setTimezone] = useState(barbershop.timezone || 'America/Maceio');
  const [confirmationMode, setConfirmationMode] = useState<ConfirmationMode>(
    barbershop.booking_confirmation_mode
  );

  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadHours = async () => {
      try {
        const hours = await api.getBusinessHours(barbershop.id);
        setBusinessHours(hours);
      } catch (e) {
        console.error(e);
      }
    };
    loadHours();
  }, [barbershop.id]);

  const handleSaveShopInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      if (!name.trim()) throw new Error('Informe o nome da barbearia.');
      if (!slug.trim()) throw new Error('O slug não pode ficar vazio.');

      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

      const updated = await api.updateBarbershop(barbershop.id, {
        name: name.trim(),
        slug: cleanSlug,
        phone: formatPhoneBR(phone),
        whatsapp: formatPhoneBR(whatsapp || phone),
        address: address.trim() || null,
        description: description.trim() || null,
        timezone,
        booking_confirmation_mode: confirmationMode,
      });

      onUpdated(updated);
      setMessage({ type: 'success', text: 'Dados da barbearia salvos com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha ao salvar dados.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveHours = async () => {
    setMessage(null);
    setIsLoading(true);
    try {
      await api.updateBusinessHours(barbershop.id, businessHours);
      setMessage({ type: 'success', text: 'Horários de funcionamento atualizados com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha ao salvar horários.' });
    } finally {
      setIsLoading(false);
    }
  };

  const publicUrl = `${window.location.origin}/agendar/${slug}`;

  return (
    <div className="space-y-6 text-left max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F1EC]">
          Configurações da Barbearia
        </h1>
        <p className="text-xs sm:text-sm text-[#A6A9AE]">
          Defina dados comerciais, horários de funcionamento e regras de agendamento
        </p>
      </div>

      {message && (
        <FeedbackAlert
          type={message.type}
          message={message.text}
          onDismiss={() => setMessage(null)}
        />
      )}

      {/* Public Link Card (Section 6.3) */}
      <Card className="p-4 sm:p-5 bg-[#D6B875]/10 border-[#D6B875]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#D6B875] uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              Sua Página Pública de Agendamento
            </div>
            <div className="text-sm font-mono text-[#F3F1EC] mt-1 break-all">
              {publicUrl}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                alert('Link copiado!');
              }}
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Copiar
            </Button>
            <a
              href={`/agendar/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D6B875] text-[#0B0D0F] font-semibold text-xs rounded-lg hover:bg-[#E5C885] transition-colors"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </Card>

      {/* Barbershop General Info Form */}
      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#F3F1EC] flex items-center gap-2">
          <Store className="w-4 h-4 text-[#D6B875]" />
          Informações Gerais
        </h2>

        <form onSubmit={handleSaveShopInfo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome Comercial"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Slug Público (URL)"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              helperText={`Acesso em: /agendar/${slug}`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefone Comercial"
              required
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
            />
            <Input
              label="WhatsApp (opcional)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatPhoneBR(e.target.value))}
            />
          </div>

          <Input
            label="Endereço Completo"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Rua do Sol, 452 - Ponta Verde, Maceió - AL"
          />

          <Input
            label="Descrição Curta da Barbearia"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Apresente sua barbearia para os clientes"
          />

          {/* Section 10.5: Modo de Confirmação */}
          <div className="pt-3 border-t border-[#2B3036] space-y-2">
            <label className="block text-xs font-medium text-[#A6A9AE]">
              Modo de Confirmação de Reservas Públicas
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-colors ${
                  confirmationMode === 'auto'
                    ? 'bg-[#D6B875]/10 border-[#D6B875]/40 text-[#F3F1EC]'
                    : 'bg-[#14171B] border-[#2B3036] text-[#A6A9AE]'
                }`}
              >
                <input
                  type="radio"
                  name="confirmationMode"
                  checked={confirmationMode === 'auto'}
                  onChange={() => setConfirmationMode('auto')}
                  className="mt-0.5 accent-[#D6B875]"
                />
                <div>
                  <div className="font-semibold text-sm">Confirmação Automática</div>
                  <div className="text-[11px] text-[#A6A9AE] mt-0.5">
                    Novos agendamentos entram diretamente como <strong>Confirmados</strong> na agenda.
                  </div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-colors ${
                  confirmationMode === 'manual'
                    ? 'bg-[#D6B875]/10 border-[#D6B875]/40 text-[#F3F1EC]'
                    : 'bg-[#14171B] border-[#2B3036] text-[#A6A9AE]'
                }`}
              >
                <input
                  type="radio"
                  name="confirmationMode"
                  checked={confirmationMode === 'manual'}
                  onChange={() => setConfirmationMode('manual')}
                  className="mt-0.5 accent-[#D6B875]"
                />
                <div>
                  <div className="font-semibold text-sm">Aprovação Manual</div>
                  <div className="text-[11px] text-[#A6A9AE] mt-0.5">
                    Novos agendamentos entram como <strong>Pendentes</strong> para você aceitar no painel.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isLoading}>
              Salvar Informações
            </Button>
          </div>
        </form>
      </Card>

      {/* Business Hours Settings (Section 9.2) */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#F3F1EC] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D6B875]" />
            Horários de Funcionamento do Estabelecimento
          </h2>
          <Button size="sm" onClick={handleSaveHours} isLoading={isLoading}>
            Salvar Horários
          </Button>
        </div>
        <p className="text-xs text-[#A6A9AE]">
          Defina os dias em que a barbearia abre e os horários de início e término do atendimento geral.
        </p>

        <div className="space-y-2">
          {businessHours.map((bh, idx) => (
            <div
              key={bh.day_of_week}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#1B1F24] rounded-lg border border-[#2B3036] gap-3 text-xs"
            >
              <label className="flex items-center gap-2 font-medium min-w-[140px]">
                <input
                  type="checkbox"
                  checked={!bh.is_closed}
                  onChange={(e) => {
                    const updated = [...businessHours];
                    updated[idx].is_closed = !e.target.checked;
                    setBusinessHours(updated);
                  }}
                  className="rounded accent-[#D6B875]"
                />
                <span className={bh.is_closed ? 'text-[#A6A9AE] line-through' : 'text-[#F3F1EC]'}>
                  {DAYS_OF_WEEK_NAMES[bh.day_of_week]}
                </span>
              </label>

              {!bh.is_closed ? (
                <div className="flex items-center gap-2">
                  <span className="text-[#A6A9AE]">Abre às:</span>
                  <input
                    type="time"
                    value={bh.opens_at}
                    onChange={(e) => {
                      const updated = [...businessHours];
                      updated[idx].opens_at = e.target.value;
                      setBusinessHours(updated);
                    }}
                    className="bg-[#14171B] border border-[#2B3036] rounded px-2 py-1 text-xs text-[#F3F1EC]"
                  />
                  <span className="text-[#A6A9AE]">Fecha às:</span>
                  <input
                    type="time"
                    value={bh.closes_at}
                    onChange={(e) => {
                      const updated = [...businessHours];
                      updated[idx].closes_at = e.target.value;
                      setBusinessHours(updated);
                    }}
                    className="bg-[#14171B] border border-[#2B3036] rounded px-2 py-1 text-xs text-[#F3F1EC]"
                  />
                </div>
              ) : (
                <span className="text-[#EF4444] font-medium italic">Fechado o dia todo</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
