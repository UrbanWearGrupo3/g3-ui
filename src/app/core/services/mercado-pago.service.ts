import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class MercadoPagoService {
  private readonly http = inject(HttpClient);

  /** Llama al backend para crear la preferencia y devuelve las URLs de pago */
  crearPreference(pedidoId: number) {
    return this.http.post<{ preferenceId: string; initPoint: string; sandboxInitPoint?: string }>(
      `/api/pedidos/${pedidoId}/pagar`,
      {}
    );
  }

  /**
   * Redirige al usuario al portal de pago de Mercado Pago.
   * En sandbox usa sandboxInitPoint; en producción usa initPoint.
   */
  redirigirAMercadoPago(initPoint: string, sandboxInitPoint?: string): void {
    const url = sandboxInitPoint || initPoint;
    if (!url) {
      console.error('MercadoPago: no se recibió URL de pago válida');
      return;
    }
    window.location.href = url;
  }
}
