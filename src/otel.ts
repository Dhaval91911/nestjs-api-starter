import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

if (process.env.OTEL_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

function parseHeaders(headersEnv?: string): Record<string, string> | undefined {
  if (!headersEnv) return undefined;
  return headersEnv
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const [rawKey, ...rest] = pair.split('=');
      const key = rawKey?.trim();
      if (!key) return acc;
      acc[key] = rest.join('=').trim();
      return acc;
    }, {});
}

const exporter = new OTLPTraceExporter({
  headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
});

export const otelSdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

export function startOtel(): void {
  void otelSdk.start();
}

export function shutdownOtel(): void {
  void otelSdk.shutdown();
}
