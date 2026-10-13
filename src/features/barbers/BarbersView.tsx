import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { FeedbackAlert } from '../../components/ui/FeedbackAlert';
import {
  Barbershop,
  Barber,
  Service,
  BarberWorkingHour,
  BarberTimeOff,
} from '../../types';
import { api } from '../../services';
import { DAYS_OF_WEEK_NAMES, formatDateBR, formatTimeBR } from '../../utils/date';
import {
  User,
  Plus,
  Edit2,
  Clock,
  Scissors,
  CheckCircle2,
  XCircle,
  Ban,
  Trash2,
} from 'lucide-react';

interface BarbersViewProps {
  barbershop: Barbershop;
}

export const BarbersView: React.FC<BarbersViewProps> = ({ barbershop }) => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit / Create Barber Modal
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Working Hours Modal
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [activeBarberForHours, setActiveBarberForHours] = useState<Barber | null>(null);
  const [workingHours, setWorkingHours] = useState<BarberWorkingHour[]>([]);
  const [timeOffList, setTimeOffList] = useState<BarberTimeOff[]>([]);

  // Add Time Off Modal State
  const [isTimeOffOpen, setIsTimeOffOpen] = useState(false);
  const [timeOffStart, setTimeOffStart] = useState('');
  const [timeOffEnd, setTimeOffEnd] = useState('');
  const [timeOffReason, setTimeOffReason] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [brbs, srvs] = await Promise.all([
        api.listBarbers(barbershop.id, true),
        api.listServices(barbershop.id),
      ]);
      setBarbers(brbs);
      setServices(srvs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [barbershop.id]);

  const handleOpenCreate = () => {
    setEditingBarber(null);
    setName('');
    setDescription('');
    setSelectedServiceIds(services.map((s) => s.id));
    setError(null);
    setIsBarberModalOpen(true);
  };

  const handleOpenEdit = (barber: Barber) => {
    setEditingBarber(barber);
    setName(barber.name);
    setDescription(barber.description || '');
    setSelectedServiceIds(barber.service_ids || []);
    setError(null);
    setIsBarberModalOpen(true);
  };

  const handleToggleServiceSelection = (srvId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(srvId) ? prev.filter((id) => id !== srvId) : [...prev, srvId]
    );
  };

  const handleToggleActive = async (barber: Barber) => {
    try {
      await api.toggleBarberActive(barber.id, !barber.is_active);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      if (!name.trim()) throw new Error('Informe o nome do barbeiro.');

      if (editingBarber) {
        await api.updateBarber(editingBarber.id, {
          name: name.trim(),
          description: description.trim() || null,
          service_ids: selectedServiceIds,
        });
      } else {
        await api.createBarber(barbershop.id, {
          name: name.trim(),
          description: description.trim() || null,
          is_active: true,
          sort_order: barbers.length + 1,
          service_ids: selectedServiceIds,
        });
      }

      setIsBarberModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar barbeiro.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Schedule & Time-Off Management
  const handleOpenHours = async (barber: Barber) => {
    setActiveBarberForHours(barber);
    try {
      const [wh, to] = await Promise.all([
        api.getBarberWorkingHours(barber.id),
        api.getBarberTimeOff(barber.id),
      ]);
      setWorkingHours(wh);
      setTimeOffList(to);
      setIsHoursModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveWorkingHours = async () => {
    if (!activeBarberForHours) return;
    try {
      await api.updateBarberWorkingHours(activeBarberForHours.id, workingHours);
      setIsHoursModalOpen(false);
      alert('Jornada do profissional atualizada com sucesso!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBarberForHours) return;
    try {
      await api.addBarberTimeOff({
        barbershop_id: barbershop.id,
        barber_id: activeBarberForHours.id,
        starts_at: new Date(timeOffStart).toISOString(),
        ends_at: new Date(timeOffEnd).toISOString(),
        reason: timeOffReason || 'Folga / Bloqueio',
      });
      const to = await api.getBarberTimeOff(activeBarberForHours.id);
      setTimeOffList(to);
      setIsTimeOffOpen(false);
      setTimeOffStart('');
      setTimeOffEnd('');
      setTimeOffReason('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTimeOff = async (id: string) => {
    try {
      await api.deleteBarberTimeOff(id);
      if (activeBarberForHours) {
        const to = await api.getBarberTimeOff(activeBarberForHours.id);
        setTimeOffList(to);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F1EC]">
            Equipe de Barbeiros
          </h1>
          <p className="text-xs sm:text-sm text-[#A6A9AE]">
            Cadastre os profissionais, vincule serviços habilitados e defina jornadas
          </p>
        </div>

        <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />} size="sm">
          Novo Barbeiro
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : barbers.length === 0 ? (
        <EmptyState
          icon={<User className="w-8 h-8" />}
          title="Nenhum profissional cadastrado"
          description="Adicione os membros da sua equipe para que eles recebam agendamentos de acordo com suas escalas."
          action={
            <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Cadastrar Primeiro Barbeiro
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {barbers.map((barber) => (
            <Card
              key={barber.id}
              className={`p-4 sm:p-5 flex flex-col justify-between transition-all ${
                !barber.is_active ? 'opacity-60 bg-[#0B0D0F]' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#1B1F24] border border-[#2B3036] flex items-center justify-center text-[#D6B875] font-bold text-lg shrink-0 overflow-hidden">
                      {barber.photo_url ? (
                        <img
                          src={barber.photo_url}
                          alt={barber.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        barber.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#F3F1EC] flex items-center gap-2">
                        {barber.name}
                        {!barber.is_active && (
                          <span className="text-[10px] font-semibold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 px-1.5 py-0.5 rounded">
                            Inativo
                          </span>
                        )}
                      </h3>
                      {barber.description && (
                        <p className="text-xs text-[#A6A9AE] mt-0.5 line-clamp-1">
                          {barber.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Services performed */}
                <div className="mt-3 pt-3 border-t border-[#2B3036]/50">
                  <div className="text-[11px] font-medium text-[#A6A9AE] mb-1.5 flex items-center gap-1">
                    <Scissors className="w-3 h-3 text-[#D6B875]" />
                    Serviços habilitados ({barber.service_ids?.length || 0}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {barber.service_ids && barber.service_ids.length > 0 ? (
                      barber.service_ids.map((sid) => {
                        const s = services.find((srv) => srv.id === sid);
                        return s ? (
                          <span
                            key={sid}
                            className="text-[10px] bg-[#1B1F24] text-[#F3F1EC] border border-[#2B3036] px-2 py-0.5 rounded-full"
                          >
                            {s.name}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="text-[11px] text-[#EF4444]/80">
                        Nenhum serviço vinculado.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#2B3036] gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleActive(barber)}
                  className={`text-xs min-h-[36px] ${
                    barber.is_active ? 'text-[#A6A9AE] hover:text-[#EF4444]' : 'text-[#22C55E]'
                  }`}
                  leftIcon={
                    barber.is_active ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {barber.is_active ? 'Desativar' : 'Ativar'}
                </Button>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenHours(barber)}
                    leftIcon={<Clock className="w-3.5 h-3.5" />}
                    className="text-xs min-h-[36px]"
                  >
                    Escala & Folgas
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenEdit(barber)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    className="text-xs min-h-[36px]"
                  >
                    Editar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit / Create Barber Modal */}
      <Modal
        isOpen={isBarberModalOpen}
        onClose={() => setIsBarberModalOpen(false)}
        title={editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}
        description="Cadastre as informações do profissional e os serviços que ele executa."
      >
        <form onSubmit={handleSaveBarber} className="space-y-4">
          {error && <FeedbackAlert type="error" message={error} />}

          <Input
            label="Nome Completo do Barbeiro"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Carlos Silva"
          />

          <Input
            label="Bio / Especialidade (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Especialista em barboterapia e visagismo"
          />

          {/* Service mapping checkboxes (Section 9.1 & 13.4) */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#A6A9AE]">
              Serviços que este profissional realiza:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {services.map((srv) => {
                const isChecked = selectedServiceIds.includes(srv.id);
                return (
                  <label
                    key={srv.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-[#D6B875]/10 border-[#D6B875]/40 text-[#F3F1EC]'
                        : 'bg-[#14171B] border-[#2B3036] text-[#A6A9AE]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleServiceSelection(srv.id)}
                      className="rounded accent-[#D6B875]"
                    />
                    <span>{srv.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#2B3036]">
            <Button type="button" variant="ghost" onClick={() => setIsBarberModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editingBarber ? 'Salvar Alterações' : 'Cadastrar Barbeiro'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Working Hours & Time Off Modal (Section 9.3 & 9.4) */}
      <Modal
        isOpen={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
        title={`Escala de Trabalho — ${activeBarberForHours?.name || ''}`}
        description="Configure os dias e horários de atendimento, intervalo de almoço e bloqueios excepcionais."
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Working hours table */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D6B875] mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Jornada Semanal
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {workingHours.map((wh, idx) => (
                <div
                  key={wh.day_of_week}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-[#1B1F24] rounded-lg border border-[#2B3036] gap-2 text-xs"
                >
                  <label className="flex items-center gap-2 font-medium min-w-[120px]">
                    <input
                      type="checkbox"
                      checked={wh.is_working}
                      onChange={(e) => {
                        const updated = [...workingHours];
                        updated[idx].is_working = e.target.checked;
                        setWorkingHours(updated);
                      }}
                      className="rounded accent-[#D6B875]"
                    />
                    <span>{DAYS_OF_WEEK_NAMES[wh.day_of_week]}</span>
                  </label>

                  {wh.is_working ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[#A6A9AE]">Turno:</span>
                        <input
                          type="time"
                          value={wh.starts_at}
                          onChange={(e) => {
                            const updated = [...workingHours];
                            updated[idx].starts_at = e.target.value;
                            setWorkingHours(updated);
                          }}
                          className="bg-[#14171B] border border-[#2B3036] rounded px-1.5 py-0.5 text-xs text-[#F3F1EC]"
                        />
                        <span className="text-[#A6A9AE]">às</span>
                        <input
                          type="time"
                          value={wh.ends_at}
                          onChange={(e) => {
                            const updated = [...workingHours];
                            updated[idx].ends_at = e.target.value;
                            setWorkingHours(updated);
                          }}
                          className="bg-[#14171B] border border-[#2B3036] rounded px-1.5 py-0.5 text-xs text-[#F3F1EC]"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[#A6A9AE]">Almoço:</span>
                        <input
                          type="time"
                          value={wh.break_starts_at || ''}
                          onChange={(e) => {
                            const updated = [...workingHours];
                            updated[idx].break_starts_at = e.target.value || null;
                            setWorkingHours(updated);
                          }}
                          className="bg-[#14171B] border border-[#2B3036] rounded px-1.5 py-0.5 text-xs text-[#F3F1EC]"
                        />
                        <span className="text-[#A6A9AE]">às</span>
                        <input
                          type="time"
                          value={wh.break_ends_at || ''}
                          onChange={(e) => {
                            const updated = [...workingHours];
                            updated[idx].break_ends_at = e.target.value || null;
                            setWorkingHours(updated);
                          }}
                          className="bg-[#14171B] border border-[#2B3036] rounded px-1.5 py-0.5 text-xs text-[#F3F1EC]"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[#A6A9AE] italic">Folga semanal</span>
                  )}
                </div>
              ))}
            </div>
            <Button size="sm" onClick={handleSaveWorkingHours} className="mt-3 w-full">
              Salvar Escala Semanal
            </Button>
          </div>

          {/* Exceptional blocks & Time Off (Section 9.4) */}
          <div className="pt-4 border-t border-[#2B3036]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D6B875] flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5" />
                Bloqueios Excepcionais & Folgas
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsTimeOffOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs py-1"
              >
                Novo Bloqueio
              </Button>
            </div>

            {timeOffList.length === 0 ? (
              <p className="text-xs text-[#A6A9AE] italic">
                Nenhum bloqueio ou folga extraordinária cadastrada para este barbeiro.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {timeOffList.map((to) => (
                  <div
                    key={to.id}
                    className="flex items-center justify-between p-2 bg-[#1B1F24] rounded-lg border border-[#2B3036] text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#F3F1EC]">{to.reason || 'Bloqueio'}</span>
                      <span className="text-[#A6A9AE] ml-2">
                        {formatDateBR(to.starts_at)} ({formatTimeBR(to.starts_at)} às{' '}
                        {formatTimeBR(to.ends_at)})
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTimeOff(to.id)}
                      className="p-1 text-[#A6A9AE] hover:text-[#EF4444]"
                      aria-label="Excluir bloqueio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Add Time Off Submodal */}
      <Modal
        isOpen={isTimeOffOpen}
        onClose={() => setIsTimeOffOpen(false)}
        title="Registrar Bloqueio Excepcional"
        description="Impeça novos agendamentos neste intervalo de horário."
      >
        <form onSubmit={handleAddTimeOff} className="space-y-3">
          <Input
            label="Início do Bloqueio"
            type="datetime-local"
            required
            value={timeOffStart}
            onChange={(e) => setTimeOffStart(e.target.value)}
          />
          <Input
            label="Fim do Bloqueio"
            type="datetime-local"
            required
            value={timeOffEnd}
            onChange={(e) => setTimeOffEnd(e.target.value)}
          />
          <Input
            label="Motivo (opcional)"
            value={timeOffReason}
            onChange={(e) => setTimeOffReason(e.target.value)}
            placeholder="Ex: Consulta médica, treinamento, compromisso pessoal"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsTimeOffOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Bloqueio</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
