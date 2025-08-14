import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { WinstonLoggerService } from '../services/winston-logger.service'

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly logger: WinstonLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url, user, body } = request

    // Extract entity from URL (assumes RESTful routes like /api/users/123)
    const urlParts = url.split('/')
    const entity = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1]

    return next.handle().pipe(
      tap(() => {
        try {
          // Only log for CREATE, UPDATE, DELETE operations
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            const operation = this.getOperation(method)
            const uid = user?.id || user?.uid || 'anonymous'
            const id = this.extractIdFromUrl(url) || 'unknown'

            this.logger.audit(operation, entity, id, uid, body)
          }
        } catch (error) {
          // Don't let audit logging break the request
          console.error('Audit logging error:', error)
        }
      }),
    )
  }

  private getOperation(method: string): 'CREATE' | 'UPDATE' | 'DELETE' {
    switch (method) {
      case 'POST':
        return 'CREATE'
      case 'PUT':
      case 'PATCH':
        return 'UPDATE'
      case 'DELETE':
        return 'DELETE'
      default:
        return 'UPDATE' // fallback
    }
  }

  private extractIdFromUrl(url: string): string | null {
    const parts = url.split('/')
    // Look for numeric or UUID-like strings
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i]
      if (part && (Number.isInteger(+part) || /^[a-f0-9-]{36}$/i.test(part))) {
        return part
      }
    }
    return null
  }
}