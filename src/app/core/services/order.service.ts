import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from './user.service';

export interface OrderDetail {
  id: number;
  cantidad: number;
  producto: {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    imagenUrl: string;
    marca: string;
  };
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  itemsCount: number;
  total: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  direccionEnvio?: string;
  detalles?: OrderDetail[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly userService = inject(UserService);

  private readonly STORAGE_KEY = 'urban_wear_orders_v2';
  private readonly orders = signal<Order[]>([]);

  private get apiUrl(): string {
    if (isPlatformServer(this.platformId)) {
      return 'http://localhost:8080/api';
    }
    return '/api';
  }

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored).map((o: any) => ({
            ...o,
            createdAt: new Date(o.createdAt)
          }));
          this.orders.set(parsed);
        } else {
          this.orders.set([]);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  getOrders(): Observable<Order[]> {
    const user = this.userService.currentUser();
    if (user && (user.role === 'admin' || user.role === 'super_user')) {
      return this.http.get<any[]>(`${this.apiUrl}/pedidos`).pipe(
        map(pedidos => pedidos.map(p => this.mapBackendOrderToFrontend(p)))
      );
    }
    
    return of(this.orders());
  }

  addOrder(customerName: string, customerEmail: string, itemsCount: number, total: number): Observable<Order> {
    const user = this.userService.currentUser();
    if (user) {
      return this.http.post<any>(`${this.apiUrl}/pedidos/confirmar`, null).pipe(
        map(pedido => this.mapBackendOrderToFrontend(pedido))
      );
    } else {
      const newOrder: Order = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName,
        customerEmail,
        itemsCount,
        total,
        status: 'pending',
        createdAt: new Date()
      };

      this.orders.update(items => {
        const updated = [newOrder, ...items];
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });

      return of(newOrder);
    }
  }

  updateOrderStatus(orderId: number | string, status: 'pending' | 'shipped' | 'delivered' | 'cancelled'): Observable<Order> {
    const backendStatus = this.mapFrontendStatusToBackend(status);
    return this.http.patch<any>(`${this.apiUrl}/pedidos/${orderId}/estado`, null, {
      params: { estado: backendStatus }
    }).pipe(
      map(pedido => this.mapBackendOrderToFrontend(pedido))
    );
  }

  private mapBackendOrderToFrontend(pedido: any): Order {
    const detalles = pedido.detalles || [];
    const itemsCount = detalles.reduce((sum: number, d: any) => sum + d.cantidad, 0);
    const subtotal = detalles.reduce((sum: number, d: any) => sum + ((d.producto?.precio || 0) * d.cantidad), 0);
    const total = pedido.total || (subtotal > 0 ? subtotal + 1500 : 0);
    
    return {
      id: String(pedido.id),
      customerName: pedido.usuario ? `${pedido.usuario.nombre} ${pedido.usuario.apellido}`.trim() : 'Cliente Invitado',
      customerEmail: pedido.usuario ? pedido.usuario.email : 'invitado@urbanwear.com',
      itemsCount,
      total,
      status: this.mapBackendStatusToFrontend(pedido.estado),
      createdAt: pedido.fecha ? new Date(pedido.fecha) : new Date(),
      direccionEnvio: pedido.direccionEnvio || '',
      detalles: detalles
    };
  }

  private mapBackendStatusToFrontend(estado: string): 'pending' | 'shipped' | 'delivered' | 'cancelled' {
    const normalized = (estado || '').toUpperCase();
    if (normalized === 'EN_CAMINO') return 'shipped';
    if (normalized === 'ENTREGADO') return 'delivered';
    if (normalized === 'CANCELADO') return 'cancelled';
    return 'pending';
  }

  private mapFrontendStatusToBackend(status: 'pending' | 'shipped' | 'delivered' | 'cancelled'): string {
    if (status === 'shipped') return 'EN_CAMINO';
    if (status === 'delivered') return 'ENTREGADO';
    if (status === 'cancelled') return 'CANCELADO';
    return 'PENDIENTE';
  }
}
