export interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AccountSession {
  user: AccountUser | null;
  expiresAt: string | null;
}
