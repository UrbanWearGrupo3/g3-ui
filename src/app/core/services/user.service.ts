import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { User } from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly SESSION_KEY = 'urban_wear_session';
  private readonly TOKEN_KEY = 'urban_wear_token';

  private get apiUrl(): string {
    if (isPlatformServer(this.platformId)) {
      return 'http://localhost:8080/api';
    }
    return '/api';
  }

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const active = localStorage.getItem(this.SESSION_KEY);
        if (active) {
          this._currentUser.set(JSON.parse(active));
        }
      } catch (e) {
        console.error('Error loading session from localStorage:', e);
      }
    }
  }

  validateSession(): Observable<boolean> {
    if (typeof window === 'undefined') {
      return of(false);
    }
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      this.logout();
      return of(false);
    }

    return this.http.get<any>(`${this.apiUrl}/usuarios/me`).pipe(
      tap(res => {
        const user = this.mapUser(res);
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
        this._currentUser.set(user);
      }),
      map(() => true),
      catchError(err => {
        console.error('Session validation failed:', err);
        this.logout();
        return of(false);
      })
    );
  }

  private mapUser(res: any): User {
    let mappedRole: 'super_user' | 'admin' | 'user' = 'user';
    const rawRol = res.rol?.toLowerCase();
    if (rawRol === 'super_user') {
      mappedRole = 'super_user';
    } else if (rawRol === 'admin') {
      mappedRole = 'admin';
    }
    return {
      id: res.id ? res.id.toString() : '',
      email: res.email,
      firstName: res.nombre,
      lastName: res.apellido,
      role: mappedRole,
      activo: res.activo !== undefined ? res.activo : true,
      createdAt: res.fechaCreacion ? new Date(res.fechaCreacion) : undefined
    };
  }

  login(email: string, password?: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        if (res && res.token) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(this.TOKEN_KEY, res.token);
            const user = this.mapUser({
              id: '',
              email: res.email,
              nombre: res.nombre,
              apellido: res.apellido,
              rol: res.rol
            });
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
            this._currentUser.set(user);
          }
        }
      }),
      map(res => !!(res && res.token)),
      catchError(err => {
        console.error('Backend login error:', err);
        return of(false);
      })
    );
  }

  register(firstName: string, lastName: string, email: string, password?: string): Observable<boolean> {
    const payload: any = {
      nombre: firstName,
      apellido: lastName,
      email: email,
      password: password
    };
    if (email.toLowerCase().endsWith('@urbanwear.com')) {
      payload.adminPasscode = 'URBANWEAR-SECRET-ADMIN-2026';
    }

    return this.http.post<any>(`${this.apiUrl}/auth/register`, payload).pipe(
      map(res => {
        return !!res;
      }),
      catchError(err => {
        console.error('Backend registration error:', err);
        return of(false);
      })
    );
  }

  logout() {
    this._currentUser.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this.router.navigate(['/login']);
  }

  getUsers(filters?: { search?: string; rol?: string; activo?: boolean }): Observable<User[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.rol) {
        let backendRol = 'CLIENTE';
        if (filters.rol === 'super_user') {
          backendRol = 'SUPER_USER';
        } else if (filters.rol === 'admin') {
          backendRol = 'ADMIN';
        }
        params = params.set('rol', backendRol);
      }
      if (filters.activo !== undefined) params = params.set('activo', filters.activo.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/usuarios`, { params }).pipe(
      map(res => {
        const list = res && res.content ? res.content : (Array.isArray(res) ? res : []);
        return list.map((u: any) => this.mapUser(u));
      }),
      catchError(err => {
        console.error('Backend getUsers error:', err);
        return of([]);
      })
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/usuarios/${id}`).pipe(
      catchError(err => {
        console.error('Backend deleteUser error:', err);
        throw err;
      })
    );
  }

  changeRol(id: string, rol: 'SUPER_USER' | 'ADMIN' | 'CLIENTE'): Observable<User> {
    return this.http.patch<any>(`${this.apiUrl}/usuarios/${id}/rol`, null, {
      params: { rol }
    }).pipe(
      map(u => this.mapUser(u)),
      catchError(err => {
        console.error('Backend changeRol error:', err);
        throw err;
      })
    );
  }

  toggleActivo(id: string, activo: boolean): Observable<User> {
    return this.http.patch<any>(`${this.apiUrl}/usuarios/${id}/activo`, null, {
      params: { activo: activo.toString() }
    }).pipe(
      map(u => this.mapUser(u)),
      catchError(err => {
        console.error('Backend toggleActivo error:', err);
        throw err;
      })
    );
  }

  updateProfile(firstName: string, lastName: string, password?: string): Observable<User> {
    const payload: any = {
      nombre: firstName,
      apellido: lastName
    };
    if (password) {
      payload.password = password;
    }
    return this.http.put<any>(`${this.apiUrl}/usuarios/me`, payload).pipe(
      map(res => this.mapUser(res)),
      tap(user => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
          this._currentUser.set(user);
        }
      }),
      catchError(err => {
        console.error('Backend updateProfile error:', err);
        throw err;
      })
    );
  }

  createUser(user: Omit<User, 'id'> & { password?: string }): Observable<User> {
    let backendRol = 'CLIENTE';
    if (user.role === 'super_user') {
      backendRol = 'SUPER_USER';
    } else if (user.role === 'admin') {
      backendRol = 'ADMIN';
    }
    const payload = {
      nombre: user.firstName,
      apellido: user.lastName,
      email: user.email,
      rol: backendRol,
      activo: user.activo,
      password: user.password
    };
    return this.http.post<any>(`${this.apiUrl}/usuarios`, payload).pipe(
      map(res => this.mapUser(res)),
      catchError(err => {
        console.error('Backend createUser error:', err);
        throw err;
      })
    );
  }

  updateUser(id: string, user: Partial<User> & { password?: string }): Observable<User> {
    const payload: any = {};
    if (user.firstName !== undefined) payload.nombre = user.firstName;
    if (user.lastName !== undefined) payload.apellido = user.lastName;
    if (user.email !== undefined) payload.email = user.email;
    if (user.role !== undefined) {
      let backendRol = 'CLIENTE';
      if (user.role === 'super_user') {
        backendRol = 'SUPER_USER';
      } else if (user.role === 'admin') {
        backendRol = 'ADMIN';
      }
      payload.rol = backendRol;
    }
    if (user.activo !== undefined) payload.activo = user.activo;
    if (user.password !== undefined && user.password !== '') payload.password = user.password;

    return this.http.put<any>(`${this.apiUrl}/usuarios/${id}`, payload).pipe(
      map(res => this.mapUser(res)),
      catchError(err => {
        console.error('Backend updateUser error:', err);
        throw err;
      })
    );
  }
}
