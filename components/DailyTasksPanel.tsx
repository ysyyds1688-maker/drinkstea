import React, { useState, useEffect, useRef } from 'react';
import { DailyTask } from '../types';
import { tasksApi } from '../services/apiService';

interface DailyTasksPanelProps {
  filterType?: 'daily' | 'other'; // 過濾任務類型：daily=每日任務，other=其他任務
  userRole?: 'provider' | 'client' | 'admin'; // 用戶角色
}

export const DailyTasksPanel: React.FC<DailyTasksPanelProps> = ({ filterType = 'daily', userRole = 'client' }) => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    loadTasks();
  }, [filterType, userRole]);

  const loadTasks = async () => {
    if (loadingRef.current) return;
    
    // 先從緩存讀取數據
    const cacheKey = `tasks_${userRole}_${filterType}`;
    let hasValidCache = false;
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheTime = cached.timestamp || 0;
        const now = Date.now();
        // 緩存有效期 2 分鐘（任務數據更新較頻繁）
        if (now - cacheTime < 2 * 60 * 1000 && cached.tasks && cached.tasks.length > 0) {
          setTasks(cached.tasks);
          hasValidCache = true;
        }
      }
    } catch (e) {
      // 忽略緩存錯誤
    }
    
    try {
      loadingRef.current = true;
      if (!hasValidCache) {
        setLoading(true);
      }
      const data = await tasksApi.getDaily();
      
      // 根據 filterType 和 userRole 過濾任務
      let filteredTasks: DailyTask[] = [];
      
      if (userRole === 'provider') {
        // 後宮佳麗的任務分類（與茶客一樣的每日任務）
        if (filterType === 'daily') {
          // 每日任務：登入、發帖、回覆、點讚、瀏覽（與茶客一樣）
          const dailyTaskTypes = ['daily_login', 'create_post', 'reply_post', 'like_content', 'browse_profiles', 'browse_provider_profiles'];
          filteredTasks = data.tasks.filter(task => dailyTaskTypes.includes(task.taskType));
        } else if (filterType === 'other') {
          // 其他任務：所有預約相關的任務（不包括茶客的預約任務）
          const otherTaskTypes = [
            'lady_complete_booking',
            'lady_receive_good_review',
            'lady_respond_booking',
            'lady_update_profile',
            'lady_forum_interaction',
            'lady_maintain_quality',
            'lady_boost_exposure'
          ];
          filteredTasks = data.tasks.filter(task => otherTaskTypes.includes(task.taskType));
        }
      } else {
        // 品茶客的任務分類
        if (filterType === 'daily') {
          // 每日任務：登入、發帖、回覆、點讚、瀏覽
          const dailyTaskTypes = ['daily_login', 'create_post', 'reply_post', 'like_content', 'browse_profiles', 'browse_provider_profiles'];
          filteredTasks = data.tasks.filter(task => dailyTaskTypes.includes(task.taskType));
        } else if (filterType === 'other') {
          // 其他任務：預約高級茶、預約後宮佳麗、特選魚市分享
          const otherTaskTypes = ['book_premium_tea', 'book_lady_booking', 'post_in_lady_forum'];
          filteredTasks = data.tasks.filter(task => otherTaskTypes.includes(task.taskType));
        }
      }
      
      // 如果沒有明確分類，顯示所有任務
      if (filterType !== 'daily' && filterType !== 'other') {
        filteredTasks = data.tasks;
      }
      
      // 調試：如果其他任務為空，輸出所有任務以便排查
      if (filterType === 'other' && filteredTasks.length === 0) {
        console.log('其他任務為空，所有任務:', data.tasks);
        console.log('所有任務類型:', data.tasks.map(t => t.taskType));
        console.log('用戶角色:', userRole);
        if (userRole === 'provider') {
          console.log('期望的任務類型: lady_complete_booking, lady_receive_good_review, lady_respond_booking, lady_update_profile, lady_forum_interaction, lady_maintain_quality, lady_boost_exposure');
        } else {
          console.log('期望的任務類型: book_premium_tea, book_lady_booking');
        }
      }
      
      setTasks(filteredTasks);
      
      // 更新緩存
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          tasks: filteredTasks,
          timestamp: Date.now()
        }));
      } catch (e) {
        // 忽略緩存錯誤
      }
    } catch (error) {
      console.error('載入任務失敗:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{filterType === 'daily' ? '暫無每日任務' : '暫無其他任務'}</p>
        {filterType === 'other' && (
          <p className="text-xs text-gray-400 mt-2">
            提示：預約任務包括「預約高級茶」和「預約後宮佳麗」
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const progressPercent = (task.progress / task.target) * 100;
        const pointsReward = task.pointsReward || 0;
        const experienceReward = task.experienceReward || 0;

        return (
          <div key={task.id} className="bg-white rounded-lg shadow p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">{task.name || task.taskType}</h4>
                <p className="text-sm text-gray-600">{task.description}</p>
              </div>
              {task.isCompleted && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium whitespace-nowrap">
                  已完成
                </span>
              )}
            </div>

            {/* 進度顯示 */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  進度：{task.progress} / {task.target}
                </span>
                <span className="text-gray-500 text-xs">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    task.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* 獎勵顯示：同時顯示積分和經驗值 */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
              {/* 積分獎勵 */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">積分獎勵</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          task.isCompleted ? 'bg-blue-600' : 'bg-blue-400'
                        }`}
                        style={{ width: task.isCompleted ? '100%' : '0%' }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-blue-600 whitespace-nowrap">
                      +{pointsReward}
                    </span>
                  </div>
                </div>
              </div>

              {/* 經驗值獎勵 */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">經驗值獎勵</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          task.isCompleted ? 'bg-purple-600' : 'bg-purple-400'
                        }`}
                        style={{ width: task.isCompleted ? '100%' : '0%' }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-purple-600 whitespace-nowrap">
                      +{experienceReward}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DailyTasksPanel;



