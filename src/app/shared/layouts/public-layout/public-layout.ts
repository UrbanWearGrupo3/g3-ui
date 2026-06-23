import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, Navbar, Footer],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
export class PublicLayout {
  protected readonly cartService = inject(CartService);
}
