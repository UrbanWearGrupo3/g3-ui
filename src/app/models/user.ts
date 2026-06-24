export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_user' | 'admin' | 'user';
  activo: boolean;
  createdAt?: Date;
}

export interface UserPage {
  content: User[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

