/**
 * Metrics Adapter Interface
 * Export metrics to observability platforms (Prometheus, Datadog, etc.)
 */

export interface MetricValue {
  name: string
  value: number
  type: 'counter' | 'gauge' | 'histogram'
  labels?: Record<string, string | number>
  timestamp?: Date
}

export interface IMetricsAdapter {
  /**
   * Record a single metric
   */
  record(metric: MetricValue): Promise<void>

  /**
   * Record multiple metrics in batch
   */
  recordBatch(metrics: MetricValue[]): Promise<void>

  /**
   * Increment a counter
   */
  increment(name: string, labels?: Record<string, string | number>): Promise<void>

  /**
   * Set a gauge value
   */
  gauge(name: string, value: number, labels?: Record<string, string | number>): Promise<void>

  /**
   * Record a histogram/timing value
   */
  histogram(
    name: string,
    value: number,
    labels?: Record<string, string | number>
  ): Promise<void>

  /**
   * Flush any buffered metrics
   */
  flush?(): Promise<void>
}

/**
 * No-op implementation
 */
export class NoOpMetricsAdapter implements IMetricsAdapter {
  async record(metric: MetricValue): Promise<void> {
    // Do nothing
  }

  async recordBatch(metrics: MetricValue[]): Promise<void> {
    // Do nothing
  }

  async increment(): Promise<void> {
    // Do nothing
  }

  async gauge(): Promise<void> {
    // Do nothing
  }

  async histogram(): Promise<void> {
    // Do nothing
  }
}

/**
 * Console logging implementation for development
 */
export class ConsoleMetricsAdapter implements IMetricsAdapter {
  async record(metric: MetricValue): Promise<void> {
    console.log('[Metric]', {
      name: metric.name,
      type: metric.type,
      value: metric.value,
      labels: metric.labels,
    })
  }

  async recordBatch(metrics: MetricValue[]): Promise<void> {
    console.log('[Metrics Batch]', metrics.length, 'metrics')
    metrics.forEach(m => this.record(m))
  }

  async increment(
    name: string,
    labels?: Record<string, string | number>
  ): Promise<void> {
    await this.record({ name, value: 1, type: 'counter', labels })
  }

  async gauge(
    name: string,
    value: number,
    labels?: Record<string, string | number>
  ): Promise<void> {
    await this.record({ name, value, type: 'gauge', labels })
  }

  async histogram(
    name: string,
    value: number,
    labels?: Record<string, string | number>
  ): Promise<void> {
    await this.record({ name, value, type: 'histogram', labels })
  }
}

/**
 * Buffered metrics adapter that batches metrics before sending
 */
export class BufferedMetricsAdapter implements IMetricsAdapter {
  private buffer: MetricValue[] = []
  private readonly maxBufferSize: number
  private readonly flushInterval: number
  private flushTimer?: NodeJS.Timeout

  constructor(
    private targetAdapter: IMetricsAdapter,
    options: {
      maxBufferSize?: number
      flushIntervalMs?: number
    } = {}
  ) {
    this.maxBufferSize = options.maxBufferSize || 100
    this.flushInterval = options.flushIntervalMs || 10000

    // Auto-flush periodically
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval)
  }

  async record(metric: MetricValue): Promise<void> {
    this.buffer.push(metric)

    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush()
    }
  }

  async recordBatch(metrics: MetricValue[]): Promise<void> {
    this.buffer.push(...metrics)

    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush()
    }
  }

  async increment(
    name: string,
    labels?: Record<string, string | number>
  ): Promise<void> {
    await this.record({ name, value: 1, type: 'counter', labels })
  }

  async gauge(
    name: string,
    value: number,
    labels?: Record<string, string | number>
  ): Promise<void> {
    await this.record({ name, value, type: 'gauge', labels })
  }

  async histogram(
    name: string,
    value: number,
    labels?: Record<string, string | number>
  ): Promise<void> {
    await this.record({ name, value, type: 'histogram', labels })
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const metricsToFlush = [...this.buffer]
    this.buffer = []

    await this.targetAdapter.recordBatch(metricsToFlush)
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush()
  }
}
