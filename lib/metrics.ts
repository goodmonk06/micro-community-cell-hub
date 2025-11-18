import { logger } from './logger'

interface MetricLabels {
  [key: string]: string | number
}

interface Metric {
  name: string
  type: 'counter' | 'gauge' | 'histogram'
  value: number
  labels: MetricLabels
  timestamp: Date
}

class MetricsCollector {
  private metrics: Metric[] = []
  private readonly maxMetrics = 10000

  counter(name: string, labels: MetricLabels = {}, increment: number = 1) {
    this.record({
      name,
      type: 'counter',
      value: increment,
      labels,
      timestamp: new Date(),
    })
  }

  gauge(name: string, value: number, labels: MetricLabels = {}) {
    this.record({
      name,
      type: 'gauge',
      value,
      labels,
      timestamp: new Date(),
    })
  }

  histogram(name: string, value: number, labels: MetricLabels = {}) {
    this.record({
      name,
      type: 'histogram',
      value,
      labels,
      timestamp: new Date(),
    })
  }

  private record(metric: Metric) {
    this.metrics.push(metric)

    // Keep metrics array bounded
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // In development, log metrics
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Metric recorded', {
        metric: metric.name,
        type: metric.type,
        value: metric.value,
        labels: metric.labels,
      })
    }
  }

  // Get metrics for export (e.g., to Prometheus, Datadog, etc.)
  getMetrics(): Metric[] {
    return [...this.metrics]
  }

  // Clear all metrics
  clear() {
    this.metrics = []
  }

  // Get metrics summary
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {}

    this.metrics.forEach(metric => {
      const key = `${metric.name}_${metric.type}`
      if (!summary[key]) {
        summary[key] = {
          type: metric.type,
          count: 0,
          total: 0,
          min: Infinity,
          max: -Infinity,
        }
      }

      summary[key].count++
      summary[key].total += metric.value
      summary[key].min = Math.min(summary[key].min, metric.value)
      summary[key].max = Math.max(summary[key].max, metric.value)
      summary[key].avg = summary[key].total / summary[key].count
    })

    return summary
  }
}

// Singleton instance
export const metrics = new MetricsCollector()

// Helper function to time async operations
export async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>,
  labels: MetricLabels = {}
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    metrics.histogram(`${name}_duration_ms`, duration, labels)
    metrics.counter(`${name}_success`, labels)
    return result
  } catch (error) {
    const duration = Date.now() - start
    metrics.histogram(`${name}_duration_ms`, duration, { ...labels, status: 'error' })
    metrics.counter(`${name}_error`, labels)
    throw error
  }
}
