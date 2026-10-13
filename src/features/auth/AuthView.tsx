import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { FeedbackAlert } from '../../components/ui/FeedbackAlert';
import { api, isDemoMode } from '../../services';
import { Scissors, Lock, Mail, User, Sparkles } from 'lucide-react';

interface AuthViewProps {
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('proprietario@anthonysbarbearia.com.br');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await api.signIn(email, password);
        if (error) {
          setMessage({ type: 'error', text: error });
        } else {
          onSuccess();
        }
      } else if (mode === 'register') {
        if (!name.trim()) {
          setMessage({ type: 'error', text: 'Informe seu nome completo.' });
          setIsLoading(false);
          return;
        }
        const { error } = await api.signUp(email, password, name);
        if (error) {
          setMessage({ type: 'error', text: error });
        } else {
          onSuccess();
        }
      } else if (mode === 'forgot') {
        const { error } = await api.resetPassword(email);
        if (error) {
          setMessage({ type: 'error', text: error });
        } else {
          setMessage({
            type: 'success',
            text: 'Link de redefinição enviado para seu e-mail caso exista cadastro.',
          });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ocorreu um erro inesperado.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFastLogin = async () => {
    setIsLoading(true);
    try {
      await api.signIn('proprietario@anthonysbarbearia.com.br');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D0F] flex flex-col justify-center items-center p-4 sm:p-6 text-center">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-[#D6B875]/15 border border-[#D6B875]/30 flex items-center justify-center text-[#D6B875] mb-3">
          <Scissors className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F3F1EC]">
          Agenda<span className="text-[#D6B875]">Pro</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#A6A9AE] mt-1 max-w-xs">
          Gestão e agendamento online inteligente para barbearias
        </p>
      </div>

      <Card className="w-full max-w-md p-6 sm:p-8 bg-[#14171B] border-[#2B3036] shadow-xl text-left">
        {message && (
          <FeedbackAlert
            type={message.type}
            message={message.text}
            className="mb-4"
            onDismiss={() => setMessage(null)}
          />
        )}

        {/* Fast 1-Click Admin Access */}
        <div className="mb-5 p-3.5 bg-[#D6B875]/10 border border-[#D6B875]/30 rounded-xl flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D6B875] shrink-0" />
            <span className="text-xs font-semibold text-[#D6B875]">Não possui usuário no Supabase?</span>
          </div>
          <p className="text-[11px] text-[#A6A9AE] leading-relaxed">
            Acesse imediatamente o painel completo da Anthony's Barbearia com 1 clique (sem necessidade de senha).
          </p>
          <Button
            type="button"
            className="w-full text-xs font-bold gap-2 bg-[#D6B875] text-[#0B0D0F] hover:bg-[#c4a45f] py-2 mt-1 shadow-md"
            onClick={handleDemoFastLogin}
            disabled={isLoading}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Entrar no Painel Admin Agora</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="h-px bg-[#2B3036] flex-1" />
          <span className="text-[10px] uppercase tracking-wider text-[#A6A9AE]">ou entre com credenciais</span>
          <div className="h-px bg-[#2B3036] flex-1" />
        </div>

        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#F3F1EC]">
            {mode === 'login'
              ? 'Acessar com E-mail'
              : mode === 'register'
              ? 'Criar sua conta'
              : 'Recuperar senha'}
          </h2>
          <p className="text-xs text-[#A6A9AE] mt-0.5">
            {mode === 'login'
              ? 'Entre com suas credenciais de proprietário'
              : mode === 'register'
              ? 'Comece a organizar sua barbearia hoje'
              : 'Informe seu e-mail para receber as instruções'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <Input
              label="Seu Nome Completo"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Rodrigo Mestre"
              leftIcon={<User className="w-4 h-4" />}
            />
          )}

          <Input
            label="E-mail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="proprietario@anthonysbarbearia.com.br"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          {mode !== 'forgot' && (
            <Input
              label="Senha"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />
          )}

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar Conta' : 'Enviar Instruções'}
          </Button>
        </form>

        {/* Mode Toggles */}
        <div className="mt-5 pt-4 border-t border-[#2B3036] flex flex-col gap-2 text-center text-xs text-[#A6A9AE]">
          {mode === 'login' ? (
            <>
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="hover:text-[#D6B875] transition-colors"
              >
                Esqueceu a senha?
              </button>
              <div>
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[#D6B875] font-semibold hover:underline ml-1"
                >
                  Cadastre sua barbearia
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-[#D6B875] font-semibold hover:underline"
            >
              Já tenho conta. Fazer login
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};
