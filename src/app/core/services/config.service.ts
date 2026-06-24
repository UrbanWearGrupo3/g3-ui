import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConfigItem {
  clave: string;
  valor: string;
  descripcion: string;
  sobreescritoBd: boolean;
}

export interface AuditLog {
  id: number;
  clave: string;
  valorAnterior: string;
  valorNuevo: string;
  usuario: string;
  tipoAccion: string;
  fechaCambio: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private get apiUrl(): string {
    if (isPlatformServer(this.platformId)) {
      return 'http://localhost:8080/api/super-user/config';
    }
    return '/api/super-user/config';
  }

  getConfigs(): Observable<ConfigItem[]> {
    return this.http.get<ConfigItem[]>(this.apiUrl);
  }

  getConfig(key: string, unmasked: boolean = false): Observable<{ clave: string; valor: string; enmascarado: boolean }> {
    return this.http.get<{ clave: string; valor: string; enmascarado: boolean }>(
      `${this.apiUrl}/${key}`,
      { params: { unmasked: unmasked.toString() } }
    );
  }

  updateConfig(key: string, valor: string, descripcion?: string): Observable<any> {
    const body: any = { valor };
    if (descripcion) {
      body.descripcion = descripcion;
    }
    return this.http.put(`${this.apiUrl}/${key}`, body);
  }

  deleteConfig(key: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${key}`);
  }

  regenerateInternalToken(): Observable<{ mensaje: string; nuevoTokenInterno: string }> {
    return this.http.post<{ mensaje: string; nuevoTokenInterno: string }>(`${this.apiUrl}/regenerate-internal-token`, null);
  }

  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/auditoria`);
  }
}
