import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService, CartItem } from '../../../core/services/cart.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly cartService = inject(CartService);
  protected readonly userService = inject(UserService);

  // Total quantity of items in the cart
  cartCount = computed(() => {
    return this.cartService.cartItems().reduce((acc: number, item: CartItem) => acc + item.quantity, 0);
  });
}
