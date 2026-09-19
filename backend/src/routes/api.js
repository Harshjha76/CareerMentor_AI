import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';

import {
  emailLogin,
  googleLogin,
  demoLogin,
  saveOnboarding,
  getMe,
  updateProfile,
  getUserSkills,
  updateUserSkills
} from '../controllers/authController.js';

import {
  uploadAndAnalyzeResume,
  getLatestResume
} from '../controllers/resumeController.js';

import {
  createRoadmap,
  getUserRoadmaps,
  toggleTaskComplete,
  updateTask,
  getRoadmapStreak,
  sendRoadmapStreakAlert
} from '../controllers/roadmapController.js';

import {
  getPlan,
  generateAIPlan,
  savePlanTasks,
  analyzePlanProsAndCons,
  applyAIOptimization
} from '../controllers/plannerController.js';

import {
  getChatHistory,
  sendMessage,
  clearChatHistory,
  getSessions,
  createSession,
  getSessionMessages,
  sendSessionMessage,
  deleteSession,
  renameSession
} from '../controllers/chatController.js';

import {
  getGoals,
  createGoal,
  updateGoalProgress,
  deleteGoal
} from '../controllers/goalController.js';

import {
  sendTestReminder,
  simulate2HourCheckin,
  getReminders,
  sendInconsistencyNudge,
  getInconsistencyStatus,
  updateEmailPermission,
  getEmailPreferences,
  updateEmailPreferences,
  grantEmailConsent,
  getEmailHistory,
  sendWelcomeEmailManual,
  sendGoalEmailManual,
  triggerSchedulerNow
} from '../controllers/reminderController.js';

import {
  getRecommendedInternships,
  getInternshipQuestions,
  evaluateInternshipAnswer
} from '../controllers/internshipController.js';

import {
  getAdminStats
} from '../controllers/adminController.js';

const router = express.Router();

// 1. Authentication & Profile
router.post('/auth/email', emailLogin);
router.post('/auth/google', googleLogin);
router.post('/auth/demo', demoLogin);
router.post('/auth/onboarding', authenticateToken, saveOnboarding);
router.get('/auth/me', authenticateToken, getMe);
router.put('/user/profile', authenticateToken, updateProfile);
router.get('/user/skills', authenticateToken, getUserSkills);
router.put('/user/skills', authenticateToken, updateUserSkills);

// 2. Resume Analyzer & Deep Information Extraction
router.post('/resume/analyze', authenticateToken, uploadResume.single('resume'), uploadAndAnalyzeResume);
router.get('/resume/latest', authenticateToken, getLatestResume);

// 3. Smart Roadmap
router.post('/roadmap/generate', authenticateToken, createRoadmap);
router.get('/roadmap', authenticateToken, getUserRoadmaps);
router.get('/roadmap/streak', authenticateToken, getRoadmapStreak);
router.post('/roadmap/streak-alert', authenticateToken, sendRoadmapStreakAlert);
router.put('/roadmap/tasks/:taskId/toggle', authenticateToken, toggleTaskComplete);
router.put('/roadmap/tasks/:taskId', authenticateToken, updateTask);

// 4. AI Planner (Human + AI Co-Planning)
router.get('/planner', authenticateToken, getPlan);
router.post('/planner/generate', authenticateToken, generateAIPlan);
router.post('/planner/tasks', authenticateToken, savePlanTasks);
router.post('/planner/analyze', authenticateToken, analyzePlanProsAndCons);
router.post('/planner/optimize', authenticateToken, applyAIOptimization);

// 5. 24/7 Career Chatbot (Multi-Session & Database-Backed)
router.get('/chat/sessions', authenticateToken, getSessions);
router.post('/chat/sessions', authenticateToken, createSession);
router.get('/chat/sessions/:sessionId/messages', authenticateToken, getSessionMessages);
router.post('/chat/sessions/:sessionId/messages', authenticateToken, sendSessionMessage);
router.delete('/chat/sessions/:sessionId', authenticateToken, deleteSession);
router.put('/chat/sessions/:sessionId', authenticateToken, renameSession);
// Legacy compatibility routes
router.get('/chat/history', authenticateToken, getChatHistory);
router.post('/chat/message', authenticateToken, sendMessage);
router.delete('/chat/history', authenticateToken, clearChatHistory);

// 6. Goal Tracker
router.get('/goals', authenticateToken, getGoals);
router.post('/goals', authenticateToken, createGoal);
router.put('/goals/:goalId', authenticateToken, updateGoalProgress);
router.delete('/goals/:goalId', authenticateToken, deleteGoal);

// 7. Complete AI Email Automation System & Accountability Guardian
router.get('/email/preferences', authenticateToken, getEmailPreferences);
router.put('/email/preferences', authenticateToken, updateEmailPreferences);
router.post('/email/grant-consent', authenticateToken, grantEmailConsent);
router.get('/email/history', authenticateToken, getEmailHistory);
router.post('/email/trigger-welcome', authenticateToken, sendWelcomeEmailManual);
router.post('/email/trigger-goal', authenticateToken, sendGoalEmailManual);
router.post('/email/trigger-inactivity', authenticateToken, sendInconsistencyNudge);
router.post('/email/trigger-scheduler', authenticateToken, triggerSchedulerNow);

// Legacy / Compatibility Reminders endpoints
router.post('/reminders/test', authenticateToken, sendTestReminder);
router.post('/reminders/checkin-2h', authenticateToken, simulate2HourCheckin);
router.post('/reminders/inconsistency-nudge', authenticateToken, sendInconsistencyNudge);
router.get('/reminders/inconsistency-status', authenticateToken, getInconsistencyStatus);
router.put('/reminders/email-permission', authenticateToken, updateEmailPermission);
router.get('/reminders', authenticateToken, getReminders);

// 8. Smart Resume-Tailored Internship Matcher & Interview Tackle Engine
router.get('/internships/recommendations', authenticateToken, getRecommendedInternships);
router.get('/internships/questions', authenticateToken, getInternshipQuestions);
router.post('/internships/evaluate-answer', authenticateToken, evaluateInternshipAnswer);

// 9. Admin Analytics
router.get('/admin/stats', getAdminStats);

export default router;
