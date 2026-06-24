import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './checkout-success.html',
  styleUrl: './checkout-success.css'
})
export class CheckoutSuccess implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  orderId = signal<string>('');
  paymentId = signal<string>('');
  isVerifying = signal<boolean>(false);

  ngOnInit(): void {
    this.cartService.clearCart();

    this.route.queryParams.subscribe(params => {
      // MP devuelve: payment_id, status, external_reference (= pedidoId)
      const pedidoId = params['external_reference'] || params['orderId'] || '';
      const paymentId = params['payment_id'] || '';
      const status = params['status'] || '';

      if (pedidoId) this.orderId.set(pedidoId);
      if (paymentId) this.paymentId.set(paymentId);

      // Si llegamos desde MP con payment_id, verificar el pago en el backend
      if (paymentId && pedidoId && status === 'approved') {
        this.isVerifying.set(true);
        this.http.get(`/api/pedidos/pago/success`, {
          params: { payment_id: paymentId, status, external_reference: pedidoId }
        }).subscribe({
          next: () => this.isVerifying.set(false),
          error: () => this.isVerifying.set(false) // el estado se actualiza por webhook de todos modos
        });
      }
    });
  }
}
