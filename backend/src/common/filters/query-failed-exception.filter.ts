import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

type DriverError = {
  code?: string;
  constraint?: string;
  detail?: string;
  hint?: string;
  message?: string;
};

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(QueryFailedExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const driverError = (exception as QueryFailedError & { driverError?: DriverError }).driverError ?? {};

    const code = driverError.code;
    const details = `${driverError.constraint ?? ''} ${driverError.detail ?? ''} ${driverError.hint ?? ''}`.toLowerCase();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database request failed.';

    if (code === '23503') {
      if (details.includes('tenant') || details.includes('tenant_id')) {
        statusCode = HttpStatus.UNAUTHORIZED;
        message = 'Session expired. Please sign in again.';
      } else {
        statusCode = HttpStatus.CONFLICT;
        message = 'Cannot save record because a referenced item was not found or is not accessible.';
      }
    } else if (code === '23505') {
      statusCode = HttpStatus.CONFLICT;
      message = 'A record with the same value already exists.';
    } else if (code === '23502') {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Missing required value.';
    } else if (code === '22P02') {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Invalid input value.';
    }

    this.logger.warn(
      `[${request.method}] ${request.url} failed with db code "${code ?? 'unknown'}": ${driverError.message ?? exception.message}`,
    );

    response.status(statusCode).json({
      statusCode,
      message,
      error: HttpStatus[statusCode] ?? 'Error',
    });
  }
}
