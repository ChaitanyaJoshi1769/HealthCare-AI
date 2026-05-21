'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Heart, LogOut, BarChart3, MessageSquare, Settings } from 'lucide-react';
import type { User } from '@healthos/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    axios
      .get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => setUser(res.data.data?.user))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="animate-spin">
          <Heart className="w-8 h-8 text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white">HealthOS</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-300">{user?.firstName} {user?.lastName}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome, {user?.firstName}!</h2>
          <p className="text-slate-400">Your personalized health intelligence platform</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition cursor-pointer">
            <MessageSquare className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">AI Copilot</h3>
            <p className="text-slate-400 text-sm">Chat with your personalized health assistant</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition cursor-pointer">
            <BarChart3 className="w-8 h-8 text-green-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Health Metrics</h3>
            <p className="text-slate-400 text-sm">View and manage your health data</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition cursor-pointer">
            <Settings className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
            <p className="text-slate-400 text-sm">Manage your profile and preferences</p>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Getting Started</h3>
          <ol className="space-y-2">
            <li className="flex gap-3">
              <span className="font-bold">1.</span>
              <span>Connect your wearables (Apple Health, Fitbit, etc.)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">2.</span>
              <span>Upload your medical history and genomic data</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">3.</span>
              <span>Start chatting with your AI health copilot</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">4.</span>
              <span>Get personalized insights and recommendations</span>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
