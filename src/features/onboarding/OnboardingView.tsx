import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { FeedbackAlert } from '../../components/ui/FeedbackAlert';
import { api } from '../../services';
import { Barbershop } from '../../types';
import { Scissors, Store, Sparkles, Clock, Check } from 'lucide-react';
import { formatPhoneBR, normalizePhoneBR } from '../../utils/phone';

interface OnboardingViewProps {
  onCompleted: (shop: Barbershop) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onCompleted }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Barbershop details
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: First service & first barber
  const [serviceName, setServiceName] = useState('Corte Clássico');
  const [servicePrice, setServicePrice] = useState('45,00');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [barberName, setBarberName] = useState('');

  // Auto-generate slug when name changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!name.trim()) throw new Error('Informe o nome da barbearia.');
      if (!slug.trim()) throw new Error('Informe o link/slug da barbearia.');
      if (normalizePhoneBR(phone).length < 10) throw new Error('Informe um telefone válido com DDD.');

      const cleanPrice = parseFloat(servicePrice.replace(',', '.')) || 45;
      const priceCents = Math.round(cleanPrice * 100);
      const durationMin = parseInt(serviceDuration, 10) || 30;

      const shop = await api.setupOnboarding({
        shop: {
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          phone: formatPhoneBR(phone),
          whatsapp: formatPhoneBR(phone),
          address: address.trim() || null,
          description: description.trim() || null,
          timezone: 'America/Maceio',
          booking_confirmation_mode: 'auto',
          is_active: true,
        },
        firstService: {
          name: serviceName.trim() || 'Corte Clássico',
          price_cents: priceCents,
          duration_minutes: durationMin,
        },
        firstBarber: {
          name: barberName.trim() || 'Barbeiro Principal',
        },
      });

      onCompleted(shop);
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar configurações iniciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D0F] flex flex-col justify-center items-center p-4 sm:p-6 text-center">
      <div className="mb-6 flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-[#D6B875]/15 border border-[#D6B875]/30 flex items-center justify-center text-[#D6B875] mb-2">
          <Store className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#F3F1EC]">Configuração da Barbearia</h1>
        <p className="text-xs sm:text-sm text-[#A6A9AE]">
          Etapa {step} de 2 — {step === 1 ? 'Dados da sua empresa' : 'Primeiro serviço e equipe'}
        </p>
      </div>

      <Card className="w-full max-w-lg p-6 sm:p-8 bg-[#14171B] border-[#2B3036] text-left">
        {error && <FeedbackAlert type="error" message={error} className="mb-4" />}

        {step === 1 ? (
          <div className="space-y-4">
            <Input
              label="Nome Comercial da Barbearia"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Barbearia Dom Rodrigo"
            />

            <div>
              <Input
                label="Endereço da Página Pública (Slug)"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="dom-rodrigo"
                helperText={`Seu link será: agendapro.com.br/agendar/${slug || 'sua-barbearia'}`}
              />
            </div>

            <Input
              label="Telefone / WhatsApp Comercial"
              required
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
              placeholder="(82) 99876-5432"
            />

            <Input
              label="Endereço Físico (opcional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro e cidade"
            />

            <Button
              type="button"
              className="w-full mt-4"
              onClick={() => {
                if (!name.trim() || !slug.trim() || normalizePhoneBR(phone).length < 10) {
                  setError('Preencha os campos obrigatórios com informações válidas.');
                  return;
                }
                setError(null);
                setStep(2);
              }}
            >
              Continuar para Serviços e Equipe
            </Button>
          </div>
        ) : (
          <form onSubmit={handleFinish} className="space-y-4">
            <div className="p-3 bg-[#1B1F24] rounded-lg border border-[#2B3036] text-xs text-[#A6A9AE]">
              <Sparkles className="w-4 h-4 text-[#D6B875] inline mr-1.5" />
              Cadastre seu primeiro serviço e profissional. Você poderá adicionar mais a qualquer momento no painel.
            </div>

            <Input
              label="Nome do Primeiro Serviço"
              required
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Ex: Corte Tradicional"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Preço (R$)"
                required
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
                placeholder="45,00"
              />
              <Input
                label="Duração (minutos)"
                type="number"
                required
                value={serviceDuration}
                onChange={(e) => setServiceDuration(e.target.value)}
                placeholder="30"
              />
            </div>

            <Input
              label="Nome do Primeiro Barbeiro"
              required
              value={barberName}
              onChange={(e) => setBarberName(e.target.value)}
              placeholder="Ex: Rodrigo"
            />

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                className="w-1/3"
              >
                Voltar
              </Button>
              <Button type="submit" className="w-2/3" isLoading={isLoading}>
                Concluir e Acessar Painel
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
