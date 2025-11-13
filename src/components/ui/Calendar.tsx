import React, { useState } from 'react';
import { Button } from './Button';

interface CalendarProps {
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  disabledDates?: string[];
  minDate?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  disabledDates = [],
  minDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { year, month, daysInMonth, startDayOfWeek };
  };

  const { year, month, daysInMonth, startDayOfWeek } = getMonthData(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1));
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // 最小日付チェック
    if (minDate && dateStr < minDate) return;

    // 無効な日付チェック
    if (disabledDates.includes(dateStr)) return;

    onDateSelect(dateStr);
  };

  const isDateDisabled = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // 最小日付チェック
    if (minDate && dateStr < minDate) return true;

    // 無効な日付チェック
    return disabledDates.includes(dateStr);
  };

  const isDateSelected = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === selectedDate;
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = Math.ceil((daysInMonth + startDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const day = i - startDayOfWeek + 1;

      if (day < 1 || day > daysInMonth) {
        days.push(
          <div key={i} className="h-12 border border-gray-200" />
        );
      } else {
        const disabled = isDateDisabled(day);
        const selected = isDateSelected(day);

        days.push(
          <button
            key={i}
            onClick={() => handleDateClick(day)}
            disabled={disabled}
            className={`h-12 border border-gray-200 flex items-center justify-center text-sm transition-colors
              ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer'}
              ${selected ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''}
            `}
          >
            {day}
          </button>
        );
      }
    }

    return days;
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevMonth}
        >
          ＜
        </Button>
        <h3 className="text-lg font-bold">
          {year}年{month + 1}月
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
        >
          ＞
        </Button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`text-center text-sm font-semibold py-2
              ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7">
        {renderCalendarDays()}
      </div>

      {/* 凡例 */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600"></div>
          <span>選択中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-200"></div>
          <span>予約不可</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
