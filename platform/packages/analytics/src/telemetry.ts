export class Logger {
  public static info(message: string, meta?: any) {
    console.log(`[INFO] ${message}`, meta || '');
  }
}
export const telemetry = {
  recordMetric: (name: string, value: number, tags?: any) => {
    console.log(`[Metric] ${name}=${value}`, tags || '');
  }
};
