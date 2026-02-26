
export type AppView =
  | 'LANDING'
  | 'HOME'
  | 'SELECT_SERVICES'
  | 'SELECT_DATE_TIME'
  | 'REVIEW'
  | 'MY_APPOINTMENTS'
  | 'LOGIN'
  | 'ADMIN_DASHBOARD'
  | 'CHAT'
  | 'ADMIN_SERVICES'
  | 'ADMIN_CHAT_LIST'
  | 'ADMIN_BLOCK_SCHEDULE'
  | 'ADMIN_SETTINGS'
  | 'ADMIN_FINANCE'
  | 'ADMIN_TV';

export interface BlockedSlot {
  id: string;
  date: string;
  time: string;
  reason: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl: string;
  popular?: boolean;
}

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  services: Service[];
  date: string; // ISO string or simple YYYY-MM-DD
  time: string; // HH:mm
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

export interface BookingState {
  customerName: string;
  customerPhone: string;
  selectedServices: Service[];
  selectedDate: string;
  selectedTime: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'CUSTOMER' | 'BARBER';
  timestamp: Date;
}
