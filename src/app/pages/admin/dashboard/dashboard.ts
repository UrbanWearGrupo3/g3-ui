import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { OrderService, Order } from '../../../core/services/order.service';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly orderService = inject(OrderService);
  recentOrders = signal<Order[]>([]);

  ngOnInit(): void {
    this.orderService.getOrders().subscribe({
      next: (orders) => this.recentOrders.set(orders.slice(0, 5)),
      error: (err) => console.error('Error fetching orders from Java backend:', err)
    });
  }
}
