'use client';

import { useState, useEffect, useCallback } from 'react';
import type { QuizType, QuizSettings, Difficulty } from '@/lib/quizBuilder/types';
import { QUIZ_TYPE_INFO, getDefaultSettings } from '@/lib/quizBuilder';
import DifficultySelector from './DifficultySelector';
import SettingsPanel from './SettingsPanel';

interface QuizBuilderModalProps {
  quizType: QuizType;
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz: (settings: QuizSettings) => void;
}

export default function QuizBuilderModal({
  quizType,
  isOpen,
  onClose,
  onStartQuiz,
}: QuizBuilderModalProps) {
  const [settings, setSettings] = useState<QuizSettings>(() =>
    getDefaultSettings(quizType, 'beginner')
  );
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const quizInfo = QUIZ_TYPE_INFO[quizType];

  // Load saved defaults when quiz type changes or modal opens
  useEffect(() => {
    async function loadSavedDefaults() {
      setLoadingDefaults(true);

      // Get default settings as base - this ensures quizType and all fields are present
      const defaultSettings = getDefaultSettings(quizType, 'beginner');

      try {
        // First check localStorage for session defaults
        const localSettings = localStorage.getItem(`quiz-defaults-${quizType}`);
        if (localSettings) {
          const parsed = JSON.parse(localSettings);
          // Merge with defaults to ensure quizType and all fields are present
          setSettings({ ...defaultSettings, ...parsed, quizType });
          setLoadingDefaults(false);
          return;
        }

        // Then try to fetch from API
        const response = await fetch(`/api/quiz-settings?quizType=${quizType}`);
        if (response.ok) {
          const data = await response.json();
          if (data.settings && Object.keys(data.settings).length > 0) {
            // Merge with defaults to ensure quizType and all fields are present
            setSettings({ ...defaultSettings, ...data.settings, quizType });
            setLoadingDefaults(false);
            return;
          }
        }

        // Fall back to beginner defaults
        setSettings(defaultSettings);
      } catch (error) {
        console.error('Failed to load saved defaults:', error);
        setSettings(defaultSettings);
      } finally {
        setLoadingDefaults(false);
      }
    }

    if (isOpen) {
      loadSavedDefaults();
    }
  }, [quizType, isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDifficultyChange = useCallback((difficulty: Difficulty) => {
    setSettings(getDefaultSettings(quizType, difficulty));
  }, [quizType]);

  const handleSettingsChange = useCallback((newSettings: Partial<QuizSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings } as QuizSettings));
  }, []);

  const handleStartQuiz = async () => {
    if (saveAsDefault) {
      setSavingSettings(true);
      try {
        // Save to localStorage for immediate session use
        localStorage.setItem(`quiz-defaults-${quizType}`, JSON.stringify(settings));

        // Also save to API for persistence across sessions
        await fetch('/api/quiz-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizType, settings }),
        });
      } catch (error) {
        console.error('Failed to save settings:', error);
        // Continue anyway - localStorage will work for this session
      } finally {
        setSavingSettings(false);
      }
    }
    onStartQuiz(settings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-[#439FDD] text-white p-6 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{quizInfo.icon}</span>
            <div>
              <h2 className="text-xl font-bold">{quizInfo.name}</h2>
              <p className="text-white/80 text-sm">{quizInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Difficulty Selector */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Difficulty</h3>
            <DifficultySelector
              selected={settings.difficulty ?? 'beginner'}
              onChange={handleDifficultyChange}
            />
          </div>

          <hr className="border-gray-200" />

          {/* Settings Panel */}
          <SettingsPanel
            settings={settings}
            onChange={handleSettingsChange}
          />

          <hr className="border-gray-200" />

          {/* Question Count */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Questions</h3>
              <span className="text-lg font-bold text-[#439FDD]">{settings.questionCount ?? 10}</span>
            </div>
            <input
              type="range"
              min={5}
              max={25}
              value={settings.questionCount ?? 10}
              onChange={(e) => handleSettingsChange({ questionCount: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#439FDD]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
              <span>25</span>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Timer Settings */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Timer</span>
                <span className="text-xs text-gray-500">(per question)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.timerEnabled ?? false}
                  onChange={(e) => handleSettingsChange({ timerEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#439FDD]"></div>
              </label>
            </label>

            {settings.timerEnabled && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm text-gray-600">Time Limit</h3>
                  <span className="text-base font-bold text-[#439FDD]">{settings.timeLimitSeconds ?? 60}s</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={300}
                  step={10}
                  value={settings.timeLimitSeconds ?? 60}
                  onChange={(e) => handleSettingsChange({ timeLimitSeconds: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#439FDD]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>30s</span>
                  <span>1m</span>
                  <span>2m</span>
                  <span>3m</span>
                  <span>5m</span>
                </div>
              </div>
            )}
          </div>

          {/* Save as Default */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#439FDD] focus:ring-[#439FDD]"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900">
              Save as my default settings
            </span>
          </label>

          {/* Start Quiz Button */}
          <button
            onClick={handleStartQuiz}
            disabled={loadingDefaults || savingSettings}
            className="w-full py-4 bg-[#439FDD] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {savingSettings ? 'Saving...' : loadingDefaults ? 'Loading...' : 'Start Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
