// src/utils/response.utils.ts

import { Response, Request } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  status_code: number;
  message: string;
  data?: T | null | [];
  error?: unknown;
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T | [] | null,
): ApiResponse<T> {
  // Remove async
  const response: ApiResponse<T> = {
    success: true,
    status_code: 1,
    message,
    data: data || null,
  };

  res.status(200).json(response);
  return response;
}

export function sendError<T>(
  res: Response,
  statusCode: number,
  message: string,
): ApiResponse<T> {
  // Remove async
  const response: ApiResponse<T> = {
    success: false,
    status_code: statusCode,
    message,
    data: null,
  };

  res.status(statusCode).json(response);
  return response;
}

export function sendInternalError<T>(
  res: Response,
  message: string,
): ApiResponse<T> {
  // Remove async
  const response: ApiResponse<T> = {
    success: false,
    status_code: 500,
    message,
    data: null,
  };

  res.status(500).json(response);
  return response;
}

export function authResponse<T>(
  res: Response,
  message: string,
): ApiResponse<T> {
  // Remove async
  const response: ApiResponse<T> = {
    success: false,
    status_code: 401,
    message,
    data: null,
  };
  res.status(401).json(response);
  return response;
}

export { Response, Request };
