import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { OrderService, Order } from '../../core/services/order.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css'
})
export class MyOrders implements OnInit {
  private readonly orderService = inject(OrderService);
  protected readonly userService = inject(UserService);
  private readonly router = inject(Router);

  orders = signal<Order[]>([]);
  loading = signal<boolean>(false);
  expandedOrderId = signal<string | null>(null);

  ngOnInit(): void {
    const user = this.userService.currentUser();
    if (!user) {
      this.router.navigate(['/login'], { queryParams: { message: 'Inicia sesión para ver tu historial de pedidos.' } });
      return;
    }
    if (user.role !== 'user') {
      this.router.navigate(['/admin']);
      return;
    }
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (data) => {
        // Ordenar por fecha decreciente (más recientes primero)
        const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.orders.set(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching customer orders:', err);
        this.loading.set(false);
      }
    });
  }

  toggleOrderDetails(orderId: string): void {
    if (this.expandedOrderId() === orderId) {
      this.expandedOrderId.set(null);
    } else {
      this.expandedOrderId.set(orderId);
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/10 text-green-500 border border-green-500/25';
      case 'shipped':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/25';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/25 animate-pulse';
      case 'cancelled':
      default:
        return 'bg-brand-red/10 text-brand-red border border-brand-red/25';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'delivered':
        return 'Entregado';
      case 'shipped':
        return 'En Camino';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
      default:
        return 'Cancelado';
    }
  }
}
