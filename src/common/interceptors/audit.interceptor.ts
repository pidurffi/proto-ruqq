import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { Reflector } from '@nestjs/core'

import { WinstonLoggerService } from '../services/winston-logger.service'

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: WinstonLoggerService,
    private readonly reflector: Reflector,
  ) {
    this.logger.setContext('AuditInterceptor')
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const method = request.method
    const url = request.url
    const user = request.user

    // Extract entity name from URL (e.g., /api/cip -> cip, /api/pozo -> pozo)
    const entityMatch = url.match(/\/api\/([^\/\?]+)/)
    const entity = entityMatch ? entityMatch[1] : 'unknown'

    return next.handle().pipe(
      tap(result => {
        // Skip if no result or no user
        if (!result || !user?.id) return

        try {
          // Determine operation type and audit accordingly
          if (method === 'POST' && result?.id) {
            // CREATE operation
            this.auditOperation('CREATE', entity, result.id, user.id, result)
          } else if ((method === 'PUT' || method === 'PATCH') && result?.id) {
            // UPDATE operation
            this.auditOperation('UPDATE', entity, result.id, user.id, result)
          } else if (method === 'DELETE' && result?.id) {
            // DELETE operation
            this.auditOperation('DELETE', entity, result.id, user.id, result)
          }
        } catch (error) {
          // Log error but don't break the request flow
          this.logger.error({
            message: `Error in audit interceptor: ${error instanceof Error ? error.message : String(error)}`,
            context: 'AuditInterceptor',
            stack: error instanceof Error ? error.stack : undefined,
          }).catch(logError => {
            // Fallback to console if logger fails
            console.error('Logger error:', logError)
          })
        }
      }),
    )
  }

  private auditOperation(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: string,
    id: string,
    uid: string,
    data: any,
  ) {
    // Audit log
    this.logger.audit(operation, entity, id, uid, data)

    // Regular success log
    const operationText = operation === 'CREATE' ? 'creado' : operation === 'UPDATE' ? 'actualizado' : 'eliminado'

    this.logger.log({
      message: `${entity.toUpperCase()} ${operationText} exitosamente con ID: ${id}`,
      context: entity,
    }).catch(error => {
      // Don't let logging errors break the request flow
      console.error('Logging error:', error)
    })
  }
}
