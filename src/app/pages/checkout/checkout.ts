import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  protected readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  // Form states
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  orderId = signal<string>('');

  // Prepopulate form using logged-in user if available
  firstName = signal<string>(this.userService.currentUser()?.firstName || '');
  lastName = signal<string>(this.userService.currentUser()?.lastName || '');
  email = signal<string>(this.userService.currentUser()?.email || '');

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.cartService.cartItems().length === 0) return;

    this.isSubmitting.set(true);

    // Simulate payment processing delay
    setTimeout(() => {
      const customerName = `${this.firstName()} ${this.lastName()}`.trim() || 'Cliente Invitado';
      const customerEmail = this.email() || 'invitado@urbanwear.com';
      const itemsCount = this.cartService.cartItems().reduce((sum, item) => sum + item.quantity, 0);
      const total = this.cartService.total();

      this.orderService.addOrder(customerName, customerEmail, itemsCount, total).subscribe({
        next: (order) => {
          this.orderId.set(order.id);
          this.isSuccess.set(true);
          this.cartService.clearCart();
          this.isSubmitting.set(false);
        },
        error: () => {
          this.isSubmitting.set(false);
        }
      });
    }, 1500);
  }

  updateField(field: 'firstName' | 'lastName' | 'email', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (field === 'firstName') this.firstName.set(value);
    else if (field === 'lastName') this.lastName.set(value);
    else if (field === 'email') this.email.set(value);
  }
}
