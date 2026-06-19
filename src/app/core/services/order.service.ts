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
  private readonly STORAGE_KEY = 'urban_wear_orders_v2';
  private readonly orders = signal<Order[]>([]);

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
