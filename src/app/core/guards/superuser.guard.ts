import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class SuperUserGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(): boolean {
    const user = this.userService.currentUser();
    console.log('SuperUserGuard: currentUser', user);
    if (user && user.role === 'super_user') {
      return true;
    }
    // Not authorized to manage users, redirect to admin products page
    this.router.navigate(['/admin/products']);
    return false;
  }
}
