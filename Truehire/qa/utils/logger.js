export class Logger {
  static info(message, meta = {}) {
    console.log(JSON.stringify({ level: 'info', message, ...meta }));
  }

  static error(message, meta = {}) {
    console.error(JSON.stringify({ level: 'error', message, ...meta }));
  }
}
