import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
export class Checkout implements OnInit {
  protected readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly mpService = inject(MercadoPagoService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  // Form states
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  orderId = signal<string>('');
  errorMessage = signal<string>('');
  // Payment form fields
  cardNumber = signal<string>('');
  expiry = signal<string>('');
  cvv = signal<string>('');

  // Prepopulate form using logged-in user if available
  firstName = signal<string>(this.userService.currentUser()?.firstName || '');
  lastName = signal<string>(this.userService.currentUser()?.lastName || '');
  email = signal<string>(this.userService.currentUser()?.email || '');

  async ngOnInit(): Promise<void> {
    await this.mpService.init();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) {
      return;
    }
    if (this.cartService.cartItems().length === 0) return;
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const customerName = `${this.firstName()} ${this.lastName()}`.trim() || 'Cliente Invitado';
    const customerEmail = this.email() || 'invitado@urbanwear.com';

    this.orderService.addOrder(customerName, customerEmail,
      this.cartService.cartItems().reduce((sum, i) => sum + i.quantity, 0),
      this.cartService.total()
    ).subscribe({
      next: async (order) => {
        this.orderId.set(order.id);
        const numericId = Number(order.id);
        if (!isNaN(numericId) && numericId > 0) {
          try {
            const pref = await this.mpService.crearPreference(numericId).toPromise();
            if (pref && (pref.sandboxInitPoint || pref.initPoint)) {
              // Render Mercado Pago checkout UI
              this.mpService.renderCheckout(pref.preferenceId, 'mp-checkout-container');
              this.isSubmitting.set(false);
              return;
            }
          } catch (e) {
            console.error('Error creating MercadoPago preference', e);
          }
        } else {
          console.warn('Guest order detected, skipping MercadoPago preference creation');
        }
        this.router.navigate(['checkout-success'], { queryParams: { orderId: order.id } });
        this.cartService.clearCart();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Checkout error:', err);
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err?.error?.message || 
          'Error al procesar el pedido. Por favor, inicia sesión de nuevo o revisa tu conexión.'
        );
      }
    });
  }

  updateField(field: 'firstName' | 'lastName' | 'email' | 'cardNumber' | 'expiry' | 'cvv', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (field === 'firstName') this.firstName.set(value);
    else if (field === 'lastName') this.lastName.set(value);
    else if (field === 'email') this.email.set(value);
    else if (field === 'cardNumber') this.cardNumber.set(value);
    else if (field === 'expiry') this.expiry.set(value);
    else if (field === 'cvv') this.cvv.set(value);
  }
}
