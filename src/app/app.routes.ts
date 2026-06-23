import { Routes } from '@angular/router';
import { PublicLayout } from './shared/layouts/public-layout/public-layout';
import { AdminLayout } from './shared/layouts/admin-layout/admin-layout';
import { CheckoutSuccess } from './pages/checkout-success/checkout-success';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { Home } from './pages/home/home';
import { Products as UserProducts } from './pages/products/products';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { Products as AdminProducts } from './pages/admin/products/products';
import { Users } from './pages/admin/users/users';
import { AdminGuard } from './core/guards/admin.guard';
import { SuperUserGuard } from './core/guards/superuser.guard';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: Home },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'products', component: UserProducts },
      { path: 'products/:id', component: ProductDetail },
      { path: 'checkout', component: Checkout },
      { path: 'checkout-success', component: CheckoutSuccess },
      { path: 'cart', component: Cart },
    ]
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard, canActivate: [SuperUserGuard] },
      { path: 'products', component: AdminProducts },
      { path: 'users', component: Users, canActivate: [SuperUserGuard] }
    ]
  },
  { path: '**', redirectTo: '' }
];

