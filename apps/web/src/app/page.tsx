'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Brain, Zap, BarChart3, Shield, Microscope } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Health Monitoring',
      description: 'Integrate wearables and health data for comprehensive monitoring',
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI Copilot',
      description: 'Personalized health insights powered by Claude AI',
    },
    {
      icon: <Microscope className="w-8 h-8" />,
      title: 'Genomics',
      description: 'Advanced genetic analysis and personalized medicine',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Risk Prediction',
      description: 'Predictive analytics for disease prevention',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Longevity',
      description: 'Personalized strategies for healthspan optimization',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Privacy First',
      description: 'Enterprise-grade security and HIPAA compliance',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur border-b border-slate-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <Heart className="w-6 h-6 text-blue-500" />
              HealthOS
            </div>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-slate-300 hover:text-white transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            The Operating System for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              {' '}
              Intelligent Healthcare
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Precision medicine meets AI-native health intelligence. Personalized insights powered
            by Claude, integrated with your health data.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Get Started Free
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 border border-slate-400 text-white rounded-lg hover:border-slate-300 transition font-medium"
            >
              Learn More
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-white text-center mb-12"
        >
          Platform Capabilities
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition"
            >
              <div className="text-blue-400 mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Take Control of Your Health?</h2>
          <p className="text-blue-100 mb-8">
            Join thousands using HealthOS for personalized health intelligence
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold"
          >
            Start Your Journey
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-slate-400 text-center">
            HealthOS © 2024. Building the future of precision medicine.
          </p>
        </div>
      </footer>
    </div>
  );
}
