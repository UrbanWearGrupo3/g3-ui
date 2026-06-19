import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../models/user';

@Component({
  selector: 'app-users',
  imports: [DatePipe],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private readonly userService = inject(UserService);
  users = signal<User[]>([]);

  ngOnInit(): void {
    this.userService.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: (err) => console.error('Error fetching admin users from Java backend:', err)
    });
  }

  deleteUser(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.users.update(items => items.filter(u => u.id !== id));
        },
        error: (err) => console.error('Error deleting user:', err)
      });
    }
  }

  toggleActivo(id: string, currentActivo: boolean): void {
    this.userService.toggleActivo(id, !currentActivo).subscribe({
      next: (updated) => {
        this.users.update(items =>
          items.map(u => u.id === id ? updated : u)
        );
      },
      error: (err) => console.error('Error toggling user active state:', err)
    });
  }
}
