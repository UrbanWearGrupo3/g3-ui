import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MercadoPagoService } from '../../core/services/mercado-pago.service';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkout {
  protected readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly mpService = inject(MercadoPagoService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  // Form states
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  /** true cuando el pedido fue creado y MP está listo — muestra pantalla de redirección */
  mpReady = signal<boolean>(false);
  orderId = signal<string>('');
  errorMessage = signal<string>('');

  // Form fields
  firstName = signal<string>(this.userService.currentUser()?.firstName || '');
  lastName = signal<string>(this.userService.currentUser()?.lastName || '');
  email = signal<string>(this.userService.currentUser()?.email || '');

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) return;
    if (this.cartService.cartItems().length === 0) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const customerName = `${this.firstName()} ${this.lastName()}`.trim() || 'Cliente Invitado';
    const customerEmail = this.email() || 'invitado@urbanwear.com';

    this.orderService.addOrder(
      customerName,
      customerEmail,
      this.cartService.cartItems().reduce((sum, i) => sum + i.quantity, 0),
      this.cartService.total()
    ).subscribe({
      next: async (order) => {
        this.orderId.set(order.id);
        const numericId = Number(order.id);

        // Pedido de invitado (ID no numérico): no necesita MP
        if (isNaN(numericId) || numericId <= 0) {
          this.cartService.clearCart();
          this.router.navigate(['checkout-success'], { queryParams: { orderId: order.id } });
          this.isSubmitting.set(false);
          return;
        }

        // Usuario registrado: Compra fingida saltando Mercado Pago
        this.cartService.clearCart();
        this.router.navigate(['checkout-success'], { queryParams: { orderId: order.id } });
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Checkout error:', err);
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          'Error al procesar el pedido. Por favor, iniciá sesión de nuevo o revisá tu conexión.'
        );
      }
    });
  }

  /** Cancela el estado de redirección y vuelve al formulario */
  cancelarPago(): void {
    this.mpReady.set(false);
  }

  updateField(field: 'firstName' | 'lastName' | 'email', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (field === 'firstName') this.firstName.set(value);
    else if (field === 'lastName') this.lastName.set(value);
    else if (field === 'email') this.email.set(value);
  }
}
