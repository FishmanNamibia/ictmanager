import { SetMetadata } from '@nestjs/common';
import { TenantModuleId } from '../tenant-settings';

export const MODULE_ACCESS_KEY = 'tenant_module_access';
export const ModuleAccess = (moduleId: TenantModuleId) => SetMetadata(MODULE_ACCESS_KEY, moduleId);
