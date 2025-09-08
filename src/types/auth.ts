export interface User {
  id: number;
  email: string;
  nama: string;
  role: 'kepala_sekolah' | 'guru' | 'operator';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}
