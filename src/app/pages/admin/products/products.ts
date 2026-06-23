import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { DecimalPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductoRequest, VarianteRequest, ColorResponse } from '../../../models/product';
import { ColorService } from '../../../core/services/color.service';


@Component({
  selector: 'app-products',
  imports: [DecimalPipe, CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly colorService = inject(ColorService);
  products = signal<Product[]>([]);
  colores = signal<ColorResponse[]>([]);
  isLoading = signal<boolean>(false);
  activeFormTab = signal<'general' | 'variants'>('general');



  // Add product form states
  isFormOpen = signal<boolean>(false);
  nameField = signal<string>('');
  descField = signal<string>('');
  priceField = signal<number>(0);
  brandField = signal<string>('');
  categoryIdField = signal<number>(1);
  imageField = signal<string>('');
  editingProductId = signal<number | null>(null);

  // Image Upload States
  selectedFile = signal<File | null>(null);
  imagePreviewUrl = signal<string>('');
  isUploadingImage = signal<boolean>(false);

  // Variante fields
  varTalle = signal<string>('');
  varColorId = signal<number | null>(null);
  varStock = signal<number>(0);
  variantes = signal<VarianteRequest[]>([]);

  // Bulk Generation fields
  tallesDisponibles = ['S', 'M', 'L', 'XL', 'U'];
  selectedTalles = signal<string[]>([]);
  selectedColors = signal<number[]>([]);
  bulkStock = signal<number>(10);

  // Variant filtering fields
  varFilterText = signal<string>('');
  varFilterTalle = signal<string>('');
  varFilterColorId = signal<number | null>(null);

  variantesFiltradas = computed(() => {
    const list = this.variantes();
    const query = this.varFilterText().toLowerCase().trim();
    const talle = this.varFilterTalle();
    const colorId = this.varFilterColorId();

    return list.filter((v, index) => {
      const matchText = !query || 
        (v.codigoBarras && v.codigoBarras.toLowerCase().includes(query)) ||
        `variante-${index}`.includes(query);

      const matchTalle = !talle || v.talle === talle;

      const matchColor = colorId == null || v.colorId === colorId;

      return matchText && matchTalle && matchColor;
    });
  });



  // Form feedback
  formError = signal<string>('');
  formSuccess = signal<string>('');

  // Pagination
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);

  // Product Filter States
  searchQuery = signal<string>('');
  categoryFilter = signal<string>('');
  statusFilter = signal<string>('');

  ngOnInit(): void {
    this.loadProducts();
    this.loadColors();
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('overflow-hidden');
    }
  }


  loadColors() {
    this.colorService.getColores(true).subscribe({
      next: (data) => {
        this.colores.set(data);
      },
      error: (err) => console.error('Error cargando colores:', err)
    });
  }


  loadProducts() {
    this.isLoading.set(true);
    const filters: any = {
      page: this.currentPage(),
      size: 20
    };

    const query = this.searchQuery().trim();
    if (query) filters.nombre = query;

    const catId = this.categoryFilter();
    if (catId) filters.categoriaId = Number(catId);

    const activo = this.statusFilter();
    if (activo !== '') {
      filters.activo = activo === 'true';
    }

    this.productService.getProducts(filters).subscribe({
      next: (page) => {
        this.products.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching admin products:', err);
        this.isLoading.set(false);
      }
    });
  }

  deleteProduct(id: number): void {
    throw new Error('No está permitido eliminar productos. Utilice la desactivación en su lugar.');
  }

  toggleActivo(id: number, currentActivo: boolean): void {
    this.productService.toggleActivo(id, !currentActivo).subscribe({
      next: (updated) => {
        this.products.update(items =>
          items.map(p => p.id === id ? updated : p)
        );
      },
      error: (err) => console.error('Error toggling active:', err)
    });
  }

  onFilterChange(field: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const val = target.value;
    if (field === 'search') {
      this.searchQuery.set(val);
    } else if (field === 'category') {
      this.categoryFilter.set(val);
    } else if (field === 'status') {
      this.statusFilter.set(val);
    }
    this.currentPage.set(0);
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.categoryFilter.set('');
    this.statusFilter.set('');
    this.currentPage.set(0);
    this.loadProducts();
  }

  toggleForm(isOpen: boolean) {
    this.isFormOpen.set(isOpen);
    if (typeof document !== 'undefined') {
      if (isOpen) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    }
    if (!isOpen) {
      this.clearForm();
    } else {
      this.activeFormTab.set('general');
    }
  }


  clearForm() {
    this.nameField.set('');
    this.descField.set('');
    this.priceField.set(0);
    this.brandField.set('');
    this.categoryIdField.set(1);
    this.imageField.set('');
    this.varTalle.set('');
    this.varColorId.set(null);
    this.varStock.set(0);
    this.variantes.set([]);
    this.selectedTalles.set([]);
    this.selectedColors.set([]);
    this.bulkStock.set(10);
    this.varFilterText.set('');
    this.varFilterTalle.set('');
    this.varFilterColorId.set(null);
    this.formError.set('');


    this.formSuccess.set('');
    this.selectedFile.set(null);
    this.imagePreviewUrl.set('');
    this.isUploadingImage.set(false);
    this.editingProductId.set(null);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.selectedFile.set(file);

      // Create local preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedFile() {
    this.selectedFile.set(null);
    this.imagePreviewUrl.set('');
    this.imageField.set('');
  }

  updateVariantField(index: number, field: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const val = target.value;
    this.variantes.update(list => {
      const newList = [...list];
      if (field === 'talle') {
        newList[index].talle = val;
      } else if (field === 'colorId') {
        newList[index].colorId = Number(val);
      } else if (field === 'stock') {
        newList[index].stock = Number(val);
      }
      return newList;
    });
  }

  updateVariantFieldByObject(v: VarianteRequest, field: string, val: any) {
    this.formError.set('');
    this.variantes.update(list => {
      const idx = list.indexOf(v);
      if (idx === -1) return list;

      const nuevoTalle = field === 'talle' ? val : v.talle;
      const nuevoColorId = field === 'colorId' ? Number(val) : Number(v.colorId);

      // Check collision with any OTHER variant in the list
      const colision = list.some((item, i) => 
        i !== idx && 
        item.talle.toUpperCase() === nuevoTalle.toUpperCase() && 
        Number(item.colorId) === nuevoColorId
      );

      if (colision) {
        this.formError.set('No se puede cambiar la variante: esa combinación de talle y color ya existe.');
        return list;
      }

      const newList = [...list];
      if (field === 'talle') {
        newList[idx].talle = val;
      } else if (field === 'colorId') {
        newList[idx].colorId = Number(val);
      } else if (field === 'stock') {
        newList[idx].stock = Number(val);
      }
      return newList;
    });
  }


  editProduct(product: Product) {
    this.editingProductId.set(product.id);
    this.nameField.set(product.nombre);
    this.descField.set(product.descripcion || '');
    this.priceField.set(product.precio);
    this.brandField.set(product.marca || '');
    this.categoryIdField.set(product.categoria?.id || 1);
    this.imageField.set(product.imagenUrl || '');
    this.imagePreviewUrl.set(product.imagenUrl || '');
    this.selectedFile.set(null);
    if (product.variantes) {
      this.variantes.set(product.variantes.map(v => ({
        talle: v.talle,
        colorId: v.color?.id || 1,
        stock: v.stock,
        codigoBarras: v.codigoBarras
      })));
    } else {
      this.variantes.set([]);
    }

    this.formError.set('');
    this.formSuccess.set('');
    this.isFormOpen.set(true);
  }

  updateFormField(field: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const val = target.value;

    if (field === 'name') this.nameField.set(val);
    else if (field === 'desc') this.descField.set(val);
    else if (field === 'price') this.priceField.set(Number(val));
    else if (field === 'brand') this.brandField.set(val);
    else if (field === 'categoryId') this.categoryIdField.set(Number(val));
    else if (field === 'image') this.imageField.set(val);
    else if (field === 'varTalle') this.varTalle.set(val);
    else if (field === 'varColorId') this.varColorId.set(val ? Number(val) : null);
    else if (field === 'varStock') this.varStock.set(Number(val));
  }

  toggleTalle(talle: string) {
    this.selectedTalles.update(list =>
      list.includes(talle) ? list.filter(t => t !== talle) : [...list, talle]
    );
  }

  toggleColorSelection(colorId: number) {
    this.selectedColors.update(list =>
      list.includes(colorId) ? list.filter(id => id !== colorId) : [...list, colorId]
    );
  }

  generarCombinaciones() {
    const talles = this.selectedTalles();
    const colorIds = this.selectedColors();
    const stock = this.bulkStock();

    if (talles.length === 0 || colorIds.length === 0) {
      this.formError.set('Debe seleccionar al menos un talle y un color para generar combinaciones.');
      return;
    }

    let countNuevas = 0;
    let countExistentes = 0;

    this.variantes.update(existing => {
      const nuevas = [...existing];
      for (const talle of talles) {
        for (const colorId of colorIds) {
          const existe = nuevas.some(v => v.talle.toUpperCase() === talle.toUpperCase() && Number(v.colorId) === colorId);
          if (!existe) {
            nuevas.push({
              talle,
              colorId,
              stock: stock >= 0 ? stock : 0
            });
            countNuevas++;
          } else {
            countExistentes++;
          }
        }
      }
      return nuevas;
    });

    this.selectedTalles.set([]);
    this.selectedColors.set([]);
    
    if (countExistentes > 0) {
      if (countNuevas === 0) {
        this.formError.set('Todas las combinaciones seleccionadas ya existen en la lista.');
      } else {
        this.formError.set('Algunas combinaciones seleccionadas ya existen y fueron omitidas.');
      }
    } else {
      this.formError.set('');
    }
  }

  addVariante() {
    this.formError.set('');
    const talle = this.varTalle().trim();
    const colorId = this.varColorId();
    const stock = this.varStock();

    if (!talle || colorId == null) {
      this.formError.set('Talle y color son obligatorios para la variante.');
      return;
    }

    // Check duplicate
    const exists = this.variantes().some(v => 
      v.talle.toUpperCase() === talle.toUpperCase() && Number(v.colorId) === colorId
    );
    if (exists) {
      this.formError.set('La variante con este talle y color ya existe en la lista.');
      return;
    }

    this.variantes.update(list => [...list, { talle, colorId, stock }]);
    this.varTalle.set('');
    this.varColorId.set(null);
    this.varStock.set(0);
  }

  removeVariante(index: number) {
    this.variantes.update(list => list.filter((_, i) => i !== index));
  }

  removeVarianteObject(v: VarianteRequest) {
    this.variantes.update(list => list.filter(item => item !== v));
  }


  async onSubmitProduct(event: Event) {
    event.preventDefault();
    this.formError.set('');
    this.formSuccess.set('');

    // Validations
    if (!this.nameField() || !this.nameField().trim()) {
      this.formError.set('El nombre de la prenda es obligatorio y no puede estar vacío.');
      return;
    }
    if (this.nameField().trim().length < 3) {
      this.formError.set('El nombre de la prenda debe tener al menos 3 caracteres.');
      return;
    }
    if (this.priceField() == null || this.priceField() <= 0) {
      this.formError.set('El precio debe ser un número válido mayor a 0.');
      return;
    }
    if (!this.descField() || !this.descField().trim()) {
      this.formError.set('La descripción es obligatoria y no puede estar vacía.');
      return;
    }
    if (this.descField().trim().length < 10) {
      this.formError.set('La descripción debe tener al menos 10 caracteres.');
      return;
    }
    if (!this.imagePreviewUrl() && !this.imageField()) {
      this.formError.set('Debe cargar una imagen para la prenda antes de guardarla.');
      return;
    }
    if (this.variantes().length === 0) {
      this.formError.set('El producto debe tener al menos una variante de talle/color.');
      return;
    }
    const uniqueCount = new Set(this.variantes().map(v => `${v.talle.toUpperCase()}-${v.colorId}`)).size;
    if (uniqueCount < this.variantes().length) {
      this.formError.set('La lista de variantes contiene combinaciones de talle y color duplicadas.');
      return;
    }

    this.isLoading.set(true);

    let finalImageUrl = this.imageField();

    const file = this.selectedFile();
    if (file) {
      this.isUploadingImage.set(true);
      try {
        const uploadRes = await firstValueFrom(this.productService.uploadImage(file));
        finalImageUrl = uploadRes.url;
        this.isUploadingImage.set(false);
      } catch (err: any) {
        console.error('Error uploading image to backend proxy:', err);
        this.formError.set('Error al subir la imagen al backend: ' + (err.message || err.error?.error || err.error || err));
        this.isUploadingImage.set(false);
        this.isLoading.set(false);
        return;
      }
    }

    const request: ProductoRequest = {
      nombre: this.nameField(),
      descripcion: this.descField(),
      precio: this.priceField(),
      marca: 'UrbanWear',
      imagenUrl: finalImageUrl || undefined,
      categoriaId: this.categoryIdField(),
      variantes: this.variantes().length > 0 ? this.variantes() : undefined
    };

    const editId = this.editingProductId();
    if (editId != null) {
      this.productService.updateProduct(editId, request).subscribe({
        next: (updatedProd) => {
          this.products.update(items =>
            items.map(p => p.id === editId ? updatedProd : p)
          );
          this.formSuccess.set(`Producto "${updatedProd.nombre}" actualizado exitosamente.`);
          this.isLoading.set(false);
          setTimeout(() => this.toggleForm(false), 1500);
        },
        error: (err) => {
          console.error('Error updating product:', err);
          const message = err.error?.message || err.error?.detail || 'Error al actualizar el producto. Verifica los datos.';
          this.formError.set(message);
          this.isLoading.set(false);
        }
      });
    } else {
      this.productService.createProduct(request).subscribe({
        next: (savedProd) => {
          this.products.update(items => [savedProd, ...items]);
          this.formSuccess.set(`Producto "${savedProd.nombre}" creado exitosamente.`);
          this.isLoading.set(false);
          setTimeout(() => this.toggleForm(false), 1500);
        },
        error: (err) => {
          console.error('Error saving product:', err);
          const message = err.error?.message || err.error?.detail || 'Error al guardar el producto. Verifica los datos.';
          this.formError.set(message);
          this.isLoading.set(false);
        }
      });
    }
  }

  getUniqueTalles(product: Product): string[] {
    if (!product.variantes) return [];
    const talles = product.variantes.map(v => v.talle);
    return [...new Set(talles)];
  }

  getUniqueColors(product: Product): ColorResponse[] {
    if (!product.variantes) return [];
    const colors = product.variantes.map(v => v.color).filter(Boolean);
    const uniqueMap = new Map<number, ColorResponse>();
    colors.forEach(c => uniqueMap.set(c.id, c));
    return Array.from(uniqueMap.values());
  }

  getTotalStock(product: Product): number {
    return this.productService.getTotalStock(product);
  }


  getImageUrl(product: Product): string {
    return this.productService.getImageUrl(product);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadProducts();
    }
  }

  previousPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadProducts();
    }
  }

  getColorName(colorId: number): string {
    const color = this.colores().find(c => c.id === colorId);
    return color ? color.nombre : 'Desconocido';
  }

}
