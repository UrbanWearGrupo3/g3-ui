import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService, ConfigItem, AuditLog } from '../../../core/services/config.service';

@Component({
  selector: 'app-keys',
  standalone: true,
  imports: [DatePipe, CommonModule, FormsModule],
  templateUrl: './keys.html',
  styleUrl: './keys.css'
})
export class Keys implements OnInit {
  private readonly configService = inject(ConfigService);

  configs = signal<ConfigItem[]>([]);
  auditLogs = signal<AuditLog[]>([]);

  // Modals and visual states
  isEditModalOpen = signal<boolean>(false);
  isAuditModalOpen = signal<boolean>(false);
  loading = signal<boolean>(false);

  // Selected config for editing
  selectedKey = signal<string>('');
  editValueField = signal<string>('');
  editDescField = signal<string>('');
  isDbOverride = signal<boolean>(false);

  // Key reveal states
  revealedKey = signal<string | null>(null);
  revealedValue = signal<string>('');

  // Action feedback
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadConfigs();
  }

  loadConfigs(): void {
    this.loading.set(true);
    this.configService.getConfigs().subscribe({
      next: (data) => {
        this.configs.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching configurations:', err);
        this.errorMessage.set('No se pudieron cargar las configuraciones del sistema.');
        this.loading.set(false);
      }
    });
  }

  loadAuditLogs(): void {
    this.loading.set(true);
    this.configService.getAuditLogs().subscribe({
      next: (data) => {
        // Sort logs to show latest first
        const sorted = [...data].sort((a, b) => b.id - a.id);
        this.auditLogs.set(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching audit logs:', err);
        this.errorMessage.set('No se pudo cargar el historial de auditoría.');
        this.loading.set(false);
      }
    });
  }

  openEditModal(config: ConfigItem): void {
    this.selectedKey.set(config.clave);
    this.editValueField.set(''); // Leave empty for security until they write a new one
    this.editDescField.set(config.descripcion || '');
    this.isDbOverride.set(config.sobreescritoBd);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedKey.set('');
    this.editValueField.set('');
    this.editDescField.set('');
  }

  saveConfig(): void {
    const key = this.selectedKey();
    const value = this.editValueField().trim();
    const desc = this.editDescField().trim();

    if (!value) {
      this.errorMessage.set('El valor de la clave no puede estar vacío.');
      return;
    }

    this.loading.set(true);
    this.configService.updateConfig(key, value, desc).subscribe({
      next: () => {
        this.successMessage.set('Configuración actualizada con éxito.');
        this.loadConfigs();
        setTimeout(() => {
          this.closeEditModal();
        }, 1500);
      },
      error: (err) => {
        console.error('Error updating config:', err);
        this.errorMessage.set(err.error?.error || 'Error al actualizar la configuración.');
        this.loading.set(false);
      }
    });
  }

  resetConfig(config: ConfigItem): void {
    if (!confirm(`¿Estás seguro de que deseas restablecer la clave "${config.clave}"? Esto eliminará la sobreescritura en base de datos y volverá al valor por defecto en .env.`)) {
      return;
    }

    this.loading.set(true);
    this.configService.deleteConfig(config.clave).subscribe({
      next: () => {
        alert(`La configuración "${config.clave}" fue restablecida con éxito.`);
        this.loadConfigs();
      },
      error: (err) => {
        console.error('Error resetting config:', err);
        alert(err.error?.error || 'Error al restablecer la configuración.');
        this.loading.set(false);
      }
    });
  }

  revealKey(key: string): void {
    this.loading.set(true);
    this.configService.getConfig(key, true).subscribe({
      next: (res) => {
        this.revealedKey.set(key);
        this.revealedValue.set(res.valor);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error revealing config:', err);
        alert('No tienes permisos suficientes o ocurrió un error al revelar la clave.');
        this.loading.set(false);
      }
    });
  }

  hideKey(): void {
    this.revealedKey.set(null);
    this.revealedValue.set('');
  }

  regenerateInternalToken(): void {
    if (!confirm('¿Estás seguro de que deseas regenerar el INTERNAL_TOKEN? Esto actualizará la firma utilizada para comunicarse con servicios internos y auditoría.')) {
      return;
    }

    this.loading.set(true);
    this.configService.regenerateInternalToken().subscribe({
      next: (res) => {
        this.revealedKey.set('INTERNAL_TOKEN');
        this.revealedValue.set(res.nuevoTokenInterno);
        alert('INTERNAL_TOKEN regenerado exitosamente. Se muestra el nuevo valor en pantalla una única vez.');
        this.loadConfigs();
      },
      error: (err) => {
        console.error('Error regenerating token:', err);
        alert('Error al regenerar el token interno.');
        this.loading.set(false);
      }
    });
  }

  openAuditModal(): void {
    this.loadAuditLogs();
    this.isAuditModalOpen.set(true);
  }

  closeAuditModal(): void {
    this.isAuditModalOpen.set(false);
    this.auditLogs.set([]);
  }

  // Helper to check if a value is sensitive (for showing buttons)
  isSensitiveKey(key: string): boolean {
    const sensitiveKeys = ['JWT_SECRET_KEY', 'INTERNAL_TOKEN', 'MERCADOPAGO_ACCESS_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY', 'MAIL_PASSWORD', 'ADMIN_PASSCODE'];
    return sensitiveKeys.includes(key);
  }

  // Filter keys by section categories
  configsBySection(section: 'seguridad' | 'integraciones' | 'correo' | 'otros'): ConfigItem[] {
    const list = this.configs();
    const seguridadKeys = ['JWT_SECRET_KEY', 'JWT_EXPIRATION_TIME', 'ADMIN_PASSCODE', 'INTERNAL_TOKEN'];
    const integracionesKeys = ['MERCADOPAGO_ACCESS_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const correoKeys = ['MAIL_USERNAME', 'MAIL_PASSWORD'];

    if (section === 'seguridad') {
      return list.filter(c => seguridadKeys.includes(c.clave));
    }
    if (section === 'integraciones') {
      return list.filter(c => integracionesKeys.includes(c.clave));
    }
    if (section === 'correo') {
      return list.filter(c => correoKeys.includes(c.clave));
    }
    return list.filter(c => 
      !seguridadKeys.includes(c.clave) && 
      !integracionesKeys.includes(c.clave) && 
      !correoKeys.includes(c.clave)
    );
  }
}
