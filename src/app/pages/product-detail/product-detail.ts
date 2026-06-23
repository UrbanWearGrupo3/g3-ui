import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product, Variante, ColorInfo } from '../../models/product';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly location = inject(Location);

  product = signal<Product | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  selectedColor = signal<ColorInfo | null>(null);
  selectedTalle = signal<string | null>(null);
  quantity = signal<number>(1);
  addedToCartSuccess = signal<boolean>(false);

  // Derive unique colors from variants
  availableColors = computed(() => {
    const p = this.product();
    if (!p || !p.variantes) return [];

    const colorMap = new Map<number, ColorInfo>();
    for (const v of p.variantes) {
      if (v.color && v.color.id) {
        colorMap.set(v.color.id, v.color);
      }
    }
    return Array.from(colorMap.values());
  });

  // Derive available talles for selected color
  availableTalles = computed(() => {
    const p = this.product();
    const activeColor = this.selectedColor();
    if (!p || !p.variantes || !activeColor) return [];

    const talles = p.variantes
      .filter(v => v.color && v.color.id === activeColor.id)
      .map(v => v.talle);

    return Array.from(new Set(talles));
  });

  // Find exact matching variant
  selectedVariant = computed(() => {
    const p = this.product();
    const activeColor = this.selectedColor();
    const activeTalle = this.selectedTalle();
    if (!p || !p.variantes || !activeColor || !activeTalle) return null;

    return p.variantes.find(v => v.color && v.color.id === activeColor.id && v.talle === activeTalle) || null;
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.errorMessage.set('ID de producto no válido.');
      this.isLoading.set(false);
      return;
    }

    const id = Number(idParam);
    if (isNaN(id)) {
      this.errorMessage.set('ID de producto no válido.');
      this.isLoading.set(false);
      return;
    }

    this.productService.getProductById(id).subscribe({
      next: (prod) => {
        this.product.set(prod);
        this.isLoading.set(false);

        // Auto-select first variant's details if available
        if (prod.variantes && prod.variantes.length > 0) {
          const firstVar = prod.variantes[0];
          if (firstVar.color) {
            this.selectedColor.set(firstVar.color);
            const tallesForColor = prod.variantes
              .filter(v => v.color && v.color.id === firstVar.color.id)
              .map(v => v.talle);
            if (tallesForColor.length > 0) {
              const matchesFirst = prod.variantes.find(v => v.color && v.color.id === firstVar.color.id && v.talle === firstVar.talle);
              this.selectedTalle.set(matchesFirst ? matchesFirst.talle : tallesForColor[0]);
            }
          }
        }
      },
      error: (err) => {
        console.error('Error fetching product detail:', err);
        this.errorMessage.set('No se pudo cargar el producto. Es posible que no exista.');
        this.isLoading.set(false);
      }
    });
  }

  selectColor(color: ColorInfo) {
    this.selectedColor.set(color);

    const p = this.product();
    if (p && p.variantes) {
      const tallesForColor = p.variantes
        .filter(v => v.color && v.color.id === color.id)
        .map(v => v.talle);

      const currentTalle = this.selectedTalle();
      if (!currentTalle || !tallesForColor.includes(currentTalle)) {
        if (tallesForColor.length > 0) {
          this.selectedTalle.set(tallesForColor[0]);
        } else {
          this.selectedTalle.set(null);
        }
      }
    }
    this.quantity.set(1);
    this.addedToCartSuccess.set(false);
  }

  selectTalle(talle: string) {
    this.selectedTalle.set(talle);
    this.quantity.set(1);
    this.addedToCartSuccess.set(false);
  }

  incrementQuantity() {
    const variant = this.selectedVariant();
    if (!variant) return;

    if (this.quantity() < variant.stock) {
      this.quantity.update(q => q + 1);
    }
  }

  decrementQuantity() {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  addToCart() {
    const prod = this.product();
    const variant = this.selectedVariant();
    if (!prod || !variant || variant.stock <= 0) return;

    // Add to cart service
    this.cartService.addToCart(prod, this.quantity(), variant.color?.nombre, variant.talle);

    // Show visual confirmation
    this.addedToCartSuccess.set(true);
    setTimeout(() => {
      this.addedToCartSuccess.set(false);
    }, 3000);
  }

  goBack() {
    this.location.back();
  }

  getImageUrl(): string {
    const prod = this.product();
    return prod ? this.productService.getImageUrl(prod) : '';
  }
}
