import { ArgumentsLogger } from './argumentslogger.interface'

export interface ILogger {
  setContext(context: string): void
  log(args: ArgumentsLogger): Promise<void>
  error(args: ArgumentsLogger): Promise<void>
  warn(args: ArgumentsLogger): Promise<void>
  debug(args: ArgumentsLogger): Promise<void>
  verbose(args: ArgumentsLogger): Promise<void>
}

export interface IAuditLogger extends ILogger {
  audit(operation: 'CREATE' | 'UPDATE' | 'DELETE', entity: string, id: string, uid: string, data?: any): void
}