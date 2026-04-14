import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { profilesApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

interface CalendarManagerProps {
  profile: Profile;
  onUpdate?: () => void;
}

interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

export const CalendarManager: React.FC<CalendarManagerProps> = ({ profile, onUpdate }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [availableTimes, setAvailableTimes] = useState(profile.availableTimes || {
    today: '12:00~02:00',
    tomorrow: '12:00~02:00'
  });

  // 获取未来30天的日期
  const getAvailableDates = () => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  // 时间选项（每小时）
  const timeOptions = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'
  ];

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlotsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadTimeSlotsForDate = (date: string) => {
    // 为选中的日期创建时间槽
    const slots: TimeSlot[] = timeOptions.map(time => ({
      date,
      time,
      available: true // 默认可用，后续可以从后端获取
    }));
    setTimeSlots(slots);
  };

  const toggleTimeSlot = (index: number) => {
    const newSlots = [...timeSlots];
    newSlots[index].available = !newSlots[index].available;
    setTimeSlots(newSlots);
  };

  const saveTimeSlots = async () => {
    if (!selectedDate) {
      alert('請選擇日期');
      return;
    }

    setIsSaving(true);
    try {
      // 更新 availableTimes（简化版本，只保存今天和明天的时间范围）
      // 实际应用中，可以保存更详细的每个日期的时间槽
      const updatedProfile = {
        ...profile,
        availableTimes
      };

      await profilesApi.update(profile.id, updatedProfile);
      
      if (onUpdate) {
        onUpdate();
      }
      alert('行事曆已更新');
    } catch (error: any) {
      alert('更新失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  if (user?.role !== 'provider') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">行事曆管理</h3>
        <p className="text-sm text-gray-600 mb-4">
          設定您的可用時間，讓茶客知道什麼時候可以預約
        </p>
      </div>

      {/* 快速設定：今天和明天 */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">快速設定</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-2">今天可用時間</label>
            <input
              type="text"
              value={availableTimes.today}
              onChange={(e) => setAvailableTimes({ ...availableTimes, today: e.target.value })}
              placeholder="例如：12:00~02:00"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-2">明天可用時間</label>
            <input
              type="text"
              value={availableTimes.tomorrow}
              onChange={(e) => setAvailableTimes({ ...availableTimes, tomorrow: e.target.value })}
              placeholder="例如：12:00~02:00"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 詳細設定：選擇日期 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">詳細設定</h4>
        <div className="mb-4">
          <label className="block text-xs text-gray-600 mb-2">選擇日期</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
          >
            <option value="">請選擇日期</option>
            {getAvailableDates().map(date => (
              <option key={date} value={date}>
                {formatDate(date)}
              </option>
            ))}
          </select>
        </div>

        {selectedDate && (
          <div>
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {formatDate(selectedDate)} 可用時間
              </p>
              <p className="text-xs text-gray-500 mb-3">
                點擊時間槽切換可用/不可用狀態
              </p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2">
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleTimeSlot(index)}
                  className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                    slot.available
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 保存按钮 */}
      <div className="flex gap-3">
        <button
          onClick={saveTimeSlots}
          disabled={isSaving}
          className="flex-1 px-6 py-3 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#1a5f3f' }}
        >
          {isSaving ? '保存中...' : '保存行事曆'}
        </button>
      </div>
    </div>
  );
};

