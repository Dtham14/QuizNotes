'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

const AVATAR_OPTIONS = [
  { id: 'treble-clef', icon: '𝄞', label: 'Treble Clef', color: 'from-violet-500 to-purple-600' },
  { id: 'bass-clef', icon: '𝄢', label: 'Bass Clef', color: 'from-blue-500 to-cyan-600' },
  { id: 'quarter-note', icon: '♩', label: 'Quarter Note', color: 'from-amber-500 to-orange-600' },
  { id: 'eighth-notes', icon: '♫', label: 'Eighth Notes', color: 'from-rose-500 to-pink-600' },
  { id: 'piano', icon: '🎹', label: 'Piano', color: 'from-slate-600 to-slate-800' },
  { id: 'guitar', icon: '🎸', label: 'Guitar', color: 'from-amber-600 to-yellow-500' },
  { id: 'violin', icon: '🎻', label: 'Violin', color: 'from-orange-700 to-amber-600' },
  { id: 'trumpet', icon: '🎺', label: 'Trumpet', color: 'from-yellow-500 to-amber-500' },
  { id: 'microphone', icon: '🎤', label: 'Vocalist', color: 'from-pink-500 to-rose-600' },
  { id: 'headphones', icon: '🎧', label: 'Listener', color: 'from-indigo-500 to-blue-600' },
  { id: 'composer', icon: '🎼', label: 'Composer', color: 'from-emerald-500 to-teal-600' },
  { id: 'conductor', icon: '🪄', label: 'Conductor', color: 'from-purple-600 to-violet-700' },
];

const DEFAULT_THEME_COLOR = '#8b5cf6';

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface ProfileCardProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    avatar?: string | null;
    avatarUrl?: string | null;
    themeColor?: string | null;
  };
  stats?: {
    level?: number;
    xp?: number;
    streak?: number;
    classCount?: number;
    completedAssignments?: number;
    totalAssignments?: number;
  } | null;
  quizStats?: {
    totalQuizzes: number;
    averageScore: number;
  } | null;
  achievementCount?: number;
  onUpdate?: () => void;
}

export default function ProfileCard({ user, stats, quizStats, achievementCount, onUpdate }: ProfileCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user.name || '');
  const [savingName, setSavingName] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || 'conductor');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCustomAvatar = !!avatarPreview;
  const avatarData = AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[11];
  const themeColor = user.themeColor || DEFAULT_THEME_COLOR;

  const gradientStyle = hasCustomAvatar
    ? { background: `linear-gradient(135deg, ${themeColor}, ${adjustColor(themeColor, -30)})` }
    : undefined;
  const gradientClass = hasCustomAvatar ? '' : `bg-gradient-to-br ${avatarData.color}`;

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      const response = await fetch('/api/profile/name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName }),
      });

      if (response.ok) {
        setIsEditingName(false);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error saving name:', error);
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveAvatar = async () => {
    setSavingAvatar(true);
    setAvatarError(null);
    try {
      // If there's a custom avatar file to upload
      if (avatarFile) {
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const uploadRes = await fetch('/api/profile/avatar-upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          setAvatarError(data.error || 'Failed to upload avatar');
          setUploadingAvatar(false);
          setSavingAvatar(false);
          return;
        }

        const uploadData = await uploadRes.json();
        setAvatarFile(null);
        setAvatarPreview(uploadData.avatarUrl);
        setShowAvatarPicker(false);
        onUpdate?.();
      } else {
        // Save predefined avatar
        const res = await fetch('/api/profile/avatar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: selectedAvatar }),
        });

        if (res.ok) {
          // Clear custom avatar if using predefined
          if (user.avatarUrl) {
            await fetch('/api/profile/avatar-upload', { method: 'DELETE' });
          }

          setAvatarPreview(null);
          setShowAvatarPicker(false);
          onUpdate?.();
        }
      }
    } catch (error) {
      console.error('Failed to save avatar:', error);
      setAvatarError('Failed to save avatar. Please try again.');
    } finally {
      setSavingAvatar(false);
      setUploadingAvatar(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Invalid file type. Please use JPEG, PNG, GIF, or WebP.');
      return;
    }

    // Validate file size (2MB to match backend)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('File size must be less than 2MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomAvatar = async () => {
    try {
      await fetch('/api/profile/avatar-upload', { method: 'DELETE' });
      setAvatarPreview(null);
      setAvatarFile(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error removing avatar:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Profile</h2>

      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowAvatarPicker(true)}
            className={`w-24 h-24 rounded-xl ${gradientClass} flex items-center justify-center text-4xl text-white shadow-md hover:shadow-lg transition-all hover:scale-105 overflow-hidden`}
            style={gradientStyle}
          >
            {hasCustomAvatar ? (
              <Image
                src={avatarPreview!}
                alt="Avatar"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              avatarData.icon
            )}
          </button>
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center hover:bg-violet-700 transition-colors shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={savingName}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 text-sm font-medium"
              >
                {savingName ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditingName(false);
                  setEditedName(user.name || '');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{user.name || 'User'}</h3>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-violet-600 hover:text-violet-700"
                title="Edit name"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
          <p className="text-gray-600 text-sm">{user.email}</p>
        </div>
      </div>

      {/* Stats Grid - Show if any stats are provided */}
      {(stats || quizStats || achievementCount !== undefined) && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats?.level !== undefined && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Level</p>
                  <p className="text-lg font-bold text-gray-900">{stats.level}</p>
                </div>
              </div>
            )}

            {stats?.xp !== undefined && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <span className="text-lg">🎯</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total XP</p>
                  <p className="text-lg font-bold text-gray-900">{stats.xp.toLocaleString()}</p>
                </div>
              </div>
            )}

            {stats?.streak !== undefined && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <span className="text-lg">🔥</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Streak</p>
                  <p className="text-lg font-bold text-gray-900">{stats.streak} {stats.streak === 1 ? 'day' : 'days'}</p>
                </div>
              </div>
            )}

            {stats?.classCount !== undefined && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-lg">🏫</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Classes</p>
                  <p className="text-lg font-bold text-gray-900">{stats.classCount}</p>
                </div>
              </div>
            )}

            {stats?.totalAssignments !== undefined && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <span className="text-lg">📋</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Assignments</p>
                  <p className="text-lg font-bold text-gray-900">{stats.completedAssignments || 0}/{stats.totalAssignments}</p>
                </div>
              </div>
            )}

            {quizStats && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <span className="text-lg">📝</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quizzes</p>
                  <p className="text-lg font-bold text-gray-900">{quizStats.totalQuizzes}</p>
                </div>
              </div>
            )}

            {quizStats && quizStats.totalQuizzes > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg">📊</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Score</p>
                  <p className="text-lg font-bold text-gray-900">{quizStats.averageScore}%</p>
                </div>
              </div>
            )}

            {achievementCount !== undefined && achievementCount > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <span className="text-lg">🏆</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Achievements</p>
                  <p className="text-lg font-bold text-gray-900">{achievementCount}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Customize Avatar</h3>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Upload Custom Avatar */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Upload Custom Avatar</h4>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-violet-500 transition-colors text-sm text-gray-600 hover:text-violet-600 w-full"
              >
                Click to upload image (max 2MB)
              </button>
              {avatarError && <p className="text-red-600 text-sm mt-2">{avatarError}</p>}
              {avatarFile && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Selected:</span> {avatarFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click "Save Changes" below to upload
                  </p>
                </div>
              )}
              {hasCustomAvatar && !avatarFile && (
                <button
                  onClick={handleRemoveCustomAvatar}
                  className="mt-3 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium w-full"
                >
                  Remove Custom Avatar
                </button>
              )}
            </div>

            {/* Icon Avatars */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Choose Icon</h4>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className={`p-4 rounded-xl transition-all ${
                      selectedAvatar === avatar.id
                        ? 'ring-2 ring-violet-600 ring-offset-2'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-3xl text-white mx-auto mb-2`}>
                      {avatar.icon}
                    </div>
                    <p className="text-xs text-gray-600 text-center">{avatar.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveAvatar}
                disabled={savingAvatar}
                className="flex-1 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 font-semibold"
              >
                {savingAvatar ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
