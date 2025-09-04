export interface ITenantContext {
  tenantId: string;
  schema: string;
}

export interface ITenantService {
  getCurrentTenant(): ITenantContext | null;
  setCurrentTenant(context: ITenantContext): void;
  clearCurrentTenant(): void;
  getDefaultTenant(): ITenantContext;
}