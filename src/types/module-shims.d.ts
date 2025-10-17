declare module 'pino-http' {
  import { IncomingMessage, ServerResponse } from 'http';
  import { LoggerOptions, DestinationStream, Logger } from 'pino';
  interface PinoHttpOptions extends LoggerOptions {
    [key: string]: unknown;
    transport?: unknown;
    stream?: DestinationStream;
    autoLogging?: boolean | { ignore?: (req: IncomingMessage) => boolean };
    customProps?: (req: IncomingMessage, res: ServerResponse) => object;
    genReqId?: (req: IncomingMessage, res: ServerResponse) => string | number;
  }
  function pinoHttp(
    opts?: PinoHttpOptions
  ): (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
  namespace pinoHttp {
    function logger(stream?: DestinationStream): Logger;
  }
  export default pinoHttp;
}

declare module 'prom-client';

declare module '@aws-sdk/s3-request-presigner';
