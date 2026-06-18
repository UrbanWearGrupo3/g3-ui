import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly STORAGE_KEY = 'urban_wear_users';
  private readonly users = signal<User[]>([]);

  // Current logged in user state (null if guest)
  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.users.set(JSON.parse(stored));
        } else {
          // Initialize mock users
          const initialUsers: User[] = [
            {
              id: '1',
              email: 'admin@urbanwear.com',
              firstName: 'Emilio',
              lastName: 'García',
              role: 'admin',
              createdAt: new Date('2026-06-01T10:00:00')
            },
            {
              id: '2',
              email: 'sofia@gmail.com',
              firstName: 'Sofía',
              lastName: 'Rodríguez',
              role: 'user',
              createdAt: new Date('2026-06-15T14:30:00')
            },
            {
              id: '3',
              email: 'lucas.paz@outlook.com',
              firstName: 'Lucas',
              lastName: 'Paz',
              role: 'user',
              createdAt: new Date('2026-06-17T09:15:00')
            }
          ];
          this.users.set(initialUsers);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialUsers));
        }
      } catch (e) {
        console.error(e);
      }

      // Check for current active user session
      try {
        const active = localStorage.getItem('urban_wear_session');
        if (active) {
          this._currentUser.set(JSON.parse(active));
        } else {
          // Default to admin for testing / local exploration convenience
          const adminUser = this.users().find(u => u.role === 'admin') || null;
          this._currentUser.set(adminUser);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  getUsers(): Observable<User[]> {
    return of(this.users());
  }

  deleteUser(id: string): Observable<void> {
    this.users.update(items => {
      const updated = items.filter(u => u.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
    return of(undefined);
  }

  login(email: string): boolean {
    const user = this.users().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      this._currentUser.set(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('urban_wear_session', JSON.stringify(user));
      }
      return true;
    }
    return false;
  }

  register(firstName: string, lastName: string, email: string): boolean {
    const exists = this.users().some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return false;

    const newUser: User = {
      id: String(this.users().length + 1),
      email,
      firstName,
      lastName,
      role: 'user',
      createdAt: new Date()
    };

    this.users.update(items => {
      const updated = [...items, newUser];
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    this._currentUser.set(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('urban_wear_session', JSON.stringify(newUser));
    }
    return true;
  }

  logout() {
    this._currentUser.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('urban_wear_session');
    }
  }
}
