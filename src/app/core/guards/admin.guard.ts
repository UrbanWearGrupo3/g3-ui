import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(): boolean {
    const user = this.userService.currentUser();
    if (user && user.role === 'admin') {
      return true;
    }
    // Not authorized, redirect to login or home
    this.router.navigate(['/login']);
    return false;
  }
}
