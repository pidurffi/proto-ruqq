export interface ITenantContext {
  tenantId: string;
  schema: string;
}

export interface ITenantService {
  /**
   * Tenant de la request en curso, o null si se invoca fuera de una request
   * (seeders, scripts, tareas programadas).
   */
  getCurrentTenant(): ITenantContext | null;

  /**
   * Ejecuta `callback` con `context` como tenant activo.
   *
   * El contexto queda aislado en la cadena asincrónica del callback: las
   * requests concurrentes no se pisan entre sí. No hay que limpiarlo — el
   * scope se libera solo cuando la cadena termina.
   */
  runWithTenant<T>(context: ITenantContext, callback: () => T): T;

  getDefaultTenant(): ITenantContext;

  /**
   * Tenant de la request en curso o, en su defecto, el tenant por defecto.
   * Es el método que deben usar los repositorios tenant-aware.
   */
  getActiveTenant(): ITenantContext;
}
