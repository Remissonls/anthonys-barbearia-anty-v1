import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { FeedbackAlert } from '../../components/ui/FeedbackAlert';
import { Barbershop, Service } from '../../types';
import { api } from '../../services';
import { formatBRL, parseBRLToCents } from '../../utils/currency';
import { formatDuration } from '../../utils/date';
import { Scissors, Plus, Edit2, CheckCircle2, XCircle, Clock, DollarSign } from 'lucide-react';

interface ServicesViewProps {
  barbershop: Barbershop;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ barbershop }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [durationStr, setDurationStr] = useState('30');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const list = await api.listServices(barbershop.id, true);
      setServices(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [barbershop.id]);

  const handleOpenCreate = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPriceStr('45,00');
    setDurationStr('30');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: Service) => {
    setEditingService(srv);
    setName(srv.name);
    setDescription(srv.description || '');
    setPriceStr((srv.price_cents / 100).toFixed(2).replace('.', ','));
    setDurationStr(String(srv.duration_minutes));
    setError(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (srv: Service) => {
    try {
      await api.toggleServiceActive(srv.id, !srv.is_active);
      loadServices();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      if (!name.trim()) throw new Error('Informe o nome do serviço.');
      const cents = parseBRLToCents(priceStr);
      if (cents <= 0) throw new Error('Informe um preço válido.');
      const duration = parseInt(durationStr, 10);
      if (isNaN(duration) || duration <= 0) throw new Error('Informe uma duração positiva em minutos.');

      if (editingService) {
        await api.updateService(editingService.id, {
          name: name.trim(),
          description: description.trim() || null,
          price_cents: cents,
          duration_minutes: duration,
        });
      } else {
        await api.createService(barbershop.id, {
          name: name.trim(),
          description: description.trim() || null,
          price_cents: cents,
          duration_minutes: duration,
          is_active: true,
        });
      }

      setIsModalOpen(false);
      loadServices();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar serviço.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F1EC]">
            Serviços & Cardápio
          </h1>
          <p className="text-xs sm:text-sm text-[#A6A9AE]">
            Cadastre os procedimentos oferecidos, valores e tempos de atendimento
          </p>
        </div>

        <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />} size="sm">
          Novo Serviço
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={<Scissors className="w-8 h-8" />}
          title="Nenhum serviço cadastrado"
          description="Cadastre os serviços oferecidos na sua barbearia para que os clientes possam agendar online."
          action={
            <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Cadastrar Primeiro Serviço
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((srv) => (
            <Card
              key={srv.id}
              className={`p-4 sm:p-5 flex flex-col justify-between transition-all ${
                !srv.is_active ? 'opacity-60 bg-[#0B0D0F]' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-[#F3F1EC] flex items-center gap-2">
                      {srv.name}
                      {!srv.is_active && (
                        <span className="text-[10px] font-semibold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 px-1.5 py-0.5 rounded">
                          Inativo
                        </span>
                      )}
                    </h3>
                    {srv.description && (
                      <p className="text-xs text-[#A6A9AE] mt-1 line-clamp-2">
                        {srv.description}
                      </p>
                    )}
                  </div>
                  <span className="text-base font-bold text-[#D6B875] shrink-0">
                    {formatBRL(srv.price_cents)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#A6A9AE] mt-3">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D6B875]" />
                    {formatDuration(srv.duration_minutes)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#2B3036] gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleActive(srv)}
                  className={`text-xs min-h-[36px] ${
                    srv.is_active ? 'text-[#A6A9AE] hover:text-[#EF4444]' : 'text-[#22C55E]'
                  }`}
                  leftIcon={
                    srv.is_active ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {srv.is_active ? 'Desativar' : 'Ativar'}
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleOpenEdit(srv)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  className="text-xs min-h-[36px]"
                >
                  Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Editar Serviço' : 'Novo Serviço'}
        description="Defina os parâmetros do serviço para exibição e cálculo de horários."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && <FeedbackAlert type="error" message={error} />}

          <Input
            label="Nome do Serviço"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Corte Degradê + Lavagem"
          />

          <Input
            label="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes sobre o procedimento e produtos utilizados"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preço (R$)"
              required
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              placeholder="45,00"
              leftIcon={<DollarSign className="w-4 h-4 text-[#D6B875]" />}
            />
            <Input
              label="Duração (minutos)"
              type="number"
              step="5"
              required
              value={durationStr}
              onChange={(e) => setDurationStr(e.target.value)}
              placeholder="30"
              leftIcon={<Clock className="w-4 h-4 text-[#D6B875]" />}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#2B3036]">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
