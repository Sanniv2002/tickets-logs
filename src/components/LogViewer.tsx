import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { AlertCircle, Info, ChevronLeft, ChevronRight, Clock, RefreshCw, ChevronDown, ChevronUp, Moon, Sun } from 'lucide-react';
import type { LogResponse, GroupedLogs, Log } from '../types';

const POLLING_INTERVALS = [
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 }
];

const LogViewer: React.FC = () => {
  const [logData, setLogData] = useState<LogResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pollingInterval, setPollingInterval] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get('interval')) || 10;
  });
  const [groupedLogs, setGroupedLogs] = useState<GroupedLogs[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const updateUrlParams = useCallback((interval: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('interval', interval.toString());
    window.history.replaceState({}, '', url.toString());
  }, []);

  const handleIntervalChange = (newInterval: number) => {
    setPollingInterval(newInterval);
    updateUrlParams(newInterval);
  };

  const toggleGroup = (message: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(message)) {
        newSet.delete(message);
      } else {
        newSet.add(message);
      }
      return newSet;
    });
  };

  const groupLogs = (logs: Log[]): GroupedLogs[] => {
    const groups = logs.reduce((acc: { [key: string]: GroupedLogs }, log) => {
      if (!acc[log.message]) {
        acc[log.message] = {
          message: log.message,
          count: 0,
          logs: [],
          level: log.level
        };
      }
      acc[log.message].count++;
      acc[log.message].logs.push(log);
      return acc;
    }, {});

    return Object.values(groups);
  };

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get<LogResponse>(`https://api.sdeltatech.co/logs?page=${currentPage}`);
      setLogData(response.data);
      setGroupedLogs(groupLogs(response.data.logs));
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, pollingInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchLogs, pollingInterval]);

  const getLevelColor = (level: string) => {
    const baseColors = {
      ERROR: isDarkMode ? 'bg-red-950 text-red-100' : 'bg-red-100 text-red-800',
      INFO: isDarkMode ? 'bg-blue-950 text-blue-100' : 'bg-blue-100 text-blue-800',
      DEFAULT: isDarkMode ? 'bg-black text-gray-100' : 'bg-gray-100 text-gray-800'
    };
    return baseColors[level.toUpperCase() as keyof typeof baseColors] || baseColors.DEFAULT;
  };

  const getLevelIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return <AlertCircle className="w-4 h-4" />;
      case 'INFO':
        return <Info className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-black' : 'bg-gray-50'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <div className={`rounded-lg shadow ${isDarkMode ? 'bg-black' : 'bg-white'} transition-colors duration-300`}>
          <div className={`px-4 py-5 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} sm:px-6 transition-colors duration-300`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>Log Viewer</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`} />
                  <select
                    value={pollingInterval}
                    onChange={(e) => handleIntervalChange(Number(e.target.value))}
                    className={`px-2 py-1 text-sm border rounded transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-800 text-white hover:bg-gray-800' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {POLLING_INTERVALS.map(interval => (
                      <option key={interval.value} value={interval.value}>
                        {interval.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={fetchLogs}
                  className={`inline-flex items-center px-3 py-1 border rounded-md text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    isDarkMode
                      ? 'border-gray-800 text-gray-200 bg-gray-900 hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setIsDarkMode(prev => !prev)}
                  className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                    isDarkMode
                      ? 'bg-gray-900 text-yellow-400 hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6">
            {loading && (
              <div className="flex justify-center py-4">
                <RefreshCw className={`w-6 h-6 animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
            )}
            
            <div className="space-y-4">
              {groupedLogs.map((group) => (
                <div
                  key={group.message}
                  className={`border rounded-lg overflow-hidden transition-all duration-300 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
                >
                  <button
                    onClick={() => toggleGroup(group.message)}
                    className={`w-full px-4 py-3 ${getLevelColor(group.level)} flex items-center justify-between transition-all duration-300 hover:brightness-110`}
                  >
                    <div className="flex items-center space-x-2">
                      {getLevelIcon(group.level)}
                      <span className="font-medium">{group.message}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {group.count} occurrence{group.count !== 1 ? 's' : ''}
                      </span>
                      <div className={`transform transition-transform duration-300 ${expandedGroups.has(group.message) ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      expandedGroups.has(group.message) ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className={isDarkMode ? 'bg-black' : 'bg-white'}>
                      <div className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                        {group.logs.map((log) => (
                          <div 
                            key={log._id} 
                            className="px-4 py-3 text-sm transition-colors duration-300"
                          >
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {logData && (
            <div className={`px-4 py-3 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} sm:px-6 transition-colors duration-300`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-700'} transition-colors duration-300`}>
                  Page {logData.currentPage} of {logData.totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`inline-flex items-center px-3 py-1 border rounded-md text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      isDarkMode
                        ? 'border-gray-800 text-gray-200 bg-gray-900 hover:bg-gray-800 disabled:opacity-50'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(logData.totalPages, prev + 1))}
                    disabled={currentPage === logData.totalPages}
                    className={`inline-flex items-center px-3 py-1 border rounded-md text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      isDarkMode
                        ? 'border-gray-800 text-gray-200 bg-gray-900 hover:bg-gray-800 disabled:opacity-50'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;