import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  const tenantId = request.user?.tenantId;
  if (!tenantId) throw new Error('TenantId not found on request (ensure JwtAuthGuard runs first)');
  return tenantId;
});
