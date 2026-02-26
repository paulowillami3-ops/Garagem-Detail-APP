import ReloadPrompt from './src/ReloadPrompt';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppView, Service, BookingState, Appointment, ChatMessage } from './types';
import { SERVICES } from './constants';
import { supabase } from './src/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { format, addDays, startOfDay, addMinutes, differenceInMinutes, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateToBRL } from './src/utils';



const CustomerLoginScreen: React.FC<{ onLogin: (phone: string) => void; onBack: () => void }> = ({ onLogin, onBack }) => {
  const [phone, setPhone] = useState('');

  const formatPhone = (v: string) => {
    const numbers = v.replace(/\D/g, '').slice(0, 11);

    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 max-w-md mx-auto w-full transition-colors justify-center">
      <button onClick={onBack} className="absolute top-6 left-6 size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
      <div className="text-center mb-8">
        <div className="size-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4"><span className="material-symbols-outlined text-4xl">smartphone</span></div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Identifique-se</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Informe seu celular para ver seus agendamentos.</p>
      </div>
      <div className="space-y-4">
        <input
          value={phone}
          onChange={handlePhoneChange}
          className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-gray-400 text-center text-lg tracking-widest font-mono"
          placeholder="(00) 0 0000-0000"
          type="tel"
        />
        <button
          onClick={() => {
            const raw = phone.replace(/\D/g, '');
            if (raw.length > 8) onLogin(raw);
            else alert('Telefone inválido');
          }}
          className="w-full bg-primary py-4 rounded-xl font-bold shadow-lg shadow-primary/20 text-white"
        >
          Ver Agendamentos
        </button>
      </div>
    </div>
  );
};

const AdminClientsScreen: React.FC<{ onBack: () => void; onChat: (id: string, name: string) => void }> = ({ onBack, onChat }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingClient, setEditingClient] = useState<any | null>(null);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) console.error('Error fetching clients:', error);
    else if (data) setClients(data);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${name}? Isso apagará também o histórico de agendamentos e conversas.`)) {
      // Delete interactions first to avoid FK constraints
      await supabase.from('chat_messages').delete().eq('client_id', id);
      await supabase.from('appointments').delete().eq('client_id', id);

      // Now delete client
      const { error } = await supabase.from('clients').delete().eq('id', id);

      if (error) alert('Erro ao excluir: ' + error.message);
      else fetchClients();
    }
  };

  const handleUpdate = () => {
    if (!editingClient) return;
    supabase.from('clients').update({
      name: editingClient.name,
      phone: editingClient.phone
    })
      .eq('id', editingClient.id)
      .then(({ error }) => {
        if (error) alert('Erro ao atualizar: ' + error.message);
        else {
          setEditingClient(null);
          fetchClients();
        }
      });
  };

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors relative">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Clientes Cadastrados</h2>
        <div className="bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300">
          {clients.length}
        </div>
      </header>
      <div className="p-4 bg-white dark:bg-background-dark border-b border-gray-200 dark:border-white/5 sticky top-[73px] z-40">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full bg-gray-100 dark:bg-surface-dark p-3 rounded-lg border-transparent text-sm text-slate-900 dark:text-white"
        />
      </div>
      <main className="p-4 space-y-2 flex-1 pb-24">
        {filtered.map(c => (
          <div key={c.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col gap-4 transition-colors">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 font-bold uppercase">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.phone}</p>
              </div>
              <div className="text-xs text-gray-400">
                #{c.id}
              </div>
            </div>
            <div className="flex gap-2 border-t border-gray-100 dark:border-white/5 pt-3">
              <button onClick={() => onChat(String(c.id), c.name)} className="flex-1 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-500/20">
                <span className="material-symbols-outlined text-sm">chat</span> Chat
              </button>
              <button onClick={() => setEditingClient(c)} className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 text-xs font-bold flex items-center justify-center gap-1 hover:bg-gray-200 dark:hover:bg-white/10">
                <span className="material-symbols-outlined text-sm">edit</span> Editar
              </button>
              <button onClick={() => handleDelete(c.id, c.name)} className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-500/20">
                <span className="material-symbols-outlined text-sm">delete</span> Excluir
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl p-6 shadow-xl animate-enter">
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Editar Cliente</h3>
            <div className="space-y-4">
              <input
                value={editingClient.name}
                onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
                className="w-full bg-gray-100 dark:bg-background-dark p-3 rounded-lg text-slate-900 dark:text-white"
                placeholder="Nome"
              />
              <input
                value={editingClient.phone}
                onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })}
                className="w-full bg-gray-100 dark:bg-background-dark p-3 rounded-lg text-slate-900 dark:text-white"
                placeholder="Telefone"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingClient(null)} className="flex-1 py-3 text-gray-500 font-bold">Cancelar</button>
                <button onClick={handleUpdate} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Utilities ---

const getNextDays = (count: number) => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dayNum: d.getDate(),
      label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      isToday: i === 0,
      isDisabled: d.getDay() === 0, // Disable Sundays
      monthName: d.toLocaleDateString('pt-BR', { month: 'long' }),
      year: d.getFullYear()
    });
  }
  return days;
};



const SuccessOverlay: React.FC = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/90 backdrop-blur-md animate-fade-in px-6">
    <div className="bg-white dark:bg-surface-dark p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center animate-scale-up border border-gray-100 dark:border-white/10 max-w-sm w-full">
      <div className="size-24 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-6 animate-bounce-custom">
        <span className="material-symbols-outlined text-6xl text-green-600 dark:text-green-400">check_circle</span>
      </div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2">Agendamento feito com sucesso!</h2>
      <p className="text-gray-500 dark:text-gray-400 font-medium">Seu horário está reservado.</p>
    </div>
  </div>
);

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const IOSNotification: React.FC<{ message: string; visible: boolean; onClose: () => void }> = ({ message, visible, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for fade out
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, onClose]);

  if (!visible && !show) return null;

  return (
    <div className={`fixed top-4 left-4 right-4 z-[100] transition-all duration-500 ease-out transform ${show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-4 flex items-center gap-4 max-w-sm mx-auto">
        <div className="size-10 rounded-xl bg-green-500 flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-outlined">chat</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Nova Mensagem</h4>
          <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{message}</p>
        </div>
        <button onClick={() => setShow(false)} className="size-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-500">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
};

// --- Screens Components ---

const LandingScreen: React.FC<{ onStart: () => void; onAdmin: () => void }> = ({ onStart, onAdmin }) => (
  <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark overflow-hidden transition-colors">
    <div className="relative w-full h-[55vh] min-h-[400px] overflow-hidden rounded-b-[2.5rem]">
      <div className="absolute inset-0 bg-center bg-cover bg-no-repeat" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAd9ZmeHOyg42x7v0k0qNhO9-cK785skXNL_S6do6DDC5G5lb-B1ftMgparS2gwUG7ooRV9_XnYkvC2WZZ3h6WU51kIeASA39uINq6la0Z2BqcF95tIMTnhUvI53fWECSvsvtVxppcZ1GOwUw6UWFvSqKuLladxkOuS4hVaIXBzMzlgig19A6E7vUZldSxux-DbJw8JvmeWvIeb5TG4wpmT6nQXz1DuxMGJqlWmMR7ZL7TvUrEyVCFEkLV0gpxfI_wLl3Y0FdU2ks-t")' }}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light/60 dark:via-background-dark/60 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full p-8 pb-12 flex flex-col items-center justify-end h-full z-10">
        <div className="mb-6 h-16 w-16 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(212,17,50,0.3)]">
          {/* <span className="material-symbols-outlined text-primary text-[32px]">content_cut</span> */}
          <img src="/logo.png" alt="Logo Garagem Detail" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-slate-900 dark:text-white tracking-tight text-4xl font-extrabold leading-tight text-center mb-3">Garagem Detail</h1>
        <p className="text-gray-600 dark:text-gray-300 text-base text-center max-w-xs opacity-90">Seu estilo, no seu tempo.<br />Agende seu corte em segundos.</p>
      </div>
    </div>
    <div className="flex-1 flex flex-col justify-start px-6 pt-8 pb-8 gap-4 w-full max-w-md mx-auto">
      <button onClick={onStart} className="group relative flex w-full items-center justify-center rounded-xl h-14 bg-primary hover:bg-primary-dark transition-all shadow-lg shadow-primary/25">
        <span className="text-white text-lg font-bold">Agendar</span>
      </button>
      <button onClick={onAdmin} className="flex w-full items-center justify-center gap-2 rounded-lg h-12 text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[20px]">storefront</span>
        <span className="text-sm font-semibold">Painel Administrativo</span>
      </button>
    </div>
  </div>
);

const HomeScreen: React.FC<{
  onAgendar: () => void;
  onChat: () => void;
  onPerfil: () => void;
  onMais: () => void;
}> = ({ onAgendar, onChat, onPerfil, onMais }) => (
  <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark transition-colors">
    <header className="sticky top-0 z-50 flex items-center justify-center bg-white/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 border-b border-gray-200 dark:border-white/5 gap-2 transition-colors">
      <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
      <h2 className="text-lg font-bold leading-tight tracking-tight text-center text-slate-900 dark:text-white">Garagem Detail</h2>
    </header>
    <main className="flex-1 flex flex-col px-4 pt-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Vamos agendar o seu<br />corte?</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={onAgendar} className="relative group flex flex-col items-start justify-end p-4 h-40 w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">
          <div className="absolute inset-0 z-0">
            <img alt="Agendamento" className="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbUv_-lMKHndUn4JTalhq50b_lZxMNuTjD0Tq15Kr4PZuSonpCNqY9r-GzE6A4RUVeOl947gmKD38S8XxgRrPpRjzO3nd2RH7EY5ZLdn0RTcUF-geos6tbYAqxaCCkZu4xxwYwIBwJ0cP1L_43YG1lBjMg_FZGjS84dSsAxG06H6DVq7St4chZBRIXF5kOEjFsOJI4m1humE6qwmH69brUzIHQd7YR2aUl3gbIy1r8rOXQq_8gwB_G9C7tLBBjeVNZLM4fAenpibIo" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          </div>
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className="mb-1 rounded-full bg-primary p-2 text-white">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            </div>
            <span className="text-left text-sm font-bold leading-tight text-white">Fazer o meu agendamento</span>
          </div>
        </button>
        <button onClick={onChat} className="relative group flex flex-col items-start justify-end p-4 h-40 w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/5 active:scale-[0.98] transition-all">
          <div className="absolute inset-0 z-0">
            <img alt="Barbeiro" className="h-full w-full object-cover" src="/renan.png" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          </div>
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className="mb-1 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm">
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </div>
            <span className="text-left text-sm font-bold leading-tight text-white">Falar com o Barbeiro</span>
          </div>
        </button>
      </div>
      <div className="flex flex-col flex-1 items-start gap-4 text-slate-800 dark:text-white px-2">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">Horários de Funcionamento</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Seg - Sex: 09:00 - 20:00</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sáb: 09:00 - 18:00</p>
          </div>
        </div>
        <div className="flex items-start gap-3 mt-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="material-symbols-outlined">location_on</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">Endereço</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Rua Osman Loureiro, 33</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Centro, Água Branca - AL</p>
          </div>
        </div>
      </div>
    </main>
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg pt-2 transition-colors">
      <div className="flex items-center justify-around px-2 pb-6">
        <button onClick={onAgendar} className="flex flex-1 flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined text-[24px] filled">calendar_month</span>
          <span className="text-[10px] font-medium uppercase">Agendar</span>
        </button>
        <button onClick={onPerfil} className="flex flex-1 flex-col items-center gap-1 text-gray-500 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[24px]">calendar_month</span>
          <span className="text-[10px] font-medium uppercase">Meus Agendamentos</span>
        </button>
        <button onClick={onMais} className="flex flex-1 flex-col items-center gap-1 text-gray-500 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[24px]">logout</span>
          <span className="text-[10px] font-medium uppercase">Sair</span>
        </button>
      </div>
    </nav>
  </div>
);

const SelectServicesScreen: React.FC<{
  booking: BookingState;
  setBooking: React.Dispatch<React.SetStateAction<BookingState>>;
  onNext: () => void;
  onBack: () => void;
  services: Service[];
}> = ({ booking, setBooking, onNext, onBack, services }) => {
  const toggleService = (service: Service) => {
    setBooking(prev => {
      const exists = prev.selectedServices.find(s => s.id === service.id);
      if (exists) {
        return { ...prev, selectedServices: prev.selectedServices.filter(s => s.id !== service.id) };
      }
      return { ...prev, selectedServices: [...prev.selectedServices, service] };
    });
  };

  const totalPrice = booking.selectedServices.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-white/5 flex items-center p-4 transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Serviços</h2>
      </header>
      <main className="flex-1 p-4 pb-32 max-w-md mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold mb-2 text-slate-900 dark:text-white">Escolha o Serviço</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Selecione um ou mais serviços para o seu agendamento.</p>
        </div>
        <div className="mb-8 space-y-4">
          <input
            type="tel"
            placeholder="(00) 00000-0000"
            value={booking.customerPhone}
            onChange={(e) => {
              const val = e.target.value;
              setBooking(prev => ({ ...prev, customerPhone: val }));
              if (val.length >= 8) {
                // Debounce lookup could be better, but simple is ok for now
                // Debounce lookup could be better, but simple is ok for now
                supabase.from('clients')
                  .select('name')
                  .eq('phone', val)
                  .single()
                  .then(({ data }) => {
                    if (data && data.name) {
                      setBooking(prev => ({ ...prev, customerName: data.name }));
                    }
                  });
              }
            }}
            className="w-full rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-primary focus:border-primary placeholder:text-gray-400"
          />
          <input
            type="text"
            placeholder="Seu nome completo"
            value={booking.customerName}
            onChange={(e) => setBooking({ ...booking, customerName: e.target.value })}
            className="w-full rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-primary focus:border-primary placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-4">
          {services.map(service => (
            <label key={service.id} className={`relative flex gap-4 p-4 rounded-xl bg-white dark:bg-surface-dark border transition-all cursor-pointer ${booking.selectedServices.some(s => s.id === service.id) ? 'border-primary' : 'border-gray-200 dark:border-transparent'} shadow-sm hover:shadow-md`}>
              <div className="size-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
                <img
                  src={service.imageUrl}
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center'); e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-gray-400">image_not_supported</span>'; }}
                  className="w-full h-full object-cover"
                  alt={service.name}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{service.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mt-1">{service.description}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-primary font-bold text-sm">R$ {service.price.toFixed(2)}</span>
                  <span className="text-gray-500 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {service.duration} min</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={booking.selectedServices.some(s => s.id === service.id)}
                onChange={() => toggleService(service)}
                className="hidden"
              />
            </label>
          ))}
        </div>
      </main>
      <footer className="fixed bottom-0 w-full bg-white/95 dark:bg-surface-dark/95 backdrop-blur-lg border-t border-gray-100 dark:border-white/5 p-5 pb-8 transition-colors">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400 text-xs">Total estimado</span>
            <span className="text-2xl font-bold text-primary">R$ {totalPrice.toFixed(2)}</span>
          </div>
          <button
            disabled={booking.selectedServices.length === 0 || !booking.customerName}
            onClick={onNext}
            className="flex-1 bg-primary text-white font-bold py-3.5 px-6 rounded-lg shadow-lg disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      </footer>
    </div>
  );
};

const SelectDateTimeScreen: React.FC<{
  booking: BookingState;
  setBooking: React.Dispatch<React.SetStateAction<BookingState>>;
  onNext: () => void;
  onBack: () => void;
}> = ({ booking, setBooking, onNext, onBack }) => {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const nextDays = useMemo(() => getNextDays(14), []);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [workHours, setWorkHours] = useState<any[]>([]);
  const [minAdvance, setMinAdvance] = useState(0);

  useEffect(() => {
    const initData = async () => {
      // Fetch Work Hours
      const { data: wh } = await supabase.from('work_hours').select('*');
      if (wh) setWorkHours(wh);

      // Fetch Blocks
      const { data: blocks } = await supabase.from('blocked_slots').select('*');
      if (blocks) {
        setBlockedSlots(blocks.map((b: any) => ({
          ...b,
          time: b.time?.slice(0, 5) || b.time
        })));
      }

      // Fetch Appointments with Service Durations
      const { data: apps } = await supabase
        .from('appointments')
        .select('*, services:appointment_services(service:services(duration))')
        .neq('status', 'CANCELLED');

      if (apps) {
        setExistingAppointments(apps.map((a: any) => {
          // Calculate total duration for this existing appointment
          const totalDuration = a.services?.reduce((sum: number, item: any) => sum + (item.service?.duration || 30), 0) || 30;
          return {
            ...a,
            date: a.appointment_date,
            time: a.appointment_time?.slice(0, 5) || a.appointment_time,
            duration: totalDuration
          };
        }));
      }

      // Fetch Settings: min_advance_minutes
      const { data: settingsData } = await supabase.from('settings').select('*').eq('key', 'min_advance_minutes').single();
      if (settingsData) {
        setMinAdvance(parseInt(settingsData.value) || 0); // Default 0
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const selectedDateStr = nextDays[selectedDateIndex].dateStr;
    const dateObj = new Date(selectedDateStr + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();

    const dayConfig = workHours.find(w => w.day_of_week === dayOfWeek);

    if (!dayConfig || !dayConfig.is_open) {
      setAvailableTimes([]);
      return;
    }

    const times: string[] = [];
    const step = 15;
    const myDuration = booking.selectedServices.reduce((sum, s) => sum + s.duration, 0) || 30;

    const generateSlots = (start: string, end: string) => {
      if (!start || !end) return;
      let [h, m] = start.slice(0, 5).split(':').map(Number);
      const [endH, endM] = end.slice(0, 5).split(':').map(Number);

      const shiftStartMins = h * 60 + m; // Start of the shift
      const shiftEndMins = endH * 60 + endM; // End of the shift

      const toMins = (t: string) => {
        const [hh, mm] = t.split(':').map(Number);
        return hh * 60 + mm;
      };

      while (true) {
        const currentSlotStart = h * 60 + m;
        const currentSlotEnd = currentSlotStart + myDuration;

        if (currentSlotEnd > shiftEndMins) break;

        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        const now = new Date();
        const isToday = selectedDateStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        let isPast = false;

        if (isToday) {
          const nowMins = now.getHours() * 60 + now.getMinutes();
          // Enforce Minimum Advance Time
          if (currentSlotStart <= (nowMins + minAdvance)) isPast = true;
        }

        let isBlocked = false;
        if (!isPast) {
          for (const bloc of blockedSlots) {
            if (bloc.date === selectedDateStr) {
              const blockStart = toMins(bloc.time);
              if (blockStart >= currentSlotStart && blockStart < currentSlotEnd) {
                isBlocked = true;
                break;
              }
            }
          }

          if (!isBlocked) {
            for (const app of existingAppointments) {
              if (app.date === selectedDateStr && app.status !== 'CANCELLED') {
                const appStart = toMins(app.time);
                const appEnd = appStart + app.duration;
                if (currentSlotStart < appEnd && currentSlotEnd > appStart) {
                  isBlocked = true;
                  break;
                }
              }
            }
          }
        }

        if (!isPast && !isBlocked) {
          times.push(timeStr);
        }

        m += step;
        if (m >= 60) {
          h += Math.floor(m / 60);
          m = m % 60;
        }
      }
    };

    if (dayConfig.is_morning_open !== false) {
      generateSlots(dayConfig.start_time_1, dayConfig.end_time_1);
    }
    if (dayConfig.start_time_2 && dayConfig.end_time_2 && dayConfig.is_afternoon_open !== false) {
      generateSlots(dayConfig.start_time_2, dayConfig.end_time_2);
    }

    setAvailableTimes(times);

  }, [selectedDateIndex, blockedSlots, workHours, existingAppointments, booking.selectedServices, minAdvance]);

  const handleTimeSelect = (time: string) => {
    setBooking({ ...booking, selectedDate: nextDays[selectedDateIndex].dateStr, selectedTime: time });
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="p-4 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-background-dark flex items-center justify-between transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <span className="font-bold text-slate-900 dark:text-white">Escolha o Horário</span>
        <div className="size-10"></div>
      </header>
      <main className="p-6">
        <h3 className="text-slate-900 dark:text-white font-bold mb-4">Dias Disponíveis</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 mb-6">
          {nextDays.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDateIndex(i)}
              className={`min-w-[70px] p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${selectedDateIndex === i
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/5 text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                }`}
            >
              <span className="text-[10px] font-bold uppercase">{d.weekDay}</span>
              <span className="text-xl font-bold">{d.dayNum}</span>
            </button>
          ))}
        </div>

        <h3 className="text-slate-900 dark:text-white font-bold mb-4">Horários Livres</h3>
        <div className="grid grid-cols-4 gap-3">
          {availableTimes.map((t) => (
            <button
              key={t}
              onClick={() => handleTimeSelect(t)}
              className={`p-3 rounded-xl border font-bold text-sm transition-all ${booking.selectedTime === t && booking.selectedDate === nextDays[selectedDateIndex].dateStr
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white'
                : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/5 text-slate-900 dark:text-white hover:border-gray-300 dark:hover:border-white/20'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </main>
      <footer className="p-4 mt-auto border-t border-gray-200 dark:border-white/5 bg-white dark:bg-background-dark transition-colors">
        <button
          onClick={onNext}
          disabled={!booking.selectedTime}
          className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20"
        >
          Continuar
        </button>
      </footer>
    </div>
  );
};

const AdminFinanceScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [dateRange, setDateRange] = useState({
    start: format(startOfDay(new Date()), 'yyyy-MM-01'),
    end: format(startOfDay(new Date()), 'yyyy-MM-dd')
  });

  // No local 'stats' state. We use derived state (useMemo) for instant updates.

  const [expenses, setExpenses] = useState<any[]>([]);
  const [rawAppointments, setRawAppointments] = useState<any[]>([]);

  // Expenses Inputs
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Produto');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses'>('dashboard');

  const loadData = async () => {
    // 1. Fetch Expenses
    const { data: expData } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (expData) setExpenses(expData);

    // 2. Fetch Appointments
    const { data: appData } = await supabase
      .from('appointments')
      .select('*, services:appointment_services(service:services(name)), clients(name)')
      .eq('status', 'COMPLETED');

    if (appData) {
      const mappedApps = appData.map((a: any) => ({
        ...a,
        date: a.appointment_date,
        services: a.services.map((s: any) => ({ name: s.service.name })),
        clientName: a.clients?.name || 'Cliente'
      }));
      setRawAppointments(mappedApps);
      // No processStats call here. React will auto-calculate via useMemo.
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- DERIVED STATE (STATS) ---
  const stats = useMemo(() => {
    // Filter by Date Range
    const filteredApps = rawAppointments.filter(a => a.date >= dateRange.start && a.date <= dateRange.end);
    const filteredExps = expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end);

    // 1. Revenue & Expenses
    const revenue = filteredApps.reduce((sum, a) => sum + a.total_price, 0);
    const totalExpenses = filteredExps.reduce((sum, e) => sum + e.amount, 0);
    const profit = revenue - totalExpenses;

    // 2. Ticket Average
    const count = filteredApps.length;
    const ticketAverage = count > 0 ? revenue / count : 0;

    // 3. Projection (Current Month)
    const today = new Date();
    const isCurrentMonth = dateRange.start.substring(0, 7) === today.toISOString().substring(0, 7);
    let projection = 0;
    if (isCurrentMonth) {
      const daysPassed = today.getDate();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      if (daysPassed > 0) {
        projection = (revenue / daysPassed) * daysInMonth;
      }
    }

    // 4. Comparison (Previous Month)
    const prevStart = format(addDays(parseISO(dateRange.start), -30), 'yyyy-MM-dd');
    const prevEnd = format(addDays(parseISO(dateRange.end), -30), 'yyyy-MM-dd');
    const prevRevenue = rawAppointments
      .filter(a => a.date >= prevStart && a.date <= prevEnd)
      .reduce((sum, a) => sum + a.total_price, 0);

    // 5. Trend Chart (Daily)
    const dailyMap: any = {};
    filteredApps.forEach(a => {
      dailyMap[a.date] = (dailyMap[a.date] || 0) + a.total_price;
    });
    const revenueHistory = Object.entries(dailyMap)
      .map(([date, total]) => ({ date: format(parseISO(date), 'dd/MM'), total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 6. Service Ranking
    const serviceMap: any = {};
    filteredApps.forEach(a => {
      a.services.forEach((s: any) => {
        serviceMap[s.name] = (serviceMap[s.name] || 0) + 1;
      });
    });
    const serviceRanking = Object.entries(serviceMap)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 7. Top Clients
    const clientMap: any = {};
    filteredApps.forEach(a => {
      clientMap[a.clientName] = (clientMap[a.clientName] || 0) + a.total_price;
    });
    const topClients = Object.entries(clientMap)
      .map(([name, total]) => ({ name, total: Number(total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // 8. LTV (Lifetime Value) - Based on ALL data
    const allUniqueClients = new Set(rawAppointments.map(a => a.client_id)).size;
    const allTimeRevenue = rawAppointments.reduce((sum, a) => sum + a.total_price, 0);
    const ltv = allUniqueClients > 0 ? allTimeRevenue / allUniqueClients : 0;

    // 9. Seasonal Data (Traffic by Day of Week)
    const weekCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    filteredApps.forEach(a => {
      const day = parseISO(a.date).getDay();
      weekCounts[day as keyof typeof weekCounts] += 1;
    });
    const daysLabel = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const seasonalData = Object.entries(weekCounts).map(([day, count]) => ({
      day: daysLabel[Number(day)],
      count: count
    }));

    return {
      revenue,
      expenses: totalExpenses,
      profit,
      ticketAverage,
      projection,
      prevMonthRevenue: prevRevenue,
      revenueHistory,
      serviceRanking,
      topClients,
      ltv,
      seasonalData
    };
  }, [rawAppointments, expenses, dateRange]);

  const handleMonthFilter = (monthOffset: number) => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), monthOffset, 1);
    const start = format(startOfDay(targetDate), 'yyyy-MM-01');
    const end = format(addDays(new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0), 0), 'yyyy-MM-dd');
    setDateRange({ start, end });
  }

  const handleAddExpense = async () => {
    if (!desc || !amount) return alert('Preencha descrição e valor');
    const { error } = await supabase.from('expenses').insert({
      description: desc,
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString().split('T')[0]
    });

    if (error) alert('Erro ao adicionar: ' + error.message);
    else {
      setDesc(''); setAmount('');
      loadData();
      alert('Despesa adicionada!');
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (!window.confirm('Deletar despesa?')) return;
    supabase.from('expenses').delete().eq('id', id)
      .then(() => loadData());
  };

  const handlePrint = () => {
    window.print();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors print:bg-white print:p-0">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors print:hidden">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Financeiro Avançado</h2>
        <button onClick={handlePrint} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">print</span></button>
      </header>

      <main className="p-4 space-y-6 max-w-4xl mx-auto w-full pb-24 print:max-w-none print:pb-0">

        {/* Date Filter & Quick Filters */}
        <div className="space-y-3 print:hidden">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs font-bold text-gray-500 uppercase">Início</label>
              <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 rounded-lg p-2 text-slate-900 dark:text-white border border-gray-200 dark:border-white/10" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs font-bold text-gray-500 uppercase">Fim</label>
              <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 rounded-lg p-2 text-slate-900 dark:text-white border border-gray-200 dark:border-white/10" />
            </div>
          </div>

          {/* Quick Month Selectors */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, idx) => {
              // Fix: Parse manually to avoid Timezone issues with new Date("YYYY-MM-DD")
              const [y, M] = dateRange.start.split('-').map(Number);
              const currentYear = new Date().getFullYear();
              const isActive = (M - 1) === idx && y === currentYear;

              return (
                <button
                  key={m}
                  onClick={() => handleMonthFilter(idx)}
                  className={`px-4 py-2 border rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${isActive
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-slate-900 dark:text-white'
                    }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

        </div>


        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl print:hidden">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white dark:bg-surface-dark shadow text-slate-900 dark:text-white' : 'text-gray-500'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('expenses')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'expenses' ? 'bg-white dark:bg-surface-dark shadow text-slate-900 dark:text-white' : 'text-gray-500'}`}>Despesas</button>
        </div>

        {
          activeTab === 'dashboard' ? (
            <div className="space-y-6 animate-fade-in">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold">Faturamento</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">R$ {stats.revenue.toFixed(2)}</h3>
                  {stats.prevMonthRevenue > 0 && (
                    <p className={`text-xs font-bold mt-1 ${stats.revenue >= stats.prevMonthRevenue ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.revenue >= stats.prevMonthRevenue ? '▲' : '▼'} vs mês anterior
                    </p>
                  )}
                </div>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold">Lucro Líquido</p>
                  <h3 className={`text-2xl font-black ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>R$ {stats.profit.toFixed(2)}</h3>
                  <p className="text-xs text-gray-400 mt-1">Margem: {stats.revenue > 0 ? ((stats.profit / stats.revenue) * 100).toFixed(0) : 0}%</p>
                </div>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold">Ticket Médio</p>
                  <h3 className="text-2xl font-black text-blue-500">R$ {stats.ticketAverage.toFixed(2)}</h3>
                  <p className="text-xs text-gray-400 mt-1">por atendimento</p>
                </div>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold">LTV (Lifetime Value)</p>
                  <h3 className="text-2xl font-black text-purple-500">R$ {stats.ltv.toFixed(2)}</h3>
                  <p className="text-xs text-gray-400 mt-1">Média por cliente</p>
                </div>
              </div>

              {/* Main Charts Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm min-h-[300px]">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Tendência de Receita</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.revenueHistory}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#222', borderRadius: '8px', border: 'none', color: '#fff' }}
                          formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                        />
                        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Seasonality Chart */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm min-h-[300px]">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">📊 Fluxo de Agendamentos (Filtro Atual)</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.seasonalData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="day" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#222', borderRadius: '8px', border: 'none', color: '#fff' }}
                          formatter={(value: number) => [`${value}`, 'Agendamentos']}
                        />
                        <Bar dataKey="count" fill="#FF8042" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Tables Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Services */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Top Serviços</h3>
                  <div className="space-y-3">
                    {stats.serviceRanking.map((s: any, idx: number) => (
                      <div key={s.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                            {idx + 1}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-500">{s.count} agend.</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Clients */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Top 5 Clientes</h3>
                  <div className="space-y-3">
                    {stats.topClients.map((c: any, idx: number) => (
                      <div key={c.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary`}>
                            {c.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[120px]">{c.name}</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">R$ {c.total.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm print:hidden">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Adicionar Despesa</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descrição (ex: Energia)" className="col-span-2 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Valor (R$)" className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
                  <select value={category} onChange={e => setCategory(e.target.value)} className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white">
                    <option>Produto</option>
                    <option>Infraestrutura</option>
                    <option>Marketing</option>
                    <option>Pessoal</option>
                    <option>Outros</option>
                  </select>
                </div>
                <button onClick={handleAddExpense} className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20">Adicionar Despesa</button>
              </div>

              <div className="space-y-3">
                {expenses.map(e => (
                  <div key={e.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{e.description}</p>
                      <p className="text-xs text-gray-500">{e.category} • {formatDateToBRL(e.date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-red-500">- R$ {e.amount.toFixed(2)}</span>
                      <button onClick={() => handleDeleteExpense(e.id)} className="size-8 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 flex items-center justify-center print:hidden"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

      </main >
    </div >
  );
};

const AdminBlockScheduleScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);

  const fetchBlocks = async () => {
    const { data } = await supabase.from('blocked_slots').select('*');
    if (data) setBlockedSlots(data);
  };

  useEffect(() => { fetchBlocks(); }, []);

  const handleBlock = async () => {
    if (!date || !time) return alert('Selecione data e hora');
    const { error } = await supabase.from('blocked_slots').insert({
      date,
      time,
      reason: reason || 'Bloqueado pelo Admin'
    });

    if (error) {
      alert('Erro ao bloquear: ' + error.message);
    } else {
      setDate(''); setTime(''); setReason('');
      fetchBlocks();
      alert('Horário bloqueado!');
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Liberar este horário?')) return;
    supabase.from('blocked_slots').delete().eq('id', id)
      .then(() => fetchBlocks());
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Bloquear Agenda</h2>
        <div className="size-10"></div>
      </header>
      <main className="p-4 space-y-6 max-w-md mx-auto w-full">
        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl space-y-3 border border-gray-200 dark:border-white/10 transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-white">Novo Bloqueio</h3>
          <input type="date" className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" value={date} onChange={e => setDate(e.target.value)} />
          <input type="time" className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" value={time} onChange={e => setTime(e.target.value)} />
          <input type="text" className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" placeholder="Motivo (opcional)" value={reason} onChange={e => setReason(e.target.value)} />
          <button onClick={handleBlock} className="w-full bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 py-3 rounded-lg font-bold border border-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors">Bloquear Horário</button>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Bloqueios Ativos</h3>
          {blockedSlots.map(b => (
            <div key={b.id} className="bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/5 flex justify-between items-center transition-colors">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{new Date(b.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {b.time}</p>
                <p className="text-xs text-gray-500">{b.reason}</p>
              </div>
              <button onClick={() => handleDelete(b.id)} className="text-gray-400 hover:text-red-500 dark:hover:text-white transition-colors"><span className="material-symbols-outlined">delete</span></button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const ReviewScreen: React.FC<{
  booking: BookingState;
  onConfirm: () => void;
  onBack: () => void;
}> = ({ booking, onConfirm, onBack }) => {
  const totalPrice = booking.selectedServices.reduce((sum, s) => sum + s.price, 0);
  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col pb-24 transition-colors">
      <header className="sticky top-0 z-50 flex items-center p-4 bg-white/95 dark:bg-background-dark/95 border-b border-gray-200 dark:border-white/5 transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10">
          <span className="material-symbols-outlined text-gray-600 dark:text-white">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Revisar Agendamento</h2>
      </header>
      <main className="p-4 space-y-6 max-w-md mx-auto w-full">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Confira os detalhes</h1>
          <p className="text-sm text-gray-500 mt-1">Verifique as informações antes de confirmar.</p>
        </div>
        <section className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-4 flex gap-4 items-center">
            <div className="size-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">person</span></div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold">Cliente</span>
              <p className="font-medium text-sm text-slate-900 dark:text-white">{booking.customerName} • {booking.customerPhone}</p>
            </div>
          </div>
          <div className="p-4 flex gap-4 items-center border-t border-gray-100 dark:border-white/5 transition-colors">
            <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">calendar_month</span></div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold">Data e Hora</span>
              <p className="font-medium text-sm text-slate-900 dark:text-white">{formatDateToBRL(booking.selectedDate)} • {booking.selectedTime}</p>
            </div>
          </div>
        </section>
        <section className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-white/5 p-5 shadow-sm transition-colors">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-slate-900 dark:text-white"><span className="material-symbols-outlined text-primary text-xl">receipt_long</span> Resumo</h3>
          <div className="space-y-4">
            {booking.selectedServices.map(s => (
              <div key={s.id} className="flex justify-between text-sm text-slate-900 dark:text-white">
                <div>
                  <p className="font-bold">{s.name}</p>
                  <span className="text-xs text-gray-500">{s.duration} min</span>
                </div>
                <p className="font-bold">R$ {s.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="my-5 border-t border-gray-200 dark:border-white/10 border-dashed"></div>
          <div className="flex justify-between items-center">
            <p className="text-gray-500 font-medium">Total a pagar</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">R$ {totalPrice.toFixed(2)}</p>
          </div>
        </section>
      </main>
      <footer className="fixed bottom-0 w-full p-4 bg-white/95 dark:bg-background-dark border-t border-gray-200 dark:border-white/5 z-40 transition-colors">
        <button onClick={onConfirm} className="w-full bg-primary h-14 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 group shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
          <span>Confirmar Agendamento</span>
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </footer>
    </div>
  );
};

const MyAppointmentsScreen: React.FC<{
  appointments: Appointment[];
  onBack: () => void;
  onNew: () => void;
  onRefresh: () => void;
}> = ({ appointments, onBack, onNew, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return appointments.filter(app => {
      // Date comparison
      if (app.date > currentDate) return activeTab === 'upcoming';
      if (app.date < currentDate) return activeTab === 'past';

      // If date is today, check time
      const [h, m] = app.time.split(':').map(Number);
      const appTime = h * 60 + m;

      if (activeTab === 'upcoming') {
        return appTime > currentTime;
      } else {
        return appTime <= currentTime;
      }
    }).sort((a, b) => { // Sort
      if (activeTab === 'upcoming') {
        // Ascending for upcoming
        return (a.date + a.time).localeCompare(b.date + b.time);
      } else {
        // Descending for past
        return (b.date + b.time).localeCompare(a.date + a.time);
      }
    });
  }, [appointments, activeTab]);

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-20 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"><span className="material-symbols-outlined text-gray-600 dark:text-white">arrow_back_ios_new</span></button>
        <h1 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Meus Agendamentos</h1>
      </header>
      <main className="p-4 space-y-6 max-w-md mx-auto w-full flex-1">
        <div className="flex bg-gray-100 dark:bg-surface-dark p-1 rounded-xl transition-colors">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'upcoming' ? 'bg-primary text-white shadow-sm' : 'text-gray-500'}`}
          >
            Próximos
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'past' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
          >
            Anteriores
          </button>
        </div>
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            {activeTab === 'upcoming' ? 'Agendamentos Futuros' : 'Histórico'}
          </h2>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-surface-dark/30 rounded-3xl border border-gray-200 dark:border-white/5 border-dashed transition-colors">
              <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-700 mb-2">event_busy</span>
              <p className="text-gray-500 text-sm">Nenhum agendamento {activeTab === 'upcoming' ? 'marcado' : 'encontrado'}.</p>
            </div>
          ) : (
            filteredAppointments.map(app => (
              <div key={app.id} className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-white/5 mb-4 overflow-hidden shadow-sm relative hover:border-primary/20 dark:hover:border-white/10 transition-all">
                <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-xl tracking-wider uppercase ${app.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/20 text-green-700 dark:text-green-400'
                  }`}>{app.status}</div>
                <div className="p-4 flex gap-4">
                  <div className={`size-16 rounded-xl flex flex-col items-center justify-center border transition-colors ${activeTab === 'past' ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'
                    }`}>
                    <span className="text-[10px] font-bold uppercase text-gray-500">Dia</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{app.date.split('-')[2]}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{app.services?.[0]?.name || 'Serviço não especificado'} {app.services?.length > 1 ? `+ ${app.services.length - 1} serviço` : ''}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_month</span> {formatDateToBRL(app.date)}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {app.time}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02] transition-colors">
                  <span className="font-bold text-slate-900 dark:text-white">R$ {app.totalPrice.toFixed(2)}</span>
                  {activeTab === 'upcoming' && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Deseja realmente cancelar este agendamento?')) {
                          const { error } = await supabase.from('appointments').delete().eq('id', app.id);
                          if (error) {
                            console.error('Erro ao cancelar:', error);
                            alert('Não foi possível cancelar o agendamento.');
                          } else {
                            onRefresh();
                          }
                        }
                      }}
                      className="text-primary text-xs font-bold uppercase flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span> Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
        <div className="mt-8 p-6 rounded-3xl bg-primary/5 border border-primary/20 text-center shadow-sm">
          <div className="p-4 bg-primary/10 rounded-2xl inline-flex text-primary mb-4 shadow-inner"><span className="material-symbols-outlined text-[32px]">add_circle</span></div>
          <h3 className="font-bold text-lg mb-1 text-slate-900 dark:text-white">Novo Agendamento</h3>
          <p className="text-sm text-gray-500 mb-6 px-4">Precisa de um trato no visual? Escolha um novo serviço e horário.</p>
          <button onClick={onNew} className="w-full py-3.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">Agendar Horário</button>
        </div>
      </main>
    </div>
  );
};

// --- Chat Screens ---

const AdminChatListScreen: React.FC<{ onBack: () => void; onSelectChat: (clientId: string, clientName: string) => void }> = ({ onBack, onSelectChat }) => {
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    const fetchConvos = async () => {
      // Fetch all messages and group by client on frontend mostly for simplicity (or use a view in Supabase in real app)
      // We'll fetch all unique clients from messages

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, clients!chat_messages_client_id_fkey(name, phone)')
        .order('sent_at', { ascending: false });

      if (data) {
        const convos: any[] = [];
        const clientIds = new Set();

        data.forEach((msg: any) => {
          if (msg.client_id && !clientIds.has(msg.client_id)) {
            clientIds.add(msg.client_id);
            convos.push({
              id: String(msg.client_id),
              name: msg.clients?.name || 'Unknown',
              phone: msg.clients?.phone || '',
              last_message: msg.sent_at,
              // msg_count: ... 
            });
          }
        });
        setConversations(convos);
      }
    };

    fetchConvos();
    const interval = setInterval(fetchConvos, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Conversas</h2>
        <div className="size-10"></div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">Nenhuma conversa iniciada.</div>
        ) : (conversations.map(c => (
          <button key={c.id} onClick={() => onSelectChat(c.id, c.name)} className="w-full bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-white/5 flex gap-4 items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm">
            <div className="size-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-lg font-bold border border-primary/20">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-slate-900 dark:text-white truncate">{c.name}</h3>
                <span className="text-[10px] text-gray-400">{new Date(c.last_message).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.phone}</p>
            </div>
          </button>
        )))}
      </main>
    </div>
  );
};

const ChatScreen: React.FC<{
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onRegister: (identity: { name: string, phone: string }) => void;
  onBack: () => void;
  currentUserRole: 'CUSTOMER' | 'BARBER';
  customerIdentity?: { name: string; phone: string };
  chatClientId?: string; // For Admin
}> = ({ messages, onSendMessage, onRegister, onBack, currentUserRole, customerIdentity, chatClientId }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Local state for identifying customer if not provided
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  // Determine if we need identity. 
  // If Customer role and no identity provided via props, show form.
  const needsIdentity = currentUserRole === 'CUSTOMER' && !customerIdentity?.phone;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, needsIdentity]);

  const handleStartChat = () => {
    if (!tempName || !tempPhone) {
      alert("Por favor, informe seu nome e telefone para iniciar o chat.");
      return;
    }
    onRegister({ name: tempName, phone: tempPhone });
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const otherPersonName = currentUserRole === 'CUSTOMER' ? 'Renan Sandes' : (customerIdentity?.name || 'Cliente');
  const otherPersonRole = currentUserRole === 'CUSTOMER' ? 'Barbeiro' : 'Cliente';

  if (needsIdentity) {
    return (
      <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 max-w-md mx-auto w-full justify-center transition-colors">
        <button onClick={onBack} className="absolute top-6 left-6 size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <div className="text-center mb-8">
          <div className="size-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20"><span className="material-symbols-outlined text-4xl filled">chat</span></div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quase lá!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Para falar com o barbeiro, precisamos saber quem é você.</p>
        </div>
        <div className="space-y-4">
          <input value={tempName} onChange={e => setTempName(e.target.value)} className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Seu Nome" />
          <input value={tempPhone} onChange={e => setTempPhone(e.target.value)} className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Seu Telefone (WhatsApp)" />
          <button onClick={handleStartChat} className="w-full bg-primary py-4 rounded-xl font-bold shadow-lg shadow-primary/20 text-white">Iniciar Chat</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark h-screen flex flex-col transition-colors">
      <header className="p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center gap-3 transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="size-10 rounded-full bg-gray-200 dark:bg-surface-dark border border-gray-200 dark:border-white/5 flex items-center justify-center overflow-hidden">
          <img src={currentUserRole === 'CUSTOMER' ? "/renan.png" : "/logo.png"} alt="Avatar" className="h-full w-full object-cover" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">{otherPersonName}</h2>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-green-500"></span>
            <span className="text-[10px] text-gray-500 font-bold uppercase">{otherPersonRole} Online</span>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-gray-50 dark:bg-background-dark transition-colors">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === currentUserRole ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === currentUserRole
              ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10'
              : 'bg-white dark:bg-surface-dark text-slate-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-white/5 shadow-sm'
              }`}>
              {msg.text}
              <div className={`text-[10px] mt-1 opacity-50 ${msg.sender === currentUserRole ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="p-4 bg-white/95 dark:bg-surface-dark/50 border-t border-gray-200 dark:border-white/5 pb-8 transition-colors">
        <div className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-100 dark:bg-surface-dark border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary text-slate-900 dark:text-white placeholder:text-gray-400"
          />
          <button
            onClick={handleSend}
            className="size-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined filled">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
};



const AdminWeeklyScheduleScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState<any | null>(null);
  const [interval, setInterval] = useState('15');
  const [minAdvance, setMinAdvance] = useState('0');

  const fetchSchedule = async () => {
    // Fetch Work Hours
    const { data: wh } = await supabase
      .from('work_hours')
      .select('*')
      .order('day_of_week');

    if (wh) setSchedule(wh);

    // Fetch Interval
    const { data: settingsData } = await supabase.from('settings').select('*').eq('key', 'interval_minutes').single();
    if (settingsData) setInterval(settingsData.value);

    // Fetch Min Advance
    const { data: advData } = await supabase.from('settings').select('*').eq('key', 'min_advance_minutes').single();
    if (advData) setMinAdvance(advData.value);

    setLoading(false);
  };

  useEffect(() => { fetchSchedule(); }, []);

  const handleToggleDay = async (day: any) => {
    const newVal = !day.is_open;
    // Optimistic
    setSchedule(prev => prev.map(d => d.id === day.id ? { ...d, is_open: newVal } : d));

    await supabase.from('work_hours').update({ is_open: newVal }).eq('id', day.id);
  };

  const handleSaveDay = async () => {
    if (!editingDay) return;
    const { error } = await supabase.from('work_hours').update({
      start_time_1: editingDay.start_time_1,
      end_time_1: editingDay.end_time_1,
      start_time_2: editingDay.start_time_2,
      end_time_2: editingDay.end_time_2,
      is_morning_open: editingDay.is_morning_open,
      is_afternoon_open: editingDay.is_afternoon_open
    }).eq('id', editingDay.id);

    if (error) alert('Erro ao salvar: ' + error.message);
    else {
      setEditingDay(null);
      fetchSchedule();
    }
  };

  const handleSaveInterval = async (newInterval: string) => {
    setInterval(newInterval);
    await supabase.from('settings').upsert({ key: 'interval_minutes', value: newInterval });
  };

  const handleSaveMinAdvance = async (newVal: string) => {
    setMinAdvance(newVal);
    await supabase.from('settings').upsert({ key: 'min_advance_minutes', value: newVal });
  };

  const dayNames = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-primary text-white flex items-center justify-between shadow-md">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-white/20 text-white"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-lg">Horários de Atendimento</h2>
        <div className="size-10"></div>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto w-full pb-24">
        {/* Interval Setting */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
            <label className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-1">Intervalo</label>
            <select
              value={interval}
              onChange={e => handleSaveInterval(e.target.value)}
              className="w-full bg-gray-50 dark:bg-background-dark p-2 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-primary/50 transition-colors"
            >
              <option value="15">15 min</option>
              <option value="20">20 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hora</option>
            </select>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
            <label className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-1">Antecedência</label>
            <select
              value={minAdvance}
              onChange={e => handleSaveMinAdvance(e.target.value)}
              className="w-full bg-gray-50 dark:bg-background-dark p-2 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-primary/50 transition-colors"
            >
              <option value="0">Nenhuma</option>
              <option value="30">30 min</option>
              <option value="60">1 hora</option>
              <option value="120">2 horas</option>
              <option value="240">4 horas</option>
            </select>
          </div>
        </div>

        <h3 className="text-[11px] text-gray-500 font-bold uppercase pt-2 px-1">Semana</h3>

        {loading ? <div className="text-center p-10">Carregando...</div> : schedule.map(day => (
          <div key={day.id} className={`bg-gray-100 dark:bg-surface-dark rounded-3xl p-5 border ${day.is_open ? 'border-transparent' : 'border-gray-300 opacity-75'} transition-all`}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-slate-800 dark:text-white capitalize">{dayNames[day.day_of_week]}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase text-gray-400">{day.is_open ? '' : 'Não Atendendo'}</span>
                <button
                  onClick={() => handleToggleDay(day)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors ${day.is_open ? 'bg-green-500' : 'bg-gray-400'}`}
                >
                  <div className={`h-5 w-5 bg-white rounded-full shadow-sm transition-transform ${day.is_open ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white dark:bg-black/20 p-4 rounded-2xl">
              {day.is_open ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm font-bold text-slate-700 dark:text-gray-300">
                  <span>{day.start_time_1?.slice(0, 5)}</span>
                  <span>{day.end_time_1?.slice(0, 5)}</span>
                  {day.start_time_2 && day.end_time_2 && (
                    <>
                      <span>{day.start_time_2?.slice(0, 5)}</span>
                      <span>{day.end_time_2?.slice(0, 5)}</span>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-sm font-bold text-gray-400">Fechado</span>
              )}

              <button onClick={() => setEditingDay(day)} className="size-8 flex items-center justify-center text-gray-400 hover:text-primary">
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Edit Modal */}
      {editingDay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm px-6">
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up">
            <h3 className="font-bold text-xl mb-6 text-slate-900 dark:text-white text-center">Editar {dayNames[editingDay.day_of_week]}</h3>

            <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5 space-y-4">
              {/* Morning Shift */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">wb_sunny</span>
                    Manhã
                  </label>
                  <button
                    onClick={() => setEditingDay({ ...editingDay, is_morning_open: !editingDay.is_morning_open })}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${editingDay.is_morning_open ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${editingDay.is_morning_open ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className={`grid grid-cols-2 gap-2 text-center transition-all duration-300 ${!editingDay.is_morning_open && 'opacity-40 grayscale pointer-events-none'}`}>
                  <input type="time" className="bg-white dark:bg-background-dark p-3 rounded-xl font-bold text-center border border-gray-200 dark:border-white/10" value={editingDay.start_time_1} onChange={e => setEditingDay({ ...editingDay, start_time_1: e.target.value })} />
                  <input type="time" className="bg-white dark:bg-background-dark p-3 rounded-xl font-bold text-center border border-gray-200 dark:border-white/10" value={editingDay.end_time_1} onChange={e => setEditingDay({ ...editingDay, end_time_1: e.target.value })} />
                </div>
              </div>

              <div className="h-px bg-gray-200 dark:bg-white/10"></div>

              {/* Afternoon Shift */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">wb_twilight</span>
                    Tarde
                  </label>
                  <button
                    onClick={() => setEditingDay({ ...editingDay, is_afternoon_open: !editingDay.is_afternoon_open })}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${editingDay.is_afternoon_open ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${editingDay.is_afternoon_open ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className={`grid grid-cols-2 gap-2 text-center transition-all duration-300 ${!editingDay.is_afternoon_open && 'opacity-40 grayscale pointer-events-none'}`}>
                  <input type="time" className="bg-white dark:bg-background-dark p-3 rounded-xl font-bold text-center border border-gray-200 dark:border-white/10" value={editingDay.start_time_2 || ''} onChange={e => setEditingDay({ ...editingDay, start_time_2: e.target.value })} />
                  <input type="time" className="bg-white dark:bg-background-dark p-3 rounded-xl font-bold text-center border border-gray-200 dark:border-white/10" value={editingDay.end_time_2 || ''} onChange={e => setEditingDay({ ...editingDay, end_time_2: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button onClick={() => setEditingDay(null)} className="flex-1 py-3.5 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleSaveDay} className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminSettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('19:00');
  const [interval, setInterval] = useState('30');
  const [lunchStart, setLunchStart] = useState('');
  const [lunchEnd, setLunchEnd] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const s: any = {};
        data.forEach((r: any) => s[r.key] = r.value);
        setStartTime(s.start_time || '09:00');
        setEndTime(s.end_time || '19:00');
        setInterval(s.interval_minutes || '30');
        setLunchStart(s.lunch_start || '');
        setLunchEnd(s.lunch_end || '');
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    const updates = [
      { key: 'start_time', value: startTime },
      { key: 'end_time', value: endTime },
      { key: 'interval_minutes', value: interval },
      { key: 'lunch_start', value: lunchStart },
      { key: 'lunch_end', value: lunchEnd }
    ];

    // Upsert all
    const { error } = await supabase.from('settings').upsert(updates);

    if (error) alert('Erro ao salvar: ' + error.message);
    else alert('Configurações salvas!');
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Configuração da Agenda</h2>
        <div className="size-10"></div>
      </header>
      <main className="p-4 space-y-6 max-w-md mx-auto w-full">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-white/10 space-y-4 transition-colors">
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Horário de Abertura</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Horário de Fechamento</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Intervalo entre Cortes (min)</label>
            <select value={interval} onChange={e => setInterval(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white">
              <option value="15">15 minutos</option>
              <option value="20">20 minutos</option>
              <option value="30">30 minutos</option>
              <option value="40">40 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
            </select>
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Início do Almoço (Opcional)</label>
            <input type="time" value={lunchStart} onChange={e => setLunchStart(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Fim do Almoço (Opcional)</label>
            <input type="time" value={lunchEnd} onChange={e => setLunchEnd(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
          </div>
          <button onClick={handleSave} className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 mt-4">Salvar Configurações</button>
        </div>
      </main>
    </div>
  );
};



const LoginScreen: React.FC<{ onLogin: () => void; onBack: () => void }> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [remember, setRemember] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setError('Preencha todos os campos'); return; }
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      console.error('Login error:', error.message);
      setError(error.message === 'Invalid login credentials' ? 'Email ou senha inválidos' : 'Erro ao fazer login');
    } else if (data.user) {
      if (remember) {
        // Supabase persists by default, but we can respect the checkbox logic if we wanted to manipulate storage
        // For now, we rely on standard persistence or just setting our local flag if needed for other logic
        localStorage.setItem('admin_auth', 'true');
      }
      onLogin();
    }
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 max-w-md mx-auto w-full transition-colors">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-white transition-colors"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Login</h2>
      </div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Painel Administrativo</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie sua Garagem Detail com facilidade e profissionalismo.</p>
      </div>
      <div className="flex flex-col items-center mb-10">
        <div className="size-24 rounded-full bg-white dark:bg-surface-dark border-4 border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden relative group shadow-lg transition-colors">
          {/* <span className="material-symbols-outlined text-4xl text-gray-500">person</span> */}
          <img src="/renan.png" className="h-full w-full object-cover" />
          <div className="absolute bottom-0 right-0 bg-primary p-1.5 rounded-full border-2 border-white dark:border-background-dark shadow-md"><span className="material-symbols-outlined text-xs text-white">photo_camera</span></div>
        </div>
        <span className="text-primary text-sm font-bold mt-3">Renan Sandes</span>
      </div>
      <div className="space-y-4 mb-10">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">alternate_email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-white dark:bg-surface-dark border-transparent h-14 pl-12 pr-4 focus:ring-primary focus:border-primary transition-all text-sm text-slate-900 dark:text-white placeholder:text-gray-400 shadow-sm"
            placeholder="E-mail profissional"
            type="email"
          />
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-white dark:bg-surface-dark border-transparent h-14 pl-12 pr-4 focus:ring-primary focus:border-primary transition-all text-sm text-slate-900 dark:text-white placeholder:text-gray-400 shadow-sm"
            placeholder="Senha"
            type="password"
          />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="remember" className="text-sm text-gray-500 dark:text-gray-400">Manter conectado</label>
        </div>

        {error && <p className="text-red-500 text-sm font-bold text-center mb-4">{error}</p>}
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-primary h-14 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        <span>{loading ? 'Entrando...' : 'Acessar Painel'}</span> <span className="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
  );
};

const AdminCalendarView: React.FC<{
  appointments: Appointment[];
  selectedDateStr: string;
  onDateChange: (dateStr: string) => void;
  onAppointmentClick: (app: Appointment) => void;
  workHours: any[];
}> = ({ appointments, selectedDateStr, onDateChange, onAppointmentClick, workHours }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants
  const START_HOUR = 8;
  const END_HOUR = 20;
  const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
  const PIXELS_PER_MINUTE = 2; // Increased for better visibility (120px per hour)

  // Filter apps for selected date (Robust string comparison)
  const dayApps = appointments.filter(a => a.date === selectedDateStr && a.status !== 'CANCELLED');

  // Helper to calculate position
  const getPosition = (timeStr: string, duration: number) => {
    const [h, m] = timeStr.split(':').map(Number);
    const startMinutes = (h * 60 + m) - (START_HOUR * 60);
    return {
      top: startMinutes * PIXELS_PER_MINUTE,
      height: duration * PIXELS_PER_MINUTE
    };
  };

  const timeSlots = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    timeSlots.push(h);
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark">
        <button onClick={() => {
          const current = parseISO(selectedDateStr);
          onDateChange(format(addDays(current, -1), 'yyyy-MM-dd'));
        }} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-slate-900 dark:text-white">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
            {format(parseISO(selectedDateStr), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
        </div>
        <button onClick={() => {
          const current = parseISO(selectedDateStr);
          onDateChange(format(addDays(current, 1), 'yyyy-MM-dd'));
        }} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-slate-900 dark:text-white">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto relative no-scrollbar" style={{ height: '600px' }} ref={containerRef}>
        <div className="flex w-full relative min-h-full">
          {/* Time Sidebar */}
          <div className="w-16 flex-shrink-0 border-r border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-background-dark/50 z-10 sticky left-0">
            {timeSlots.map(h => (
              <div key={h} className="h-[120px] text-xs font-medium text-gray-500 text-right pr-2 pt-2 border-b border-gray-100 dark:border-white/5 relative">
                <span className="-top-3 relative">{h}:00</span>
              </div>
            ))}
          </div>

          {/* Events Area */}
          <div className="flex-1 relative bg-white dark:bg-surface-dark bg-[linear-gradient(to_bottom,transparent_119px,rgba(0,0,0,0.05)_120px)] dark:bg-[linear-gradient(to_bottom,transparent_119px,rgba(255,255,255,0.05)_120px)] bg-[size:100%_120px]">
            {dayApps.map(app => {
              const totalDuration = app.services.reduce((sum, s) => sum + s.duration, 0) || 30;
              const pos = getPosition(app.time, totalDuration);

              return (
                <div
                  key={app.id}
                  onClick={() => onAppointmentClick(app)}
                  className={`absolute left-2 right-2 rounded-lg p-2 border-l-4 shadow-sm cursor-pointer hover:brightness-95 transition-all
                      ${app.status === 'COMPLETED' ? 'bg-green-100 border-green-500 text-green-900' :
                      app.status === 'CONFIRMED' ? 'bg-blue-100 border-blue-500 text-blue-900' :
                        'bg-yellow-100 border-yellow-500 text-yellow-900'}
                    `}
                  style={{ top: `${pos.top}px`, height: `${pos.height}px` }}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs truncate">{app.customerName}</span>
                    <span className="text-[10px] font-mono opacity-80">{app.time}</span>
                  </div>
                  <div className="text-[10px] opacity-90 truncate mt-0.5">
                    {app.services.map(s => s.name).join(', ')}
                  </div>
                </div>
              );
            })}

            {/* Current Time Line */}
            {selectedDateStr === format(new Date(), 'yyyy-MM-dd') && (() => {
              const now = new Date();
              const minutes = (now.getHours() * 60 + now.getMinutes()) - (START_HOUR * 60);
              if (minutes > 0 && minutes < TOTAL_MINUTES) {
                return (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                    style={{ top: `${minutes * PIXELS_PER_MINUTE}px` }}
                  >
                    <div className="size-2 bg-red-500 rounded-full -ml-1"></div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminTVScreen: React.FC<{ appointments: Appointment[]; onBack: () => void; onRefresh: () => void }> = ({ appointments, onBack, onRefresh }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workHours, setWorkHours] = useState<any[]>([]);
  const lastAnnouncedRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.from('work_hours').select('*').then(({ data }) => { if (data) setWorkHours(data); });

    // Clock tick
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const refreshTimer = setInterval(() => onRefresh(), 10000);
    return () => { clearInterval(timer); clearInterval(refreshTimer); };
  }, [onRefresh]);

  const todayStr = format(currentTime, 'yyyy-MM-dd');
  const nowTimeStr = format(currentTime, 'HH:mm');

  // Filter Active Apps
  const activeApps = appointments
    .filter(a => a.date === todayStr && (a.status === 'CONFIRMED' || a.status === 'PENDING'))
    .sort((a, b) => a.time.localeCompare(b.time));

  // --- TTS Logic ---
  useEffect(() => {
    // Check if any app is starting NOW (within this minute)
    const appStartingNow = activeApps.find(a => a.time.startsWith(nowTimeStr));

    if (appStartingNow && lastAnnouncedRef.current !== appStartingNow.id) {
      const text = `Cliente ${appStartingNow.customerName}, seu horário das ${appStartingNow.time.slice(0, 5)} chegou.`;
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = 'pt-BR';
      window.speechSynthesis.speak(speech);
      lastAnnouncedRef.current = String(appStartingNow.id);
    }
  }, [nowTimeStr, activeApps]);

  // --- Next Slots Logic ---
  // --- Next Slots Logic ---
  const nextSlots = useMemo(() => {
    if (!workHours.length) return [];

    const dow = currentTime.getDay(); // 0=Sun
    // Database uses 0-6 integers for day_of_week
    const todayConfig = workHours.find(w => w.day_of_week === dow);

    if (!todayConfig || !todayConfig.is_open) return [];

    const slots: string[] = [];
    const addSlots = (start: string, end: string) => {
      if (!start || !end) return;

      const toMins = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      let currMins = toMins(start.slice(0, 5));
      const endMins = toMins(end.slice(0, 5));

      // Prevent infinite loop: Max 24 hours of slots
      let safetyCounter = 0;
      while (currMins < endMins && safetyCounter < 50) {
        const h = Math.floor(currMins / 60);
        const m = currMins % 60;
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        slots.push(timeStr);
        currMins += 30; // 30 min interval
        safetyCounter++;
      }
    };

    if (todayConfig.is_morning_open) addSlots(todayConfig.start_time_1, todayConfig.end_time_1);
    if (todayConfig.is_afternoon_open) addSlots(todayConfig.start_time_2, todayConfig.end_time_2);

    return slots.filter(slot => {
      if (slot <= nowTimeStr) return false;
      const isTaken = activeApps.some(a => a.time.startsWith(slot));
      return !isTaken;
    }).slice(0, 4);
  }, [workHours, nowTimeStr, activeApps, currentTime]);



  return (
    <div className="bg-slate-900 h-screen w-screen flex flex-col p-6 text-white overflow-hidden relative">
      <header className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 shrink-0 h-[100px]">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-white rounded-full p-2 flex items-center justify-center">
            <img src="/logo.png" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white shadow-black drop-shadow-lg leading-none">Agendamentos</h1>
            <p className="text-lg text-gray-400 uppercase tracking-widest font-bold">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-6xl font-black font-mono tracking-widest text-primary drop-shadow-[0_0_15px_rgba(212,17,50,0.5)] leading-none">
            {nowTimeStr}
          </div>
          <button onClick={onBack} className="mt-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-all">
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 grid grid-cols-[1fr_260px] gap-6">
        {/* Appointments Grid */}
        <div className="overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min">
            {activeApps.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center p-10 opacity-30 mt-10">
                <span className="material-symbols-outlined text-[80px] mb-4">event_busy</span>
                <h2 className="text-2xl font-bold uppercase tracking-widest text-center">Nenhum agendamento<br />ativo no momento</h2>
              </div>
            ) : (
              activeApps.map(app => {
                const appTimeParts = app.time.split(':');
                const start = new Date(currentTime);
                start.setHours(parseInt(appTimeParts[0]), parseInt(appTimeParts[1]), 0, 0);
                const duration = app.services.reduce((acc, s) => acc + s.duration, 0);
                const end = addMinutes(start, duration);
                const isNow = currentTime >= start && currentTime < end;

                return (
                  <div key={app.id} className={`${isNow ? 'bg-yellow-950/40 border-yellow-500 ring-2 ring-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'bg-slate-800 border-primary'} rounded-2xl p-4 border-l-[8px] shadow-xl flex flex-col gap-2 relative overflow-hidden transition-all duration-500`}>
                    <div className="absolute top-0 right-0 bg-white/5 px-4 py-2 rounded-bl-2xl">
                      <span className={`font-mono font-black text-2xl tracking-tighter ${isNow ? 'text-yellow-400' : 'text-white'}`}>{app.time.slice(0, 5)}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className={`size-14 rounded-xl bg-gradient-to-br ${isNow ? 'from-yellow-600 to-yellow-800 text-white shadow-yellow-900/50' : 'from-slate-700 to-slate-800 shadow-inner'} border border-white/5 flex items-center justify-center text-xl font-black shadow-lg shrink-0`}>
                        {app.customerName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-xl font-bold truncate leading-tight ${isNow ? 'text-yellow-100' : 'text-white'}`}>{app.customerName}</h3>
                        <p className={`truncate font-mono text-xs opacity-60 ${isNow ? 'text-yellow-200' : 'text-gray-400'}`}>{app.customerPhone}</p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 mt-auto">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {app.services.slice(0, 2).map(s => (
                          <span key={s.id} className={`${isNow ? 'bg-yellow-600 text-white shadow-yellow-600/40' : 'bg-primary text-white shadow-primary/20'} px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm`}>
                            {s.name}
                          </span>
                        ))}
                        {app.services.length > 2 && <span className="text-[10px] opacity-70">+{app.services.length - 2}</span>}
                      </div>
                      <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                        <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${isNow ? 'text-yellow-200' : 'text-gray-400'}`}>
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {duration} min
                        </span>
                        <span className="text-lg font-black text-green-400">R$ {app.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar / Widgets */}
        <div className="flex flex-col gap-4 h-full">
          {/* Quick Schedule QR */}
          <div className="bg-white p-4 rounded-2xl flex flex-col items-center text-center shadow-xl border-4 border-primary/20 shrink-0">
            <h3 className="text-slate-900 font-black uppercase tracking-widest text-xs mb-2">Agende Agora</h3>
            <div className="bg-white p-1 rounded-lg mb-2 w-32 h-32">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(import.meta.env.VITE_SITE_URL || window.location.origin)}`} alt="QR Code" className="w-full h-full rounded" />
            </div>
            <p className="text-slate-500 font-bold text-[10px]">Aponte a câmera</p>
          </div>

          {/* Free Slots */}
          {nextSlots.length > 0 && (
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/10 flex-1 flex flex-col min-h-0">
              <h3 className="text-white/70 font-bold uppercase tracking-widest text-[10px] mb-3 flex items-center gap-2 shrink-0">
                <span className="material-symbols-outlined text-sm">event_available</span>
                Horários Disponíveis
              </h3>
              <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                {nextSlots.map(slot => (
                  <div key={slot} className="bg-slate-700/50 p-2 rounded-lg flex justify-between items-center border border-white/5">
                    <span className="font-mono font-bold text-lg text-green-400">{slot}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-500">Livre</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const AdminDashboard: React.FC<{
  appointments: Appointment[];
  onLogout: () => void;
  onOpenChat: () => void;
  onManageServices: () => void;
  onBlockSchedule: () => void;
  onSettings: () => void;
  onWeeklySchedule: () => void;
  onFinance: () => void;
  onTV: () => void;
  onRefresh: () => void;
  onClients: () => void;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  unreadCount: number;
}> = ({ appointments, onLogout, onOpenChat, onManageServices, onBlockSchedule, onSettings, onWeeklySchedule, onFinance, onTV, onRefresh, onClients, setAppointments, unreadCount }) => {
  const availableDays = useMemo(() => getNextDays(7), []);
  const [selectedDateStr, setSelectedDateStr] = useState(availableDays[0].dateStr); // Default to local today string
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Load WorkHours to pass to calendar if needed for disabled slots visual
  const [workHours, setWorkHours] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('work_hours').select('*').then(({ data }) => { if (data) setWorkHours(data) });
  }, []);

  console.log('AdminDashboard Render:', {
    totalAppointments: appointments.length,
    selectedDateStr,
    appsForDay: appointments.filter(a => a.date === selectedDateStr).length
  });

  const selectedDayApps = appointments.filter(a => a.date === selectedDateStr);

  // Separate Pending (Normal) from Completed
  const pendingApps = selectedDayApps.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED');

  const totalRevenue = appointments.reduce((sum, app) => sum + app.totalPrice, 0);

  const stats = useMemo(() => {
    const count = pendingApps.length;
    const revenue = selectedDayApps
      .filter(app => app.status !== 'CANCELLED')
      .reduce((sum, app) => sum + app.totalPrice, 0);
    return { count, revenue };
  }, [selectedDayApps, pendingApps]);

  const handleUpdateStatus = (id: string, status: string) => {
    // Optimistic Update
    setAppointments(prev => prev.map(app =>
      app.id === id ? { ...app, status } : app
    ));
    setActiveMenuId(null);

    supabase.from('appointments').update({ status }).eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error(error);
          onRefresh(); // Revert if error (simple way)
        }
      });
  };

  const handleDeleteAppointment = (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja cancelar o agendamento de ${name}? O horário ficará disponível novamente.`)) return;

    supabase.from('appointments').delete().eq('id', id)
      .then(({ error }) => {
        if (error) alert('Erro ao cancelar');
        else onRefresh();
      });
  };

  const subscribeUser = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) { alert('VAPID Key missing'); return; }

        const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        // Send subscription to server (Supabase)
        // Check duplication (naive) or just insert
        await supabase.from('push_subscriptions').insert({ subscription });
        alert('Notificações em segundo plano ativadas!');
      } catch (err) {
        console.error('Subscription failed', err);
        alert('Erro ao ativar notificações. Verifique se o navegador tem permissão.');
      }
    } else {
      alert('Navegador não suportado.');
    }
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/90 dark:bg-background-dark/90 flex items-center justify-between backdrop-blur-md transition-colors">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm flex items-center justify-center p-1">
            <img src="/renan.png" alt="Admin" className="h-full w-full object-cover rounded-full" />
          </div>
          <div>
            <h2 className="font-bold leading-none text-slate-900 dark:text-white">Agenda</h2>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Renan Sandes</span>
          </div>
        </div>
        <button onClick={onLogout} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 transition-colors">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </header>
      <main className="p-4 pb-24 max-w-md mx-auto w-full">
        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={onClients}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <span className="material-symbols-outlined filled">group</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Clientes</h3>
              <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">Gerenciar</p>
            </div>
          </button>

          <button
            onClick={onManageServices}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <span className="material-symbols-outlined filled">content_cut</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Serviços</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Editar/Add</p>
            </div>
          </button>

          <button
            onClick={onOpenChat}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            {unreadCount > 0 && (
              <div className="absolute top-3 right-3 size-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm animate-bounce-custom">
                {unreadCount}
              </div>
            )}
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined filled">chat</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Chat</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Conversas</p>
            </div>
          </button>

          <button
            onClick={onFinance}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined filled">payments</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Financeiro</h3>
              <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Relatórios</p>
            </div>
          </button>

          <button
            onClick={onBlockSchedule}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <span className="material-symbols-outlined filled">event_busy</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Bloquear</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Fechar Horários</p>
            </div>
          </button>

          <button
            onClick={onWeeklySchedule}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <span className="material-symbols-outlined filled">calendar_clock</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Horários</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Configurar Semana</p>
            </div>
          </button>

          <button
            onClick={subscribeUser}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <span className="material-symbols-outlined filled">notifications_active</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Alertas</h3>
              <p className="text-cyan-500 dark:text-cyan-400 text-[10px] font-bold uppercase tracking-widest">Ativar Push</p>
            </div>
          </button>

          <button
            onClick={onTV}
            className="relative group flex flex-col p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-primary/50 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between col-span-2"
          >
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <span className="material-symbols-outlined text-6xl text-white">tv</span>
            </div>
            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white shadow-lg backdrop-blur-sm z-10">
              <span className="material-symbols-outlined filled">desktop_windows</span>
            </div>
            <div className="text-left z-10">
              <h3 className="font-bold text-white text-lg">Modo TV (Painel)</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Visualizar Agendamentos na TV</p>
            </div>
          </button>
        </div>

        {/* View Toggle & Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const current = parseISO(selectedDateStr);
                  setSelectedDateStr(format(addDays(current, -1), 'yyyy-MM-dd'));
                }}
                className="size-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>

              <div className="relative group">
                <div
                  className="flex flex-col items-center cursor-pointer select-none"
                  onClick={() => dateInputRef.current?.showPicker()}
                >
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    Visão Geral
                    <span className="material-symbols-outlined text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">edit_calendar</span>
                  </h3>
                  <p className="text-gray-500 text-xs">{selectedDateStr === new Date().toISOString().split('T')[0] ? 'Hoje' : formatDateToBRL(selectedDateStr)}</p>
                </div>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDateStr(e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 pointer-events-none"
                  style={{ visibility: 'hidden', position: 'absolute', bottom: 0, left: '50%' }}
                />
              </div>

              <button
                onClick={() => {
                  const current = parseISO(selectedDateStr);
                  setSelectedDateStr(format(addDays(current, 1), 'yyyy-MM-dd'));
                }}
                className="size-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>

            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-full">
              <button onClick={() => setViewMode('LIST')} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-surface-dark shadow text-slate-900 dark:text-white' : 'text-gray-400'}`}>
                <span className="material-symbols-outlined text-base">list</span>
              </button>
              <button onClick={() => setViewMode('CALENDAR')} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'CALENDAR' ? 'bg-white dark:bg-surface-dark shadow text-slate-900 dark:text-white' : 'text-gray-400'}`}>
                <span className="material-symbols-outlined text-base">calendar_view_day</span>
              </button>
            </div>
          </div>
        </div>

        {
          viewMode === 'CALENDAR' ? (
            <div className="animate-fade-in relative z-0">
              <AdminCalendarView
                appointments={appointments}
                selectedDateStr={selectedDateStr}
                onDateChange={setSelectedDateStr}
                workHours={workHours}
                onAppointmentClick={(app) => setActiveMenuId(app.id)}
              />
              {activeMenuId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setActiveMenuId(null)}>
                  <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-scale-up border border-white/10" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Ações do Agendamento</h3>
                    <div className="space-y-3">
                      <button onClick={() => handleUpdateStatus(activeMenuId, 'CONFIRMED')} className="w-full p-4 bg-blue-500/10 text-blue-600 rounded-xl font-bold flex items-center gap-3 hover:bg-blue-500/20"><span className="material-symbols-outlined">check</span> Confirmar</button>
                      <button onClick={() => handleUpdateStatus(activeMenuId, 'COMPLETED')} className="w-full p-4 bg-green-500/10 text-green-600 rounded-xl font-bold flex items-center gap-3 hover:bg-green-500/20"><span className="material-symbols-outlined">done_all</span> Concluir</button>
                      <button onClick={() => {
                        const app = appointments.find(a => a.id === activeMenuId);
                        if (app) handleDeleteAppointment(app.id, app.customerName);
                        setActiveMenuId(null);
                      }} className="w-full p-4 bg-red-500/10 text-red-600 rounded-xl font-bold flex items-center gap-3 hover:bg-red-500/20"><span className="material-symbols-outlined">delete</span> Cancelar</button>
                    </div>
                    <button onClick={() => setActiveMenuId(null)} className="w-full py-4 mt-2 text-gray-500 font-bold">Fechar</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>

              {/* Date Selector */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-1">
                {availableDays.map(d => (
                  <button
                    key={d.dateStr}
                    onClick={() => setSelectedDateStr(d.dateStr)}
                    className={`p-3 rounded-xl min-w-[70px] text-center flex flex-col transition-all border ${selectedDateStr === d.dateStr
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-white dark:bg-surface-dark text-gray-500 border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
                      }`}
                  >
                    <span className={`text-[10px] uppercase font-bold mb-1 ${selectedDateStr === d.dateStr ? 'opacity-90' : 'opacity-60'}`}>
                      {d.isToday ? 'Hoje' : d.label}
                    </span>
                    <span className={`text-xl font-bold ${selectedDateStr === d.dateStr ? 'text-white' : 'text-slate-900 dark:text-gray-300'}`}>{d.dayNum}</span>
                  </button>
                ))}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-white dark:bg-surface-dark p-5 rounded-3xl border border-gray-200 dark:border-white/5 text-center shadow-sm transition-colors">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">{stats.count}</span>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mt-2 tracking-widest">Agendados</p>
                </div>
                <div className="bg-white dark:bg-surface-dark p-5 rounded-3xl border border-gray-200 dark:border-white/5 text-center shadow-sm transition-colors">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">R$ {stats.revenue.toFixed(0)}</span>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mt-2 tracking-widest">Previsão de Faturamento do dia</p>
                </div>
              </div>

              <h3 className="text-[11px] text-gray-500 font-bold uppercase mb-5 tracking-widest px-1 flex justify-between items-center">
                <span>Cronograma</span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full normal-case text-[10px]">{pendingApps.length} agendamentos</span>
              </h3>

              {/* Appointment List */}
              <div className="space-y-4">
                {pendingApps.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-surface-dark/40 rounded-3xl border border-gray-200 dark:border-white/5 border-dashed transition-colors">
                    <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-700 mb-2">event_busy</span>
                    <p className="text-gray-500 text-sm">Sem compromissos pendentes.</p>
                  </div>
                ) : (
                  pendingApps.map((app) => (
                    <div key={app.id} className="group relative bg-white dark:bg-surface-dark p-5 rounded-3xl border-l-4 border-primary border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                          <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
                            {app.time}
                          </span>
                          <span className="text-gray-500 text-[10px] font-bold uppercase mt-0.5">
                            {app.services.reduce((total, s) => total + s.duration, 0)} min de duração
                          </span>
                        </div>
                        <span className="bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-green-500/20">
                          {app.status === 'CONFIRMED' ? 'Confirmado' : app.status}
                        </span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="size-12 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/5 flex items-center justify-center overflow-hidden shadow-inner transition-colors">
                          <span className="material-symbols-outlined text-gray-600 text-2xl">person</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">{app.customerName}</h4>
                          <p className="text-xs text-gray-500 font-medium truncate opacity-80">
                            {app.services.map(s => s.name).join(' + ')}
                          </p>
                        </div>

                        {/* <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === app.id ? null : app.id)}
                      className="size-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors"
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {activeMenuId === app.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-white/5 z-10 overflow-hidden animate-fade-in">
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'COMPLETED')}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 text-sm font-medium text-green-600"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span> Concluir
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 text-sm font-medium text-red-500"
                        >
                          <span className="material-symbols-outlined text-lg">cancel</span> Cancelar
                        </button>
                      </div>
                    )}
                  </div> */}
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                        <a
                          href={`https://wa.me/55${app.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`*Essa mensagem é pra lembrar do seu agendamento!*

*Data:* ${app.date.split('-').reverse().join('/')}
*Horário:* ${app.time}
*Serviço:* ${app.services.map(s => s.name).join(', ')}
*Valor:* R$ ${app.totalPrice.toFixed(2).replace('.', ',')}
*Cliente:* ${app.customerName}

Dúvidas, responder a essa mensagem!`)}`}
                          target="_blank"
                          className="flex-1 h-10 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-500 flex items-center justify-center gap-1.5 transition-colors text-xs font-bold uppercase tracking-wide border border-green-500/20"
                        >
                          <span className="material-symbols-outlined text-lg">chat</span>
                          WhatsApp
                        </a>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'COMPLETED')}
                          className="flex-1 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center gap-1.5 transition-colors text-xs font-bold uppercase tracking-wide border border-primary/20"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                          Concluir
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja cancelar?')) handleUpdateStatus(app.id, 'CANCELLED');
                          }}
                          className="size-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors border border-red-500/20"
                          title="Cancelar Agendamento"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Completed Section */}
              <div className="mt-8 space-y-4 opacity-70">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500">task_alt</span>
                  Concluídos Hoje ({selectedDayApps.filter(a => a.status === 'COMPLETED').length})
                </h3>
                <div className="space-y-3">
                  {selectedDayApps.filter(a => a.status === 'COMPLETED').map(app => (
                    <div key={app.id} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-transparent flex justify-between items-center group grayscale hover:grayscale-0 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
                          {app.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white strike-through decoration-slate-900/30">{app.customerName}</p>
                          <p className="text-xs text-gray-500">{app.services.map(s => s.name).join(', ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">{app.time}</p>
                        <p className="text-xs text-green-500 font-bold">Concluído</p>
                      </div>
                    </div>
                  ))}
                  {selectedDayApps.filter(a => a.status === 'COMPLETED').length === 0 && (
                    <p className="text-sm text-gray-400 italic">Nenhum atendimento concluído hoje.</p>
                  )}
                </div>
              </div>
            </>
          )
        }
      </main >
    </div >
  );
};

// --- Admin Services Screen ---
const AdminServicesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service>>({});
  const [loading, setLoading] = useState(false);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) console.error(error);
    else if (data) {
      setServices(data.map((s: any) => ({
        ...s,
        imageUrl: s.image_url
      })));
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleSave = async () => {
    if (!editingService.name || !editingService.price) return;
    setLoading(true);

    const payload = {
      name: editingService.name,
      description: editingService.description,
      price: editingService.price,
      duration: editingService.duration,
      image_url: editingService.imageUrl,
      is_active: true
    };

    let error;
    if (editingService.id) {
      const { error: err } = await supabase
        .from('services')
        .update(payload)
        .eq('id', editingService.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('services')
        .insert(payload);
      error = err;
    }

    setLoading(false);
    if (error) {
      console.error(error);
      alert('Erro ao salvar serviço');
    } else {
      setIsEditing(false);
      setEditingService({});
      fetchServices();
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este serviço?')) return;
    // Soft delete
    supabase.from('services').update({ is_active: false }).eq('id', id)
      .then(() => fetchServices());
  };

  if (isEditing) {
    return (
      <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 max-w-md mx-auto w-full transition-colors">
        <div className="flex items-center mb-8">
          <button onClick={() => setIsEditing(false)} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
          <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">{editingService.id ? 'Editar Serviço' : 'Novo Serviço'}</h2>
        </div>
        <div className="space-y-4">
          <input className="w-full bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Nome do Serviço" value={editingService.name || ''} onChange={e => setEditingService({ ...editingService, name: e.target.value })} />
          <textarea className="w-full bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 h-24 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Descrição" value={editingService.description || ''} onChange={e => setEditingService({ ...editingService, description: e.target.value })} />
          <div className="flex gap-2">
            <input type="number" className="flex-1 bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Preço (R$)" value={editingService.price || ''} onChange={e => setEditingService({ ...editingService, price: parseFloat(e.target.value) })} />
            <input type="number" className="flex-1 bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Duração (min)" value={editingService.duration || ''} onChange={e => setEditingService({ ...editingService, duration: parseInt(e.target.value) })} />
          </div>
          <input className="w-full bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="URL da Imagem" value={editingService.imageUrl || ''} onChange={e => setEditingService({ ...editingService, imageUrl: e.target.value })} />

          <button onClick={handleSave} disabled={loading} className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20">
            {loading ? 'Salvando...' : 'Salvar Serviço'}
          </button>
        </div>
      </div>
    );
  }


  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items: Service[] = Array.from(services);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setServices(items);

    // Prepare updates
    const updates = items.map((item, index) => ({
      id: item.id,
      name: item.name, // Required for upsert if not minimal, actually update allows partial
      display_order: index
    }));

    // Batch update via Promise.all is safest for now, or use upsert if we change strategy.
    // Supabase JS doesn't support bulk update with different values easily in one query without upsert/json trick.
    // For specific rows updates, we can just iterate.

    // Ideally use an RPC for this, but simplistic client-side loop is fine for small list ( < 20 services)
    for (let i = 0; i < updates.length; i++) {
      await supabase.from('services').update({ display_order: updates[i].display_order }).eq('id', updates[i].id);
    }
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Gerenciar Serviços</h2>
        <div className="size-10"></div>
      </header>
      <main className="p-4 space-y-4 max-w-md mx-auto w-full pb-24">

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="services-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {services.map((s, index) => (
                  // @ts-expect-error Link for known react-beautiful-dnd types issue with React 18
                  <Draggable key={s.id} draggableId={String(s.id)} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 flex gap-4 items-center transition-colors shadow-sm"
                      >
                        <div {...provided.dragHandleProps} className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-2 mr-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M360-160q-33 0-56.5-23.5T280-240q0-33 23.5-56.5T360-320q33 0 56.5 23.5T440-240q0 33-23.5 56.5T360-160Zm240 0q-33 0-56.5-23.5T520-240q0-33 23.5-56.5T600-320q33 0 56.5 23.5T680-240q0 33-23.5 56.5T600-160ZM360-400q-33 0-56.5-23.5T280-480q0-33 23.5-56.5T360-560q33 0 56.5 23.5T440-480q0 33-23.5 56.5T360-400Zm240 0q-33 0-56.5-23.5T520-480q0-33 23.5-56.5T600-560q33 0 56.5 23.5T680-480q0 33-23.5 56.5T600-400ZM360-640q-33 0-56.5-23.5T280-720q0-33 23.5-56.5T360-800q33 0 56.5 23.5T440-720q0 33-23.5 56.5T360-640Zm240 0q-33 0-56.5-23.5T520-720q0-33 23.5-56.5T600-800q33 0 56.5 23.5T680-720q0 33-23.5 56.5T600-640Z" /></svg>
                        </div>
                        <img src={s.imageUrl} className="size-16 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 pointer-events-none" />
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">{s.name}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">R$ {s.price.toFixed(2)} • {s.duration} min</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => { setEditingService(s); setIsEditing(true); }} className="size-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-blue-500 dark:text-blue-400 transition-colors"><span className="material-symbols-outlined text-sm">edit</span></button>
                          <button onClick={() => handleDelete(s.id)} className="size-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-red-500 dark:text-red-400 transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

      </main>
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => { setEditingService({}); setIsEditing(true); }} className="size-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center transition-transform active:scale-95">
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      </div>
    </div>
  );
};


// --- Theme Logic ---

// --- Main App Logic ---

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LANDING');
  const [currentUserRole, setCurrentUserRole] = useState<'CUSTOMER' | 'BARBER'>('CUSTOMER');

  // Notification refs
  const prevAppCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const [services, setServices] = useState<Service[]>([]);

  // Check for persistent login
  useEffect(() => {
    // Check local storage flag OR Supabase session
    const isAuth = localStorage.getItem('admin_auth');

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session || isAuth === 'true') {
        setCurrentUserRole('BARBER');
        // Restore last view or default to dashboard
        const lastView = localStorage.getItem('last_admin_view') as AppView;
        if (lastView && lastView.startsWith('ADMIN_')) {
          setView(lastView);
        } else {
          setView('ADMIN_DASHBOARD');
        }
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setCurrentUserRole('BARBER');
        setView(prev => {
          if (prev.startsWith('ADMIN_')) return prev;
          const lastView = localStorage.getItem('last_admin_view') as AppView;
          if (lastView && lastView.startsWith('ADMIN_')) return lastView;
          return 'ADMIN_DASHBOARD';
        });
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('admin_auth');
        setView('LANDING');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Request Notification Permission for Admin
  useEffect(() => {
    if (currentUserRole === 'BARBER' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [currentUserRole]);

  /* Refactored fetchServicesList to be reused */
  const fetchServicesList = async () => {
    const { data } = await supabase.from('services').select('*').eq('is_active', true).order('display_order', { ascending: true });
    if (data) {
      setServices(data.map((s: any) => ({
        ...s,
        id: String(s.id),
        imageUrl: s.image_url
      })));
    }
  };

  useEffect(() => {
    fetchServicesList();
  }, []);


  const [booking, setBooking] = useState<BookingState>({
    customerName: '',
    customerPhone: '',
    selectedServices: [],
    selectedDate: '',
    selectedTime: '',
  });

  const [selectedChatClient, setSelectedChatClient] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    // Fetch chat messages
    // If Admin and selectedChatClient, fetch for that client
    // If Customer, fetch by their phone (booking state) OR maybe we need a session state for customer phone?
    // For simplicity: Customer sees all messages if no phone tied (demo) or filtered by phone if known

    // Admin View Logic:
    let query = '';
    if (currentUserRole === 'BARBER' && selectedChatClient) {
      query = `?clientId=${selectedChatClient.id}`;
    } else if (currentUserRole === 'CUSTOMER' && booking.customerPhone) {
      query = `?phone=${booking.customerPhone}`;
    }

    const fetchChat = async () => {
      let query = supabase.from('chat_messages').select('*').order('sent_at', { ascending: true });
      if (currentUserRole === 'BARBER' && selectedChatClient) {
        query = query.eq('client_id', selectedChatClient.id);

        // Mark as read if Admin
        await supabase.from('chat_messages').update({ is_read: true }).eq('client_id', selectedChatClient.id).eq('sender_type', 'CUSTOMER').eq('is_read', false);

      } else if (currentUserRole === 'CUSTOMER' && booking.customerPhone) {
        // We need client ID from phone
        const { data: client } = await supabase.from('clients').select('id').eq('phone', booking.customerPhone).single();
        if (client) query = query.eq('client_id', client.id);
        else return; // user not found yet
      }

      const { data, error } = await query;
      if (data) {
        // ... mappings
        const mapped = data.map((m: any) => ({
          id: String(m.id),
          text: m.message_text,
          sender: m.sender_type,
          timestamp: new Date(m.sent_at)
        }));
        setChatMessages(mapped);
      }
    };
    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [selectedChatClient, currentUserRole, booking.customerPhone]);

  // Dynamically set today's date for mock data
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const [showSuccess, setShowSuccess] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadCountRef = useRef(0);
  const [notificationState, setNotificationState] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  // Watch for unread count increase
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current >= 0) {
      // Trigger Notification
      setNotificationState({ visible: true, message: 'Você tem uma nova mensagem de cliente!' });
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => { });
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const fetchAppointments = useCallback(async () => {
    let query = supabase
      .from('appointments')
      .select(`
                  *,
                  services:appointment_services(
                  service:services(*)
                  ),
                  clients(name, phone)
                  `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    // Fetch Unread Count for Admin
    if (currentUserRole === 'BARBER') {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('sender_type', 'CUSTOMER');
      setUnreadCount(count || 0);
    }

    // Client-side filtering for customer (or do it in RLS/query filter if simple)
    // Actually we can filter by client phone join, but for now fetch all and filter is safer if we don't have perfect join filtering setup

    const { data, error } = await query;

    if (data) {
      let newApps = data.map((a: any) => ({
        id: String(a.id),
        date: a.appointment_date,
        time: a.appointment_time ? a.appointment_time.slice(0, 5) : '',
        status: a.status,
        totalPrice: a.total_price,
        customerName: a.clients?.name || 'Cliente',
        customerPhone: a.clients?.phone || '',
        services: a.services.map((s: any) => ({
          ...s.service,
          imageUrl: s.service.image_url
        }))
      }));

      if (currentUserRole === 'CUSTOMER' && booking.customerPhone) {
        newApps = newApps.filter((app: Appointment) => app.customerPhone === booking.customerPhone);
      }

      // Check new appointments
      if (currentUserRole === 'BARBER' && !isFirstLoadRef.current) {
        if (newApps.length > prevAppCountRef.current) {
          if (Notification.permission === 'granted') {
            new Notification("Novo Agendamento!");
          }
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => { });
        }
      }

      setAppointments(newApps);
      prevAppCountRef.current = newApps.length;
      isFirstLoadRef.current = false;
    }
  }, [currentUserRole, booking.customerPhone]);

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel('realtime-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('Realtime change detected:', payload);
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => { });
          fetchAppointments();
        }
      )
      .subscribe();

    const interval = setInterval(fetchAppointments, 30000); // Poll every 30s as backup

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchAppointments]);

  const handleRegisterIdentity = (identity: { name: string, phone: string }) => {
    setBooking(prev => ({ ...prev, customerName: identity.name, customerPhone: identity.phone }));
  };

  const handleSendMessage = async (text: string, identity?: { name: string, phone: string }) => {
    if (identity) {
      setBooking(prev => ({ ...prev, customerName: identity.name, customerPhone: identity.phone }));
    }

    const phoneToSend = identity?.phone || booking.customerPhone;
    const nameToSend = identity?.name || booking.customerName;

    let cId = selectedChatClient?.id;

    // Resolve Client ID
    if (!cId) {
      // Look up by phone
      const { data: client } = await supabase.from('clients').select('id').eq('phone', phoneToSend).single();
      if (client) {
        cId = client.id;
      } else {
        // Create
        const { data: newClient } = await supabase.from('clients').insert({ name: nameToSend, phone: phoneToSend }).select().single();
        if (newClient) cId = newClient.id;
      }
    }

    if (!cId) return;

    await supabase.from('chat_messages').insert({
      client_id: cId,
      sender_type: currentUserRole,
      message_text: text,
      sent_at: new Date().toISOString()
    });

    // Re-fetch handled by polling or subscription (polling in this case)
  };

  const handleFinishBooking = async () => {
    // 1. Find or Create Client
    let clientId: number | undefined;
    const { data: clientData } = await supabase.from('clients').select('id').eq('phone', booking.customerPhone).single();
    if (clientData) {
      clientId = clientData.id;
    } else {
      const { data: newClient, error: clientError } = await supabase.from('clients').insert({ name: booking.customerName, phone: booking.customerPhone }).select().single();
      if (clientError || !newClient) { alert('Erro ao salvar cliente'); return; }
      clientId = newClient.id;
    }

    // 1.5 Check Availability
    const { data: dayApps } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', booking.selectedDate)
      .neq('status', 'CANCELLED');

    const { data: dayBlocks } = await supabase
      .from('blocked_slots')
      .select('time')
      .eq('date', booking.selectedDate);

    const isTaken = dayApps?.some(a => a.appointment_time?.startsWith(booking.selectedTime));
    const isBlocked = dayBlocks?.some(b => b.time?.startsWith(booking.selectedTime));

    if (isTaken || isBlocked) {
      alert('Este horário acabou de ser reservado ou bloqueado. Por favor, escolha outro.');
      return;
    }

    // 2. Create Appointment
    const { data: appData, error: appError } = await supabase.from('appointments').insert({
      client_id: clientId,
      appointment_date: booking.selectedDate,
      appointment_time: booking.selectedTime,
      total_price: booking.selectedServices.reduce((sum, s) => sum + s.price, 0),
      status: 'PENDING'
    }).select().single();

    if (appError || !appData) { alert('Erro ao agendar: ' + (appError?.message || '')); return; }

    // 3. Insert Services
    const serviceInserts = booking.selectedServices.map(s => ({
      appointment_id: appData.id,
      service_id: s.id,
      price_at_booking: s.price
    }));
    await supabase.from('appointment_services').insert(serviceInserts);

    // Success
    setShowSuccess(true);
    setBooking(prev => ({
      ...prev,
      selectedServices: [],
      selectedDate: '',
      selectedTime: '',
    }));
    fetchAppointments();
    setTimeout(() => {
      setShowSuccess(false);
      setView('MY_APPOINTMENTS');
    }, 3000);
  };

  const renderView = () => {
    switch (view) {
      case 'LANDING':
        return <LandingScreen onStart={() => setView('HOME')} onAdmin={() => setView('LOGIN')} />;
      case 'HOME':
        return <HomeScreen
          onAgendar={() => {
            fetchServicesList(); // Refresh info
            setView('SELECT_SERVICES');
          }}
          onChat={() => { setCurrentUserRole('CUSTOMER'); setView('CHAT'); }}
          onPerfil={() => {
            setView('CUSTOMER_LOGIN');
          }}
          onMais={() => setView('LANDING')}
        />;
      case 'SELECT_SERVICES':
        return <SelectServicesScreen
          booking={booking}
          setBooking={setBooking}
          onNext={() => setView('SELECT_DATE_TIME')}
          onBack={() => setView('HOME')}
          services={services}
        />;
      case 'SELECT_DATE_TIME':
        return <SelectDateTimeScreen
          booking={booking}
          setBooking={setBooking}
          onNext={() => setView('REVIEW')}
          onBack={() => setView('SELECT_SERVICES')}
        />;
      case 'REVIEW':
        return <ReviewScreen
          booking={booking}
          onConfirm={handleFinishBooking}
          onBack={() => setView('SELECT_DATE_TIME')}
        />;
      case 'MY_APPOINTMENTS':
        return <MyAppointmentsScreen
          appointments={appointments}
          onBack={() => setView('HOME')}
          onNew={() => setView('SELECT_SERVICES')}
          onRefresh={fetchAppointments}
        />;
      case 'LOGIN':
        return <LoginScreen onLogin={() => { setCurrentUserRole('BARBER'); setView('ADMIN_DASHBOARD'); }} onBack={() => setView('LANDING')} />;
      case 'ADMIN_DASHBOARD':
        return <AdminDashboard
          appointments={appointments}
          unreadCount={unreadCount}
          onLogout={() => {
            localStorage.removeItem('admin_auth');
            supabase.auth.signOut();
            setView('LANDING');
          }}
          onOpenChat={() => { setCurrentUserRole('BARBER'); setView('ADMIN_CHAT_LIST'); }}
          onManageServices={() => setView('ADMIN_SERVICES')}
          onBlockSchedule={() => setView('ADMIN_BLOCK_SCHEDULE')}
          onSettings={() => setView('ADMIN_SETTINGS')}
          onWeeklySchedule={() => setView('ADMIN_WEEKLY_SCHEDULE')}
          onFinance={() => setView('ADMIN_FINANCE')}
          onTV={() => setView('ADMIN_TV')}

          onRefresh={fetchAppointments}
          onClients={() => setView('ADMIN_CLIENTS')}
          setAppointments={setAppointments}
        />;
      case 'ADMIN_SERVICES':
        return <AdminServicesScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_BLOCK_SCHEDULE':
        return <AdminBlockScheduleScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_SETTINGS':
        return <AdminSettingsScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_WEEKLY_SCHEDULE':
        return <AdminWeeklyScheduleScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_FINANCE':
        return <AdminFinanceScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_TV':
        return <AdminTVScreen appointments={appointments} onRefresh={fetchAppointments} onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_CHAT_LIST':
        return <AdminChatListScreen
          onBack={() => setView('ADMIN_DASHBOARD')}
          onSelectChat={(cId, cName) => {
            setSelectedChatClient({ id: cId, name: cName });
            setView('CHAT');
          }}
        />;
      case 'CHAT':
        return <ChatScreen
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          onRegister={handleRegisterIdentity}
          currentUserRole={currentUserRole}
          customerIdentity={{ name: booking.customerName, phone: booking.customerPhone }}
          chatClientId={selectedChatClient?.id}
          onBack={() => {
            if (currentUserRole === 'BARBER') setView('ADMIN_CHAT_LIST');
            else setView('HOME');
          }}
        />;
      case 'CUSTOMER_LOGIN':
        return <CustomerLoginScreen
          onLogin={(phone) => {
            setBooking(prev => ({ ...prev, customerPhone: phone }));
            setView('MY_APPOINTMENTS');
          }}
          onBack={() => setView('HOME')}
        />;
      case 'ADMIN_CLIENTS':
        return <AdminClientsScreen
          onBack={() => setView('ADMIN_DASHBOARD')}
          onChat={(cId, cName) => {
            setSelectedChatClient({ id: cId, name: cName });
            setCurrentUserRole('BARBER');
            setView('CHAT');
          }}
        />;
      default:
        return <LandingScreen onStart={() => setView('HOME')} onAdmin={() => setView('LOGIN')} />;
    }
  };

  // Persist View State
  useEffect(() => {
    if (view.startsWith('ADMIN_')) {
      localStorage.setItem('last_admin_view', view);
    }
  }, [view]);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-white font-display transition-colors duration-300">
      {showSuccess && <SuccessOverlay />}
      <IOSNotification
        visible={notificationState.visible}
        message={notificationState.message}
        onClose={() => setNotificationState(prev => ({ ...prev, visible: false }))}
      />
      {renderView()}
      <ReloadPrompt />
    </div>
  );
};

export default App;
