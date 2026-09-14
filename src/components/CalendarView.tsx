import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  Eye
} from 'lucide-react';
import { PublishTask, PlatformId } from '../types';
import { PLATFORMS_META } from '../data/defaultData';

interface CalendarViewProps {
  tasks: PublishTask[];
  onSelectTask: (task: PublishTask) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onSelectTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const startingDayIndex = (firstDayOfMonth + 6) % 7; // Align to Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const totalCells = Math.ceil((startingDayIndex + daysInMonth) / 7) * 7;
  const days = Array.from({ length: totalCells }, (_, i) => {
    const dayNumber = i - startingDayIndex + 1;
    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
    const dateObj = new Date(year, month, dayNumber);
    return {
      dayNumber,
      isCurrentMonth,
      dateString: isCurrentMonth ? dateObj.toISOString().split('T')[0] : null
    };
  });

  const todayString = new Date().toISOString().split('T')[0];

  // Group tasks by scheduledAt or createdAt date (YYYY-MM-DD)
  const tasksByDate = (tasks || []).reduce((acc: Record<string, PublishTask[]>, t: PublishTask) => {
    const timeStr = t.scheduledAt || t.completedAt || t.createdAt;
    const dateKey = timeStr ? timeStr.split('T')[0] : todayString;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {} as Record<string, PublishTask[]>);

  const weekHeaders = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return (
    <div className="space-y-4">
      {/* Calendar Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-900 text-white rounded-xl">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              {year} 年 {month + 1} 月 矩阵发布排期大盘
            </h3>
            <p className="text-xs text-neutral-500">直观掌控各平台已发内容与未来预约执行节奏</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            返回今天
          </button>
          <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-neutral-100 text-neutral-600 transition-colors"
              title="上个月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono font-bold text-neutral-800">
              {year}.{String(month + 1).padStart(2, '0')}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-neutral-100 text-neutral-600 transition-colors"
              title="下个月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 text-center py-2.5">
          {weekHeaders.map((header, idx) => (
            <div key={idx} className="text-xs font-bold text-neutral-600">
              {header}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-neutral-200 min-h-[500px]">
          {days.map((d, index) => {
            if (!d.isCurrentMonth || !d.dateString) {
              return (
                <div key={index} className="bg-neutral-50/50 p-2 min-h-[95px] text-neutral-300 text-xs font-mono select-none">
                  {d.dayNumber > 0 ? d.dayNumber : ''}
                </div>
              );
            }

            const dayTasks = tasksByDate[d.dateString] || [];
            const isToday = d.dateString === todayString;

            return (
              <div
                key={index}
                className={`p-2 min-h-[105px] flex flex-col justify-between transition-colors ${
                  isToday ? 'bg-blue-50/30' : 'hover:bg-neutral-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      isToday
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700'
                    }`}
                  >
                    {d.dayNumber}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-mono font-semibold text-neutral-400">
                      {dayTasks.length} 个任务
                    </span>
                  )}
                </div>

                {/* Day tasks stack */}
                <div className="space-y-1 overflow-y-auto max-h-[85px] pr-0.5 flex-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const meta = PLATFORMS_META[task.platform];
                    const isSuccess = task.status === 'success';
                    const isQueued = task.status === 'queued';
                    const isFailed = task.status === 'failed';

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className={`px-1.5 py-1 rounded-md text-[10px] font-medium border flex items-center justify-between gap-1 cursor-pointer transition-transform hover:scale-[1.02] ${
                          isSuccess
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : isQueued
                            ? 'bg-blue-50 border-blue-200 text-blue-800'
                            : isFailed
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                        }`}
                        title={`${meta.name} - ${task.accountNickname} (${task.status})`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isSuccess ? 'bg-emerald-500' : isQueued ? 'bg-blue-500' : isFailed ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          <span className="font-bold shrink-0">{meta.name.substring(0, 2)}</span>
                          <span className="truncate">{task.accountNickname}</span>
                        </div>
                        {task.scheduledAt && <Clock className="w-2.5 h-2.5 shrink-0 opacity-60" />}
                      </div>
                    );
                  })}

                  {dayTasks.length > 3 && (
                    <div className="text-[9px] text-neutral-500 font-mono text-center pt-0.5">
                      + 还有 {dayTasks.length - 3} 个...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="p-3 bg-white rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>已成功发布</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>排期定时中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>执行中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>执行异常</span>
          </div>
        </div>
        <div className="text-neutral-400 font-mono text-[11px]">
          点击任意日历卡片可直接查看对应自动化执行报告与截图日志
        </div>
      </div>
    </div>
  );
};
