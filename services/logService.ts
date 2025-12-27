import { LogEntry, LogType } from '../types';

class LogService {
  private logs: LogEntry[] = [];
  private listeners: Set<() => void> = new Set();

  public addLog(message: string, type: LogType): void {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message,
      type,
    };
    this.logs.unshift(newLog); // Add to the top
    this.notifyListeners();
    // Optional: Keep the log size manageable
    if (this.logs.length > 200) {
      this.logs.pop();
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }
  
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    // Return an unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Export a singleton instance
export const logService = new LogService();