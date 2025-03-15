export interface Log {
  _id: string;
  timestamp: string;
  level: 'INFO' | 'ERROR' | string;
  message: string;
}

export interface LogResponse {
  totalLogs: number;
  totalPages: number;
  currentPage: number;
  logs: Log[];
}

export interface GroupedLogs {
  message: string;
  count: number;
  logs: Log[];
  level: string;
}