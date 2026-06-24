import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
  selectedOrder = signal<Order | null>(null);
  selectedStatus = signal<'pending' | 'shipped' | 'delivered' | 'cancelled'>('pending');
  isModalOpen = signal<boolean>(false);
  updatingStatus = signal<boolean>(false);

  // Pagination states
  currentPage = signal<number>(0);
  pageSize = signal<number>(10);

  paginatedOrders = computed(() => {
    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    return this.recentOrders().slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.recentOrders().length / this.pageSize());
  });

  pageNumbers = computed(() => {
    const pages = [];
    const total = this.totalPages();
    for (let i = 0; i < total; i++) {
      pages.push(i);
    }
    return pages;
  });

  // Dynamic Metrics
  totalSales = computed(() => {
    return this.recentOrders()
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);
  });

  processedOrdersCount = computed(() => {
    return this.recentOrders().length;
  });

  activeOrdersCount = computed(() => {
    return this.recentOrders().filter(o => o.status === 'pending' || o.status === 'shipped').length;
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        const sorted = [...orders].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        this.recentOrders.set(sorted);
        this.currentPage.set(0);
      },
      error: (err) => console.error('Error fetching orders from Java backend:', err)
    });
  }

  viewOrderDetails(order: Order): void {
    this.selectedOrder.set(order);
    this.selectedStatus.set(order.status);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedOrder.set(null);
  }

  onStatusChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedStatus.set(selectElement.value as any);
  }

  saveOrderStatus(): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.updatingStatus.set(true);
    this.orderService.updateOrderStatus(order.id, this.selectedStatus()).subscribe({
      next: () => {
        this.updatingStatus.set(false);
        this.closeModal();
        this.loadOrders();
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.updatingStatus.set(false);
        alert('Error al actualizar el estado del pedido.');
      }
    });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(Number(target.value));
    this.currentPage.set(0);
  }
}
