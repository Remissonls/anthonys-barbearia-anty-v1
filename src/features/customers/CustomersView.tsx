import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/Badge';
import { FeedbackAlert } from '../../components/ui/FeedbackAlert';
import { Barbershop, Customer, Appointment } from '../../types';
import { api } from '../../services';
import { formatPhoneBR, normalizePhoneBR } from '../../utils/phone';
import { formatDateBR, formatTimeBR } from '../../utils/date';
import { formatBRL } from '../../utils/currency';
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  History,
  MessageSquare,
  Edit2,
  Scissors,
} from 'lucide-react';

interface CustomersViewProps {
  barbershop: Barbershop;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ barbershop }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New / Edit Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // History Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerHistory, setCustomerHistory] = useState<Appointment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const list = await api.listCustomers(barbershop.id, search);
      setCustomers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [barbershop.id, search]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setError(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(formatPhoneBR(c.phone_normalized));
    setError(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenHistory = async (c: Customer) => {
    setSelectedCustomer(c);
    setIsLoadingHistory(true);
    try {
      const res = await api.getCustomerById(c.id);
      setCustomerHistory(res?.history || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      if (!name.trim()) throw new Error('Informe o nome do cliente.');
      const cleanPhone = normalizePhoneBR(phone);
      if (cleanPhone.length < 10) throw new Error('Informe um telefone válido com DDD.');

      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, name, cleanPhone);
      } else {
        await api.createCustomer(barbershop.id, name, cleanPhone);
      }

      setIsCustomerModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F1EC]">
            Base de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-[#A6A9AE]">
            Consulte o histórico de agendamentos e contatos dos clientes da barbearia
          </p>
        </div>

        <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />} size="sm">
          Novo Cliente
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Input
          placeholder="Pesquisar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="Nenhum cliente encontrado"
          description="Os clientes são cadastrados automaticamente ao realizar agendamentos online ou manualmente."
          action={
            <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Cadastrar Cliente
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {customers.map((c) => {
            const formatted = formatPhoneBR(c.phone_normalized);
            const waLink = `https://wa.me/55${c.phone_normalized}`;

            return (
              <Card
                key={c.id}
                className="p-4 flex flex-col justify-between hover:border-[#D6B875]/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm text-[#F3F1EC]">{c.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#A6A9AE] mt-1">
                        <Phone className="w-3.5 h-3.5 text-[#D6B875]" />
                        <span>{formatted}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 text-[#A6A9AE] hover:text-[#F3F1EC] rounded hover:bg-[#1B1F24]"
                      aria-label="Editar cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#2B3036]/50 flex items-center justify-between text-[11px] text-[#A6A9AE]">
                    <span>Atendimentos: <strong className="text-[#F3F1EC]">{c.total_appointments || 0}</strong></span>
                    {c.last_appointment_at && (
                      <span>Último: {formatDateBR(c.last_appointment_at)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-2">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-[#22C55E] hover:underline"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenHistory(c)}
                    leftIcon={<History className="w-3.5 h-3.5" />}
                    className="text-xs py-1 px-2.5 min-h-[36px]"
                  >
                    Histórico
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New / Edit Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
        description="Cadastre ou atualize as informações de contato do cliente."
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          {error && <FeedbackAlert type="error" message={error} />}

          <Input
            label="Nome Completo"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Mateus Albuquerque"
          />

          <Input
            label="Telefone / WhatsApp"
            required
            value={phone}
            onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
            placeholder="(82) 99345-6789"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-[#2B3036]">
            <Button type="button" variant="ghost" onClick={() => setIsCustomerModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Salvar Cliente
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer History Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Histórico — ${selectedCustomer?.name || ''}`}
        description={`Telefone: ${formatPhoneBR(selectedCustomer?.phone_normalized)}`}
      >
        <div className="space-y-3">
          {isLoadingHistory ? (
            <Skeleton className="h-24 w-full" />
          ) : customerHistory.length === 0 ? (
            <p className="text-xs text-[#A6A9AE] italic py-4 text-center">
              Nenhum atendimento registrado para este cliente até o momento.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {customerHistory.map((h) => (
                <div
                  key={h.id}
                  className="p-3 bg-[#1B1F24] rounded-lg border border-[#2B3036] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-sm text-[#F3F1EC]">
                      {h.service_name_snapshot}
                    </div>
                    <div className="text-[#A6A9AE] mt-0.5">
                      {formatDateBR(h.starts_at)} às {formatTimeBR(h.starts_at)} com{' '}
                      {h.barber?.name || 'Barbeiro'} • {formatBRL(h.price_cents_snapshot)}
                    </div>
                  </div>
                  <StatusBadge status={h.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
