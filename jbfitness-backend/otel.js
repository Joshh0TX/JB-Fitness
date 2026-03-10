import "./src/config/env.js";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import resourcesPkg from "@opentelemetry/resources";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

const { resourceFromAttributes } = resourcesPkg;

const logLevelMap = {
	ALL: DiagLogLevel.ALL,
	VERBOSE: DiagLogLevel.VERBOSE,
	DEBUG: DiagLogLevel.DEBUG,
	INFO: DiagLogLevel.INFO,
	WARN: DiagLogLevel.WARN,
	ERROR: DiagLogLevel.ERROR,
	NONE: DiagLogLevel.NONE,
};

const diagLogLevelKey = (process.env.OTEL_DIAGNOSTIC_LOG_LEVEL || "WARN").toUpperCase();
diag.setLogger(new DiagConsoleLogger(), logLevelMap[diagLogLevelKey] ?? DiagLogLevel.WARN);

const serviceName = process.env.OTEL_SERVICE_NAME || "jbfitness-backend";
const serviceVersion = process.env.OTEL_SERVICE_VERSION || "1.0.0";
const deploymentEnvironment = process.env.NODE_ENV || "development";
const apiKey = process.env.OTEL_API_KEY;
const baseOtlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.replace(/\/$/, "");
const tracesUrl =
	process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
	(baseOtlpEndpoint ? `${baseOtlpEndpoint}/v1/traces` : undefined);
const metricsUrl =
	process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ||
	(baseOtlpEndpoint ? `${baseOtlpEndpoint}/v1/metrics` : undefined);
const exportIntervalMillis = Number(process.env.OTEL_METRIC_EXPORT_INTERVAL || 10000);
const telemetryEnabled = String(process.env.OTEL_ENABLED || "true").toLowerCase() !== "false";
const hasConfiguredEndpoint = Boolean(tracesUrl || metricsUrl);

const headers = apiKey ? { "x-otel-api-key": apiKey } : undefined;

const traceExporter = tracesUrl
	? new OTLPTraceExporter({ url: tracesUrl, headers })
	: undefined;

const metricReader = metricsUrl
	? new PeriodicExportingMetricReader({
			exporter: new OTLPMetricExporter({ url: metricsUrl, headers }),
			exportIntervalMillis,
		})
	: undefined;

if (baseOtlpEndpoint?.includes("vercel.app")) {
	console.warn(
		"[otel] OTEL_EXPORTER_OTLP_ENDPOINT appears to be a frontend URL. Use your OTLP collector base URL instead (e.g. http://localhost:4318)."
	);
}

if (!telemetryEnabled || !hasConfiguredEndpoint) {
	console.log("[otel] telemetry disabled", {
		reason: !telemetryEnabled ? "OTEL_ENABLED=false" : "no OTLP endpoint configured",
		environment: deploymentEnvironment,
	});
} else {
	console.log("[otel] telemetry config", {
		serviceName,
		environment: deploymentEnvironment,
		tracesEnabled: Boolean(traceExporter),
		metricsEnabled: Boolean(metricReader),
		tracesUrl,
		metricsUrl,
		exportIntervalMillis,
		diagnosticLogLevel: diagLogLevelKey,
	});

	const sdk = new NodeSDK({
		resource: resourceFromAttributes({
			"service.name": serviceName,
			"service.version": serviceVersion,
			"deployment.environment": deploymentEnvironment,
		}),
		traceExporter,
		metricReaders: metricReader ? [metricReader] : undefined,
		instrumentations: [
			getNodeAutoInstrumentations({
				"@opentelemetry/instrumentation-http": { enabled: true },
				"@opentelemetry/instrumentation-express": { enabled: true },
				"@opentelemetry/instrumentation-mysql2": { enabled: false },
				"@opentelemetry/instrumentation-pg": { enabled: true },
			}),
		],
	});

	try {
		const startResult = sdk.start();
		if (startResult && typeof startResult.then === "function") {
			startResult.catch((error) => {
				console.error("OpenTelemetry initialization failed:", error);
			});
		}
	} catch (error) {
		console.error("OpenTelemetry initialization failed:", error);
	}

	const shutdown = async () => {
		try {
			await sdk.shutdown();
		} catch (error) {
			console.error("OpenTelemetry shutdown failed:", error);
		}
	};

	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
}