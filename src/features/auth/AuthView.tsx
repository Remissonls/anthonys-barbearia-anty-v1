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
  const [email, setEmail] = useState('');
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
    await api.signIn('proprietario@mestrenavalha.com.br');
    setIsLoading(false);
    onSuccess();
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

        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#F3F1EC]">
            {mode === 'login'
              ? 'Acessar painel'
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
            placeholder="proprietario@barbearia.com.br"
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

        {/* Demo Fast Login Button if in Demo Mode */}
        {isDemoMode && (
          <div className="mt-4 pt-4 border-t border-[#2B3036]">
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs gap-2 border-[#D6B875]/40 text-[#D6B875]"
              onClick={handleDemoFastLogin}
              disabled={isLoading}
            >
              <Sparkles className="w-4 h-4" />
              <span>Entrar como Demonstração (Anthony's Barbearia)</span>
            </Button>
          </div>
        )}

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
