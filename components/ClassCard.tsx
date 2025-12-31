'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ClassCardProps {
  id: string;
  name: string;
  description?: string | null;
  code: string;
  teacherName?: string;
  studentCount?: number;
  role: 'teacher' | 'student';
  onDelete?: () => void;
  variant?: 'grid' | 'compact';
}

export default function ClassCard({
  id,
  name,
  description,
  code,
  teacherName,
  studentCount,
  role,
  onDelete,
  variant = 'grid',
}: ClassCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/teacher/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: id }),
      });

      if (response.ok) {
        onDelete?.();
      } else {
        alert('Failed to delete class');
        setIsDeleting(false);
      }
    } catch (error) {
      alert('Error deleting class');
      setIsDeleting(false);
    }
  };

  const href = role === 'teacher' ? `/teacher/classes/${id}` : `/class/${id}`;

  if (variant === 'compact') {
    return (
      <Link href={href}>
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
              {teacherName && (
                <p className="text-xs text-gray-500 truncate">Taught by {teacherName}</p>
              )}
              {role === 'teacher' && studentCount !== undefined && (
                <p className="text-xs text-gray-500">{studentCount} students</p>
              )}
            </div>
            <div className="ml-4">
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-violet-100 text-violet-700 text-xs font-mono">
                {code}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href}>
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer relative group">
        {/* Class Icon */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl">
            🏫
          </div>
          {role === 'teacher' && onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-red-600 disabled:opacity-50"
              title="Delete class"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Class Info */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{name}</h3>
          {description && (
            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {teacherName && (
              <div className="flex items-center gap-1 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs">{teacherName}</span>
              </div>
            )}
            {role === 'teacher' && studentCount !== undefined && (
              <div className="flex items-center gap-1 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-xs">{studentCount} {studentCount === 1 ? 'student' : 'students'}</span>
              </div>
            )}
          </div>
          <div className="px-3 py-1 rounded-md bg-violet-100 text-violet-700 text-xs font-mono font-semibold">
            {code}
          </div>
        </div>
      </div>
    </Link>
  );
}
