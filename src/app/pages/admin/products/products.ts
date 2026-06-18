import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../models/product';

@Component({
  selector: 'app-products',
  imports: [DecimalPipe],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);
  products = signal<Product[]>([]);

  // Add product form states
  isFormOpen = signal<boolean>(false);
  nameField = signal<string>('');
  descField = signal<string>('');
  priceField = signal<number>(0);
  stockField = signal<number>(0);
  categoryField = signal<string>('Camisetas');
  imageField = signal<string>('');

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (prods) => this.products.set(prods),
      error: (err) => console.error('Error fetching admin products:', err)
    });
  }

  deleteProduct(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.products.update(items => items.filter(p => p.id !== id));
        },
        error: (err) => console.error('Error deleting product:', err)
      });
    }
  }

  toggleForm(isOpen: boolean) {
    this.isFormOpen.set(isOpen);
    if (!isOpen) {
      // Clear form fields
      this.nameField.set('');
      this.descField.set('');
      this.priceField.set(0);
      this.stockField.set(0);
      this.categoryField.set('Camisetas');
      this.imageField.set('');
    }
  }

  updateFormField(field: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const val = target.value;

    if (field === 'name') this.nameField.set(val);
    else if (field === 'desc') this.descField.set(val);
    else if (field === 'price') this.priceField.set(Number(val));
    else if (field === 'stock') this.stockField.set(Number(val));
    else if (field === 'category') this.categoryField.set(val);
    else if (field === 'image') this.imageField.set(val);
  }

  onSubmitProduct(event: Event) {
    event.preventDefault();

    const newProduct: Partial<Product> = {
      name: this.nameField(),
      description: this.descField(),
      price: this.priceField(),
      stock: this.stockField(),
      category: this.categoryField(),
      imageUrl: this.imageField() || undefined
    };

    this.productService.saveProduct(newProduct).subscribe({
      next: (savedProd) => {
        this.products.update(items => [savedProd, ...items]);
        this.toggleForm(false);
      },
      error: (err) => console.error('Error saving product:', err)
    });
  }
}
