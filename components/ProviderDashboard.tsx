import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { adminApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

export const ProviderDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({
    name: '',
    nationality: '🇹🇼',
    age: 20,
    height: 160,
    weight: 45,
    cup: 'C',
    location: '台北市',
    district: '',
    type: 'outcall',
    price: 3000,
    tags: [],
    basicServices: [],
    addonServices: [],
    isAvailable: true,
    isNew: true,
    gallery: [],
    albums: [],
    contactInfo: {
      line: '',
      phone: '',
      email: '',
      telegram: '',
    },
    prices: {
      oneShot: { price: 3000, desc: '一節/50min/1S' },
      twoShot: { price: 5500, desc: '兩節/100min/2S' }
    },
    availableTimes: {
      today: '12:00~02:00',
      tomorrow: '12:00~02:00'
    }
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'provider') {
      return;
    }
    loadMyProfile();
  }, [isAuthenticated, user]);

  const loadMyProfile = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        console.error('用戶未登入或沒有用戶ID');
        return;
      }

      // 使用 admin API 獲取所有 profiles，然後過濾出屬於當前用戶的
      const { adminApi } = await import('../services/apiService');
      const profiles = await adminApi.profiles.getAll();
      
      // 查找屬於當前用戶的 profile
      const myProfile = profiles.find(p => p.userId === user.id);
      
      if (myProfile) {
        setMyProfile(myProfile);
        setFormData(myProfile);
      } else {
        // 如果沒有找到，清空狀態（用戶還沒有上架）
        setMyProfile(null);
        setFormData({
          name: '',
          nationality: '🇹🇼',
          age: 20,
          height: 160,
          weight: 45,
          cup: 'C',
          location: '台北市',
          district: '',
          type: 'outcall',
          price: 3000,
          tags: [],
          basicServices: [],
          addonServices: [],
          isAvailable: true,
          isNew: true,
          gallery: [],
          albums: [],
          contactInfo: {
            line: '',
            phone: '',
            email: '',
            telegram: '',
          },
          prices: {
            oneShot: { price: 3000, desc: '一節/50min/1S' },
            twoShot: { price: 5500, desc: '兩節/100min/2S' }
          },
          availableTimes: {
            today: '12:00~02:00',
            tomorrow: '12:00~02:00'
          }
        });
      }
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.id) {
        alert('請先登入');
        return;
      }

      // 確保 userId 被設置
      const profileData = {
        ...formData,
        userId: user.id,
      };

      if (myProfile) {
        // 更新現有 profile
        await adminApi.profiles.update(myProfile.id, profileData);
      } else {
        // 創建新 profile
        const newProfile = await adminApi.profiles.create({
          ...profileData,
          id: `profile-${Date.now()}`, // 生成臨時 ID
        } as Profile);
        setMyProfile(newProfile);
      }
      setIsEditing(false);
      await loadMyProfile();
      alert('保存成功！');
    } catch (error: any) {
      console.error('保存失敗:', error);
      alert('保存失敗: ' + (error.message || '未知錯誤'));
    }
  };

  if (!isAuthenticated || user?.role !== 'provider') {
    return (
      <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">請先以後宮佳麗身份登入</h2>
          <p className="text-gray-600">只有後宮佳麗可以訪問此頁面</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-serif font-black text-brand-black">
              {myProfile ? '我的上架資料' : '上架我的資料'}
            </h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
                style={{ backgroundColor: '#1a5f3f' }}
              >
                編輯資料
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">姓名 *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">國家/國籍 *</label>
                  <select
                    value={formData.nationality || '🇹🇼'}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="🇹🇼">🇹🇼 台灣</option>
                    <option value="🇯🇵">🇯🇵 日本</option>
                    <option value="🇰🇷">🇰🇷 韓國</option>
                    <option value="🇭🇰">🇭🇰 香港</option>
                    <option value="🇨🇳">🇨🇳 中國</option>
                    <option value="🇹🇭">🇹🇭 泰國</option>
                    <option value="🇻🇳">🇻🇳 越南</option>
                    <option value="🇲🇾">🇲🇾 馬來西亞</option>
                    <option value="🇸🇬">🇸🇬 新加坡</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">年齡 *</label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">身高 (cm) *</label>
                  <input
                    type="number"
                    value={formData.height || ''}
                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">體重 (kg) *</label>
                  <input
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">罩杯 *</label>
                  <input
                    type="text"
                    value={formData.cup || ''}
                    onChange={(e) => setFormData({ ...formData, cup: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">類型 *</label>
                  <select
                    value={formData.type || 'outcall'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'outcall' | 'incall' })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="outcall">外送</option>
                    <option value="incall">定點</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">城市 *</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">行政區</label>
                  <input
                    type="text"
                    value={formData.district || ''}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">價格 (NT$) *</label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">標籤 (用逗號分隔)</label>
                <input
                  type="text"
                  value={(formData.tags || []).join(', ')}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">基本服務 (用逗號分隔)</label>
                <input
                  type="text"
                  value={(formData.basicServices || []).join(', ')}
                  onChange={(e) => setFormData({ ...formData, basicServices: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">加值服務 (用逗號分隔)</label>
                <input
                  type="text"
                  value={(formData.addonServices || []).join(', ')}
                  onChange={(e) => setFormData({ ...formData, addonServices: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {/* 聯絡方式 */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">聯絡方式</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">LINE ID</label>
                    <input
                      type="text"
                      value={formData.contactInfo?.line || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        contactInfo: { ...formData.contactInfo, line: e.target.value } 
                      })}
                      placeholder="請輸入 LINE ID（例如：@abc123 或 abc123）"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">電話號碼</label>
                    <input
                      type="tel"
                      value={formData.contactInfo?.phone || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        contactInfo: { ...formData.contactInfo, phone: e.target.value } 
                      })}
                      placeholder="請輸入電話號碼（例如：0912345678）"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Telegram</label>
                    <input
                      type="text"
                      value={formData.contactInfo?.telegram || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        contactInfo: { ...formData.contactInfo, telegram: e.target.value } 
                      })}
                      placeholder="請輸入 Telegram 用戶名（例如：@username）"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.contactInfo?.email || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        contactInfo: { ...formData.contactInfo, email: e.target.value } 
                      })}
                      placeholder="請輸入 Email（選填）"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
                  style={{ backgroundColor: '#1a5f3f' }}
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (myProfile) {
                      setFormData(myProfile);
                    }
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {myProfile ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">姓名</p>
                      <p className="text-lg font-medium">{myProfile.name} {myProfile.nationality}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">年齡</p>
                      <p className="text-lg font-medium">{myProfile.age}歲</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">身高/體重</p>
                      <p className="text-lg font-medium">{myProfile.height}cm / {myProfile.weight}kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">罩杯</p>
                      <p className="text-lg font-medium">{myProfile.cup}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">地區</p>
                      <p className="text-lg font-medium">{myProfile.location}{myProfile.district ? ' - ' + myProfile.district : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">類型</p>
                      <p className="text-lg font-medium">{myProfile.type === 'outcall' ? '外送' : '定點'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">價格</p>
                      <p className="text-lg font-medium">NT$ {myProfile.price?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">狀態</p>
                      <p className="text-lg font-medium">{myProfile.isAvailable ? '✅ 可用' : '❌ 不可用'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">標籤</p>
                    <div className="flex flex-wrap gap-2">
                      {myProfile.tags?.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{tag}</span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">您還沒有上架資料</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
                    style={{ backgroundColor: '#1a5f3f' }}
                  >
                    立即上架
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

