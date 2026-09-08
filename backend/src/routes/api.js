import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';

import {
  googleLogin,
  demoLogin,
  saveOnboarding,
  getMe,
  updateProfile
} from '../controllers/authController.js';

import {
  uploadAndAnalyzeResume,
  getLatestResume
} from '../controllers/resumeController.js';

import {
  createRoadmap,
  getUserRoadmaps,
  toggleTaskComplete,
  updateTask
} from '../controllers/roadmapController.js';

import {
  getPlan,
  generateAIPlan,
  savePlanTasks
} from '../controllers/plannerController.js';

import {
  getChatHistory,
  sendMessage,
  clearChatHistory
} from '../controllers/chatController.js';

import {
  getGoals,
  createGoal,
  updateGoalProgress,
  deleteGoal
} from '../controllers/goalController.js';

import {
  sendTestReminder,
  getReminders
} from '../controllers/reminderController.js';

import {
  getAdminStats
} from '../controllers/adminController.js';

const router = express.Router();

// 1. Authentication
router.post('/auth/google', googleLogin);
router.post('/auth/demo', demoLogin);
router.post('/auth/onboarding', authenticateToken, saveOnboarding);
router.get('/auth/me', authenticateToken, getMe);
router.put('/user/profile', authenticateToken, updateProfile);

// 2. Resume Analyzer
router.post('/resume/analyze', authenticateToken, uploadResume.single('resume'), uploadAndAnalyzeResume);
router.get('/resume/latest', authenticateToken, getLatestResume);

// 3. Smart Roadmap
router.post('/roadmap/generate', authenticateToken, createRoadmap);
router.get('/roadmap', authenticateToken, getUserRoadmaps);
router.put('/roadmap/tasks/:taskId/toggle', authenticateToken, toggleTaskComplete);
router.put('/roadmap/tasks/:taskId', authenticateToken, updateTask);

// 4. AI Planner
router.get('/planner', authenticateToken, getPlan);
router.post('/planner/generate', authenticateToken, generateAIPlan);
router.post('/planner/tasks', authenticateToken, savePlanTasks);

// 5. 24/7 Career Chatbot
router.get('/chat/history', authenticateToken, getChatHistory);
router.post('/chat/message', authenticateToken, sendMessage);
router.delete('/chat/history', authenticateToken, clearChatHistory);

// 6. Goal Tracker
router.get('/goals', authenticateToken, getGoals);
router.post('/goals', authenticateToken, createGoal);
router.put('/goals/:goalId', authenticateToken, updateGoalProgress);
router.delete('/goals/:goalId', authenticateToken, deleteGoal);

// 7. Reminders
router.post('/reminders/test', authenticateToken, sendTestReminder);
router.get('/reminders', authenticateToken, getReminders);

// 8. Admin Analytics
router.get('/admin/stats', getAdminStats);

export default router;
