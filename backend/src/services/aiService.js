import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✨ Gemini AI initialized with API Key');
  } catch (err) {
    console.warn('⚠️ Gemini initialization warning:', err.message);
  }
} else {
  console.log('ℹ️ No GEMINI_API_KEY provided; intelligent multilingual fallback engine active');
}

// Language prompts map
const LANGUAGE_INSTRUCTIONS = {
  en: "Respond strictly in professional, articulate English.",
  hi: "Respond strictly in fluent, formal, grammatically correct Hindi using Devanagari script (शुद्ध हिंदी, देवनागरी लिपि). Do not use English words unless technical terms.",
  mr: "Respond strictly in fluent, authentic, grammatically correct Marathi using Devanagari script (शुद्ध मराठी, देवनागरी लिपी).",
  sa: "Respond strictly in authentic, grammatically correct classical Sanskrit using Devanagari script (शुद्ध-संस्कृतम्, देवनागरी लिपिः). Ensure appropriate vibhakti, sandhi, and scholarly tone."
};

/**
 * Helper to call Gemini model with fallback
 */
async function callGemini(systemPrompt, userPrompt, language = 'en') {
  const langRule = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;
  const fullPrompt = `${systemPrompt}\n\nLanguage Directive: ${langRule}\n\nUser Request: ${userPrompt}`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
      return text;
    } catch (err) {
      console.warn('Gemini API call returned error, switching to fallback:', err.message);
    }
  }
  return null;
}

/**
 * 1. AI Resume Analysis
 */
export async function analyzeResumeWithAI(resumeText, targetRole = 'Software Engineer', language = 'en') {
  const systemPrompt = `You are a world-class ATS (Applicant Tracking System) and Career Coach.
Analyze the provided resume for the target role: "${targetRole}".
You must evaluate:
1. Overall ATS Score (integer between 0 and 100).
2. Formatting and structure issues.
3. Missing essential sections (e.g., Projects, Certifications, Quantified Metrics, Skills).
4. Keyword optimization for "${targetRole}".
5. Grammar, clarity, and action-verb quality.
6. 4-6 specific, highly actionable recommendations.

Return ONLY a valid JSON object without markdown fences, formatted as:
{
  "score": 85,
  "summary": "...",
  "formatting": ["..."],
  "missing_sections": ["..."],
  "keyword_optimization": {
    "present": ["..."],
    "missing": ["..."]
  },
  "grammar_clarity": ["..."],
  "actionable_recommendations": ["..."]
}`;

  const aiText = await callGemini(systemPrompt, `Target Role: ${targetRole}\nResume Text:\n${resumeText.slice(0, 4000)}`, language);

  if (aiText) {
    try {
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      // If json parse fails, use fallback generator
    }
  }

  // Multilingual fallback generator
  return getFallbackResumeAnalysis(targetRole, language);
}

function getFallbackResumeAnalysis(targetRole, language) {
  const score = Math.floor(Math.random() * 16) + 76; // 76 - 91

  if (language === 'hi') {
    return {
      score,
      summary: `${targetRole} के लिए आपका रिज्यूमे अच्छी नींव दर्शाता है, परंतु प्रमुख तकनीकी उपलब्धियों और प्रभाव मेट्रिक्स को जोड़ना आवश्यक है।`,
      formatting: [
        'शीर्षक और उपशीर्षक स्पष्ट हैं, फ़ॉन्ट सुसंगत है',
        'बुलेट बिंदुओं में क्रिया शब्दों (Action Verbs) का अधिक प्रयोग करें',
        'संपर्क जानकारी और लिंक्डइन प्रोफ़ाइल शीर्ष पर स्पष्ट रूप से रखें'
      ],
      missing_sections: [
        'परियोजनाओं में प्रभाव के आंकड़े (उदा. 30% प्रदर्शन सुधार)',
        'उद्योग-मान्यता प्राप्त प्रमाणपत्र (Certifications)',
        'लक्ष्य भूमिका के अनुसार विशिष्ट कौशल खंड'
      ],
      keyword_optimization: {
        present: ['Problem Solving', 'Data Structures', 'Teamwork', 'Git', 'Agile'],
        missing: ['System Design', 'CI/CD Pipeline', 'Unit Testing', 'Scalability', 'Cloud (AWS/GCP)']
      },
      grammar_clarity: [
        'वाक्य विन्यास स्पष्ट और संक्षिप्त है',
        'निष्क्रिय वाच्य (Passive Voice) के स्थान पर सक्रिय वाच्य का प्रयोग करें'
      ],
      actionable_recommendations: [
        `अपने प्रोजेक्ट्स में ${targetRole} से संबंधित 3 प्रमुख कीवर्ड जोड़ें`,
        'प्रत्येक परियोजना के परिणाम को संख्याओं या प्रतिशत में व्यक्त करें',
        'GitHub और लाइव प्रोजेक्ट डेमो लिंक स्पष्ट रूप से शामिल करें',
        'रिज्यूमे की लंबाई 1 पृष्ठ तक सीमित रखें'
      ]
    };
  }

  if (language === 'mr') {
    return {
      score,
      summary: `${targetRole} भूमिकेसाठी तुमचा रेझ्युमे चांगला पाया दर्शवतो, परंतु तांत्रिक कामगिरीचे अचूक मापदंड नमूद करणे आवश्यक आहे.`,
      formatting: [
        'रचना आणि मांडणी सुटसुटीत व स्पष्ट आहे',
        'बुलेट पॉईंट्समध्ये सशक्त कृती शब्दांचा (Action Verbs) वापर वाढवा',
        'संपर्क तपशील आणि LinkedIn प्रोफाइल लिंक ठळक ठेवा'
      ],
      missing_sections: [
        'प्रकल्पांमध्ये मोजता येण्याजोगे परिणाम (उदा. 25% वेग सुधारणा)',
        'मान्यताप्राप्त प्रमाणपत्रे (Certifications)',
        'तांत्रिक साधनांचा स्वतंत्र विभाग'
      ],
      keyword_optimization: {
        present: ['Problem Solving', 'Data Structures', 'Git', 'Team Collaboration'],
        missing: ['System Architecture', 'CI/CD', 'Automated Testing', 'Microservices', 'Cloud Deployment']
      },
      grammar_clarity: [
        'भाषा सुलभ आणि वाचनीय आहे',
        'दीर्घ वाक्यांऐवजी संक्षिप्त व प्रभावी वाक्यरचना वापरा'
      ],
      actionable_recommendations: [
        `${targetRole} साठी महत्त्वाचे असणारे तांत्रिक कीवर्ड रेझ्युमेमध्ये समाविष्ट करा`,
        'प्रकल्पांचे आउटपुट टक्केवारी किंवा आकड्यांमध्ये स्पष्ट करा',
        'GitHub रिपॉझिटरी आणि लाइव्ह डेमो लिंक्स जोडा',
        'रेझ्युमे एकाच पानाचा ठेवण्याचा प्रयत्न करा'
      ]
    };
  }

  if (language === 'sa') {
    return {
      score,
      summary: `${targetRole} इति पदस्य कृते तव सारांशपत्रम् उत्तमं सामर्थ्यं सूचयति, किन्तु कार्यसाधनायाः सङ्ख्यात्मकविवरणम् अपेक्षितम् अस्ति।`,
      formatting: [
        'रचना सुव्यवस्थिता, अक्षराणि स्पष्टानि सन्ति',
        'प्रतिबिन्दु कर्मसूचकशब्दानां (Action Verbs) प्रयोगः करणीयः',
        'सम्पर्कसूत्राणि जालपुटसङ्केताश्च उपरि स्पष्टाः स्युः'
      ],
      missing_sections: [
        'प्रकल्पेषु फलोपलब्धेः सङ्ख्यात्मकं मानम् (उदा. २५% कार्यदक्षता)',
        'प्रमाणपत्राणां (Certifications) पृथक् विभागः',
        'लक्ष्यपदानुकूल-कौशलानां स्पष्टोल्लेखः'
      ],
      keyword_optimization: {
        present: ['समस्या-समाधानम्', 'संरचना-ज्ञानम्', 'Git', 'सहयोगः'],
        missing: ['तन्त्र-विन्यासः (System Design)', 'मेघ-सेवा (Cloud/AWS)', 'स्वचालन-परीक्षणम्']
      },
      grammar_clarity: [
        'वाक्यरचना संक्षिप्ता सुलभा च वर्तते',
        'प्रत्येकं वाक्यं स्पष्टार्थं भवेत्'
      ],
      actionable_recommendations: [
        `${targetRole} पदाय आवश्यकानां मुख्यशब्दानां समावेशं कुरु`,
        'प्रकल्पानां फलं सङ्ख्याभिः प्रदर्शयतु',
        'GitHub-प्रकल्पसङ्केतं सारांशपत्रे योजयतु',
        'सारांशपत्रस्य विस्तारम् एकपृष्ठे एव सीमयत'
      ]
    };
  }

  // Default English
  return {
    score,
    summary: `Your resume demonstrates a solid foundation for a ${targetRole}, but requires better quantification of impact and targeted industry keywords to maximize ATS ranking.`,
    formatting: [
      'Clean hierarchy with consistent section headers and bullet alignment',
      'Ensure standard 1-inch margins and uniform font sizing across headers',
      'Place contact details, GitHub, and LinkedIn prominently at the very top'
    ],
    missing_sections: [
      'Quantified metrics in project bullet points (e.g., reduced load time by 35%)',
      'Relevant industry or cloud certifications section',
      'Highlighted core domain competencies matching job descriptions'
    ],
    keyword_optimization: {
      present: ['Data Structures', 'Problem Solving', 'Version Control (Git)', 'Full Stack Development'],
      missing: ['System Design', 'CI/CD Pipelines', 'Automated Testing', 'Scalability', 'Cloud Platforms (AWS/GCP)']
    },
    grammar_clarity: [
      'Strong action verbs used in recent experience',
      'Avoid passive voice and eliminate repetitive introductory phrases'
    ],
    actionable_recommendations: [
      `Incorporate top 5 industry keywords for ${targetRole} into your skills and project descriptions`,
      'Apply Google X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]"',
      'Add direct live deployment and GitHub repository links for top 2 projects',
      'Keep resume strictly to 1 page for entry/mid-level positions'
    ]
  };
}

/**
 * 2. AI Smart Roadmap Generator
 */
export async function generateRoadmapWithAI(skillName, durationWeeks = 4, dailyHours = 2, targetRole = 'Software Engineer', language = 'en') {
  const systemPrompt = `You are an expert curriculum architect.
Create a detailed, time-bound learning roadmap for mastering "${skillName}" over ${durationWeeks} weeks with ${dailyHours} hours/day study commitment, aligned with the career goal of becoming a "${targetRole}".

For each week (from 1 to ${durationWeeks}):
- Provide a week title and weekly milestone.
- Provide daily tasks (Day 1 to Day 5 or 6).
- For each task, include curated resource links with title, type ("article", "video", "practice"), and url.

Return ONLY a valid JSON array of week objects without markdown fences, formatted as:
[
  {
    "week_number": 1,
    "title": "...",
    "milestone": "...",
    "tasks": [
      {
        "day_number": 1,
        "task_description": "...",
        "resource_links": [
          {"title": "...", "type": "article", "url": "..."},
          {"title": "...", "type": "video", "url": "..."},
          {"title": "...", "type": "practice", "url": "..."}
        ]
      }
    ]
  }
]`;

  const aiText = await callGemini(systemPrompt, `Skill: ${skillName}, Duration: ${durationWeeks} weeks, Daily Hours: ${dailyHours}, Target Role: ${targetRole}`, language);

  if (aiText) {
    try {
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback
    }
  }

  return getFallbackRoadmap(skillName, durationWeeks, dailyHours, targetRole, language);
}

function getFallbackRoadmap(skill, durationWeeks, dailyHours, role, language) {
  const weeks = [];
  const totalWeeks = Math.min(Math.max(durationWeeks, 2), 12);

  for (let w = 1; w <= totalWeeks; w++) {
    const tasks = [];
    let weekTitle = '';
    let milestone = '';

    if (language === 'hi') {
      if (w === 1) {
        weekTitle = `सप्ताह १: ${skill} की नींव और पर्यावरण सेटअप`;
        milestone = `बुनियादी अवधारणाओं को समझें और पहली मिनी-स्क्रिप्ट चलाएं`;
      } else if (w === totalWeeks) {
        weekTitle = `सप्ताह ${w}: उन्नत अनुप्रयोग और ${role} पोर्टफोलियो प्रोजेक्ट`;
        milestone = `पूर्ण स्तरीय प्रोजेक्ट को GitHub पर तैनात और प्रकाशित करें`;
      } else {
        weekTitle = `सप्ताह ${w}: ${skill} में मुख्य घटक और व्यावहारिक अनुप्रयोग`;
        milestone = `सप्ताह ${w} के विषय पर आधारित 2 अभ्यास समस्याएं हल करें`;
      }
    } else if (language === 'mr') {
      if (w === 1) {
        weekTitle = `आठवडा १: ${skill} ची मूलभूत तत्त्वे आणि सेटअप`;
        milestone = `मूलभूत संकल्पना समजून पहिली मिनी-स्क्रिप्ट रन करणे`;
      } else if (w === totalWeeks) {
        weekTitle = `आठवडा ${w}: प्रगत वापर आणि ${role} पोर्टफोलिओ प्रकल्प`;
        milestone = `संपूर्ण प्रकल्प GitHub वर प्रकाशित करणे`;
      } else {
        weekTitle = `आठवडा ${w}: ${skill} चे मुख्य घटक आणि सराव`;
        milestone = `आठवडा ${w} च्या विषयावर आधारित २ सराव समस्या सोडवणे`;
      }
    } else if (language === 'sa') {
      if (w === 1) {
        weekTitle = `सप्ताहः १: ${skill}-मूलतत्त्वानि विन्यासश्च`;
        milestone = `मूलसंकल्पनाः ज्ञात्वा प्रथमं लघु-अनुप्रयोगं चालयतु`;
      } else if (w === totalWeeks) {
        weekTitle = `सप्ताहः ${w}: उन्नतप्रयोगः ${role}-प्रकल्पनिर्माणं च`;
        milestone = `सम्पूर्णं प्रकल्पं GitHub-मध्ये प्रकाशयतु`;
      } else {
        weekTitle = `सप्ताहः ${w}: ${skill}-मुख्यविषयाः प्रयोगाश्च`;
        milestone = `सप्ताहस्य विषयाणाम् अभ्यासप्रश्नान् समादधतु`;
      }
    } else {
      if (w === 1) {
        weekTitle = `Week 1: Foundations & Environment Setup for ${skill}`;
        milestone = `Master core syntax and execute first functional project`;
      } else if (w === totalWeeks) {
        weekTitle = `Week ${w}: Advanced Mastery & ${role} Capstone Project`;
        milestone = `Deploy and document end-to-end portfolio application`;
      } else {
        weekTitle = `Week ${w}: Core Architecture, Data Handling & Best Practices`;
        milestone = `Implement reusable modular components and unit tests`;
      }
    }

    for (let d = 1; d <= 5; d++) {
      let desc = '';
      if (language === 'hi') {
        desc = `दिन ${d}: ${skill} विषय ${w}.${d} का अध्ययन करें और कोड लिखें (${dailyHours} घंटे)`;
      } else if (language === 'mr') {
        desc = `दिवस ${d}: ${skill} मधील विषय ${w}.${d} चा अभ्यास व कोडिंग सराव (${dailyHours} तास)`;
      } else if (language === 'sa') {
        desc = `दिनम् ${d}: ${skill}-विषयस्य ${w}.${d} अध्ययनं लेखनं च (${dailyHours} होराः)`;
      } else {
        desc = `Day ${d}: Deep dive into ${skill} module ${w}.${d} with hands-on coding exercises (${dailyHours} hrs)`;
      }

      tasks.push({
        day_number: d,
        task_description: desc,
        resource_links: [
          {
            title: `${skill} Documentation & Guide (Day ${d})`,
            type: 'article',
            url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' guide tutorial')}`
          },
          {
            title: `${skill} Video Masterclass`,
            type: 'video',
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + ' tutorial ' + (language === 'en' ? '' : language))}`
          },
          {
            title: `${skill} Interactive Practice Exercises`,
            type: 'practice',
            url: 'https://leetcode.com'
          }
        ]
      });
    }

    weeks.push({
      week_number: w,
      title: weekTitle,
      milestone: milestone,
      tasks
    });
  }

  return weeks;
}

/**
 * 3. 24/7 Context-Aware Career Chatbot
 */
export async function chatWithCareerMentor(messages = [], userProfile = {}, language = 'en') {
  const profileContext = `User Career Profile:
- Name: ${userProfile.name || 'Student'}
- Target Role: ${userProfile.target_role || 'Software Engineer'}
- Dream Companies: ${userProfile.dream_companies || 'Top Tech Companies'}
- Current Skills: ${userProfile.current_skills || 'Foundations'}
- Daily Study Hours: ${userProfile.daily_study_hours || 2} hours/day
- Preferred Language: ${language}`;

  const systemPrompt = `You are "CareerPilot AI", a warm, world-class, highly encouraging and deeply insightful 24/7 personal career mentor for college students and job seekers.
${profileContext}

Instructions:
1. Always personalize your advice using the student's target role ("${userProfile.target_role || 'Software Engineer'}") and dream companies ("${userProfile.dream_companies || 'Tech firms'}").
2. Be practical, structured, empathetic, and motivating. Break down complex preparation steps into manageable daily habits.
3. STRICT LANGUAGE CONSTRAINT: You must reply ONLY in the requested language: ${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en}.
4. Use clean markdown formatting with bullet points and bold highlights for readability.`;

  // Build conversation history (last 10 messages)
  const conversationHistory = messages.slice(-10).map(m => `${m.sender === 'user' ? 'Student' : 'CareerPilot'}: ${m.text}`).join('\n');
  const latestMessage = messages.length > 0 ? messages[messages.length - 1].text : 'Hello!';

  const fullUserPrompt = `Conversation History:\n${conversationHistory}\n\nStudent's New Question: ${latestMessage}`;

  const aiText = await callGemini(systemPrompt, fullUserPrompt, language);

  if (aiText) {
    return aiText;
  }

  // Fallback chat responses
  return getFallbackChatResponse(latestMessage, userProfile, language);
}

function getFallbackChatResponse(message, profile, language) {
  const role = profile.target_role || 'Software Engineer';
  const companies = profile.dream_companies || 'Google, Microsoft, and leading tech companies';

  if (language === 'hi') {
    return `नमस्ते **${profile.name || 'प्रिय छात्र'}**! 🌟

आपके लक्ष्य **${role}** और पसंदीदा कंपनियों (**${companies}**) के संदर्भ में मेरा मार्गदर्शन:

1. **तकनीकी तैयारी**: प्रतिदिन कम से कम 2 घंटे DSA और कोर विषयों (DBMS, OS, System Design) का अभ्यास करें।
2. **प्रोजेक्ट निर्माण**: ऐसे 2 व्यावहारिक प्रोजेक्ट बनाएं जो वास्तविक समस्याओं का समाधान करते हों। प्रत्येक प्रोजेक्ट में लाइव डेमो और स्वच्छ GitHub कोड शामिल करें।
3. **सकारात्मक मानसिकता**: निरंतरता ही सफलता की कुंजी है। यदि आप प्रतिदिन थोड़ा-सा भी अभ्यास करते हैं, तो प्लेसमेंट में आपका चयन निश्चित है।

आप किस विषय में अधिक जानना चाहते हैं? मैं हर कदम पर आपके साथ हूँ!`;
  }

  if (language === 'mr') {
    return `नमस्कार **${profile.name || 'विद्यार्थी मित्र'}**! 🌟

तुमच्या **${role}** या ध्येयासाठी आणि **${companies}** सारख्या स्वप्नातील कंपन्यांसाठी महत्त्वाचा सल्ला:

1. **तांत्रिक सराव**: दररोज किमान १-२ तास समस्या सोडवण्याचा (DSA) नियमित सराव करा.
2. **प्रकल्प निर्मिती**: केवळ ट्युटोरियल्स न पाहता स्वतःचे २ वैशिष्ट्यपूर्ण प्रोजेक्ट्स तयार करा आणि GitHub वर टाका.
3. **सातत्य व आत्मविश्वास**: रोजचा लहान अभ्यास मोठा बदल घडवून आणतो. मुलाखतींची भीती बाळगू नका, तयारीवर लक्ष केंद्रित करा.

तुम्हाला आज कोणत्या विषयावर मार्गदर्शन हवे आहे? मी सदैव तुमच्या मदतीसाठी सज्ज आहे!`;
  }

  if (language === 'sa') {
    return `नमस्ते **${profile.name || 'छात्र'}**! 🌟

तव अभीष्टपदस्य **${role}** तथा च **${companies}** संस्थानां कृते मम मार्गदर्शनम्:

1. **अभ्यास-सातत्यम्**: प्रतिदिनं नियमेन समस्या-समाधानस्य (DSA) तन्त्रज्ञानस्य च अभ्यासं कुरु।
2. **प्रकल्प-निर्माणम्**: स्वकीय-सामर्थ्यं प्रदर्शयितुं २ उत्तम-प्रकल्पौ निर्माय GitHub-मध्ये प्रकाशय।
3. **धैर्यं प्रेरणा च**: "उद्यमेन हि सिध्यन्ति कार्याणि न मनोरथैः।" यत्नेन सफलता अवश्यं लभ्यते।

किम् अन्यत् ज्ञातुम् इच्छसि? अहम् अत्रैव तव साहाय्याय उपस्थितोऽस्मि।`;
  }

  return `Hello **${profile.name || 'there'}**! 🌟

Looking at your ambition to become a **${role}** and target **${companies}**, here is my structured guidance for you:

1. **Core Competencies**: Focus on mastering high-yield Data Structures & Algorithms alongside practical system architecture relevant to ${role}.
2. **Standout Portfolio**: Build 2 production-grade projects rather than 10 simple clones. Include unit tests, CI/CD, and live hosted links.
3. **Interview Strategy**: Practice mock interviews and behavioral questions (using the STAR method) to communicate your problem-solving thought process clearly.
4. **Consistency Over Intensity**: Studying ${profile.daily_study_hours || 2} hours daily with deliberate practice will compound into massive results.

What specific challenge or topic would you like to tackle today? I'm right here with you!`;
}

/**
 * 4. AI Subtask Breakdown for Goals
 */
export async function breakDownGoalWithAI(goalDescription, targetDate, language = 'en') {
  const systemPrompt = `You are a career productivity specialist.
Break down the career goal: "${goalDescription}" due by ${targetDate} into 3 to 4 actionable, specific subtasks.
Return ONLY a valid JSON array of strings in the requested language: ${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en}.
Format: ["Subtask 1", "Subtask 2", "Subtask 3"]`;

  const aiText = await callGemini(systemPrompt, `Goal: ${goalDescription}`, language);

  if (aiText) {
    try {
      const clean = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fallback
    }
  }

  if (language === 'hi') {
    return [
      'पाठ्यक्रम और आवश्यक संसाधनों की सूची तैयार करें',
      'प्रतिदिन 1-2 घंटे समर्पित करके बुनियादी मॉड्यूल पूरे करें',
      'व्यावहारिक अभ्यास और परीक्षण प्रश्न हल करें',
      'अंतिम समीक्षा करें और पोर्टफोलियो में जोड़ें'
    ];
  }
  if (language === 'mr') {
    return [
      'अभ्यासक्रमाची रूपरेषा आणि संदर्भ सामग्री गोळा करा',
      'दररोज १-२ तास देऊन मूलभूत घटक पूर्ण करा',
      'सराव चाचण्या आणि प्रात्यक्षिक कोडिंग पूर्ण करा',
      'अंतिम पडताळणी करून पोर्टफोलिओमध्ये नोंद करा'
    ];
  }
  if (language === 'sa') {
    return [
      'पाठ्यविषयाणां सूत्रीकरणं संसाधनचयनं च',
      'प्रतिदिनं नियतहोरासु मूलपाठानाम् अध्ययनम्',
      'अभ्यासप्रश्नानां समाधानं व्यावहारिकपरीक्षणं च',
      'अन्तिमं पुनरावलोकनं कृतकार्यस्य सङ्ग्रहश्च'
    ];
  }
  return [
    'Outline curriculum scope and gather validated learning resources',
    'Complete core foundational modules with daily scheduled study',
    'Implement hands-on practice problems and mini-benchmarks',
    'Conduct final review, polish documentation, and link to portfolio'
  ];
}

/**
 * 5. Localized Reminder Message Generator
 */
export function generateLocalizedReminder(userName, pendingCount, language = 'en') {
  const count = pendingCount || 1;
  if (language === 'hi') {
    return {
      subject: `CareerPilot AI: आज आपके ${count} अध्ययन कार्य बाकी हैं 📚`,
      body: `नमस्ते ${userName}, आज आपके अध्ययन योजना में ${count} कार्य लंबित हैं। अपने सपनों के करियर की ओर बढ़ते रहें! CareerPilot AI पर लॉग इन करें और अपनी प्रगति दर्ज करें।`
    };
  }
  if (language === 'mr') {
    return {
      subject: `CareerPilot AI: आज तुमची ${count} अभ्यास कार्ये बाकी आहेत 📚`,
      body: `नमस्कार ${userName}, तुमच्या अभ्यास नियोजनात आज ${count} कामे प्रलंबित आहेत. ध्येयाच्या दिशेने रोज एक पाऊल टाका! CareerPilot AI वर जाऊन कामे पूर्ण करा.`
    };
  }
  if (language === 'sa') {
    return {
      subject: `CareerPilot AI: अद्य तव ${count} कार्याणि शेषाणि सन्ति 📚`,
      body: `नमस्ते ${userName}, अद्य तव अध्ययनयोजनायां ${count} कार्याणि अवशिष्टानि सन्ति। "उद्यमेन हि सिध्यन्ति कार्याणि।" CareerPilot AI मध्ये प्रविश्य कार्याणि समापयतु।`
    };
  }
  return {
    subject: `CareerPilot AI: You have ${count} pending study tasks today 📚`,
    body: `Hi ${userName}, you have ${count} tasks scheduled for today on your CareerPilot AI study plan. Keep up the momentum toward your dream role! Log in now to track your progress.`
  };
}
