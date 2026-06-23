import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ColorResponse } from '../../models/product';

@Injectable({
  providedIn: 'root'
})
export class ColorService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private get apiUrl(): string {
    if (isPlatformServer(this.platformId)) {
      return 'http://localhost:8080/api/colores';
    }
    return '/api/colores';
  }

  getColores(soloActivos: boolean = true): Observable<ColorResponse[]> {
    const params = new HttpParams().set('soloActivos', soloActivos.toString());
    return this.http.get<ColorResponse[]>(this.apiUrl, { params });
  }
}
