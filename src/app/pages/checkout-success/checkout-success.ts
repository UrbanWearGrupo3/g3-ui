import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './checkout-success.html',
  styleUrl: './checkout-success.css'
})
export class CheckoutSuccess implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly route = inject(ActivatedRoute);

  orderId = signal<string>('');

  ngOnInit(): void {
    this.cartService.clearCart();
    this.route.queryParams.subscribe(params => {
      if (params['orderId']) {
        this.orderId.set(params['orderId']);
      }
    });
  }
}
