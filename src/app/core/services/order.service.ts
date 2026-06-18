import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  itemsCount: number;
  total: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly STORAGE_KEY = 'urban_wear_orders';
  private readonly orders = signal<Order[]>([]);

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          // Parse dates correctly
          const parsed = JSON.parse(stored).map((o: any) => ({
            ...o,
            createdAt: new Date(o.createdAt)
          }));
          this.orders.set(parsed);
        } else {
          // Initialize mock orders
          const initialOrders: Order[] = [
            {
              id: 'ORD-5401',
              customerName: 'Sofía Rodríguez',
              customerEmail: 'sofia@gmail.com',
              itemsCount: 2,
              total: 71490.00,
              status: 'delivered',
              createdAt: new Date('2026-06-15T15:00:00')
            },
            {
              id: 'ORD-5402',
              customerName: 'Lucas Paz',
              customerEmail: 'lucas.paz@outlook.com',
              itemsCount: 1,
              total: 89990.00,
              status: 'shipped',
              createdAt: new Date('2026-06-17T11:20:00')
            },
            {
              id: 'ORD-5403',
              customerName: 'Mateo Fernández',
              customerEmail: 'mateo@yahoo.com',
              itemsCount: 3,
              total: 61500.00,
              status: 'pending',
              createdAt: new Date('2026-06-18T08:45:00')
            }
          ];
          this.orders.set(initialOrders);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialOrders));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  getOrders(): Observable<Order[]> {
    return of(this.orders());
  }

  addOrder(customerName: string, customerEmail: string, itemsCount: number, total: number): Observable<Order> {
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
