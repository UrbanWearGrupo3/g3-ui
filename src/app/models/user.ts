export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_user' | 'admin' | 'user';
  activo: boolean;
  createdAt?: Date;
}
