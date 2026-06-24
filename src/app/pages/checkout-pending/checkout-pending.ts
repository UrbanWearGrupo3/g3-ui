import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-checkout-pending',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 py-16">
      <div class="bg-brand-card-gray border border-brand-border-gray p-8 sm:p-12 rounded-3xl max-w-xl w-full space-y-6 shadow-2xl text-center">

        <div class="mx-auto w-20 h-20 bg-yellow-500/10 flex items-center justify-center rounded-full border border-yellow-500/30">
          <svg class="h-10 w-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div class="space-y-3">
          <p class="text-xs text-yellow-400 font-black tracking-widest uppercase">PAGO PENDIENTE</p>
          <h2 class="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">Pago en proceso</h2>
          <p class="text-sm text-brand-text-muted leading-relaxed">
            Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.
          </p>
          @if (orderId()) {
            <div class="inline-block bg-black px-6 py-3 rounded-xl border border-brand-border-gray text-white font-mono text-base font-bold mt-2">
              Pedido #{{ orderId() }}
            </div>
          }
        </div>

        <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <a routerLink="/products"
            class="inline-flex items-center justify-center px-6 py-3.5 bg-brand-red hover:bg-white text-black hover:text-black font-black text-xs uppercase rounded-xl transition-all duration-300 tracking-wider">
            Seguir Comprando
          </a>
        </div>
      </div>
    </div>
  `
})
export class CheckoutPending implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  orderId = signal<string>('');

  ngOnInit(): void {
    this.cartService.clearCart();
    this.route.queryParams.subscribe(params => {
      const pedidoId = params['external_reference'] || params['orderId'] || '';
      const paymentId = params['payment_id'] || '';
      const status = params['status'] || '';
      if (pedidoId) this.orderId.set(pedidoId);

      if (paymentId && pedidoId) {
        this.http.get(`/api/pedidos/pago/pending`, {
          params: { payment_id: paymentId, status: status || 'pending', external_reference: pedidoId }
        }).subscribe({ error: () => {} });
      }
    });
  }
}
