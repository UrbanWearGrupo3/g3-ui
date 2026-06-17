import { Routes } from '@angular/router';
import { PublicLayout } from './shared/layouts/public-layout/public-layout';
import { AdminLayout } from './shared/layouts/admin-layout/admin-layout';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Products as UserProducts } from './pages/products/products';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { Products as AdminProducts } from './pages/admin/products/products';
import { Users } from './pages/admin/users/users';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: Home },
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: 'products', component: UserProducts },
      { path: 'cart', component: Cart },
      { path: 'checkout', component: Checkout }
    ]
  },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'products', component: AdminProducts },
      { path: 'users', component: Users }
    ]
  },

  { path: '**', redirectTo: '' }
];
