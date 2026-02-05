// app/api/quiz/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Type definitions
interface CBSECategory {
  title: string;
  class: number;
  subject: string;
}

interface TechCategory {
  title: string;
  subject: string;
  difficulty?: string;
}

type QuizCategory = CBSECategory | TechCategory;

interface QuizCategories {
  [key: string]: QuizCategory;
}

// Quiz categories with subjects
const QUIZ_CATEGORIES: QuizCategories = {
  // CBSE Class 9-12
  'class-9-math': { title: 'Class 9 Mathematics', class: 9, subject: 'Mathematics' },
  'class-9-science': { title: 'Class 9 Science', class: 9, subject: 'Science' },
  'class-9-english': { title: 'Class 9 English', class: 9, subject: 'English' },
  'class-9-social': { title: 'Class 9 Social Science', class: 9, subject: 'Social Science' },
  'class-9-hindi': { title: 'Class 9 Hindi', class: 9, subject: 'Hindi' },
  
  'class-10-math': { title: 'Class 10 Mathematics', class: 10, subject: 'Mathematics' },
  'class-10-science': { title: 'Class 10 Science', class: 10, subject: 'Science' },
  'class-10-english': { title: 'Class 10 English', class: 10, subject: 'English' },
  'class-10-social': { title: 'Class 10 Social Science', class: 10, subject: 'Social Science' },
  'class-10-hindi': { title: 'Class 10 Hindi', class: 10, subject: 'Hindi' },
  
  'class-11-math': { title: 'Class 11 Mathematics', class: 11, subject: 'Mathematics' },
  'class-11-physics': { title: 'Class 11 Physics', class: 11, subject: 'Physics' },
  'class-11-chemistry': { title: 'Class 11 Chemistry', class: 11, subject: 'Chemistry' },
  'class-11-biology': { title: 'Class 11 Biology', class: 11, subject: 'Biology' },
  'class-11-english': { title: 'Class 11 English', class: 11, subject: 'English' },
  'class-11-accounts': { title: 'Class 11 Accountancy', class: 11, subject: 'Accountancy' },
  'class-11-business': { title: 'Class 11 Business Studies', class: 11, subject: 'Business Studies' },
  'class-11-economics': { title: 'Class 11 Economics', class: 11, subject: 'Economics' },
  
  'class-12-math': { title: 'Class 12 Mathematics', class: 12, subject: 'Mathematics' },
  'class-12-physics': { title: 'Class 12 Physics', class: 12, subject: 'Physics' },
  'class-12-chemistry': { title: 'Class 12 Chemistry', class: 12, subject: 'Chemistry' },
  'class-12-biology': { title: 'Class 12 Biology', class: 12, subject: 'Biology' },
  'class-12-english': { title: 'Class 12 English', class: 12, subject: 'English' },
  'class-12-accounts': { title: 'Class 12 Accountancy', class: 12, subject: 'Accountancy' },
  'class-12-business': { title: 'Class 12 Business Studies', class: 12, subject: 'Business Studies' },
  'class-12-economics': { title: 'Class 12 Economics', class: 12, subject: 'Economics' },
  
  // Programming & Tech
  'python': { title: 'Python Programming', subject: 'Python', difficulty: 'intermediate' },
  'javascript': { title: 'JavaScript', subject: 'JavaScript', difficulty: 'intermediate' },
  'react': { title: 'React.js', subject: 'React', difficulty: 'intermediate' },
  'nodejs': { title: 'Node.js', subject: 'Node.js', difficulty: 'intermediate' },
  'html-css': { title: 'HTML & CSS', subject: 'HTML/CSS', difficulty: 'beginner' },
  'typescript': { title: 'TypeScript', subject: 'TypeScript', difficulty: 'intermediate' },
  'nextjs': { title: 'Next.js', subject: 'Next.js', difficulty: 'advanced' },
  'sql': { title: 'SQL Database', subject: 'SQL', difficulty: 'intermediate' },
  'mongodb': { title: 'MongoDB', subject: 'MongoDB', difficulty: 'intermediate' },
  'git': { title: 'Git & GitHub', subject: 'Git', difficulty: 'beginner' },
  'docker': { title: 'Docker', subject: 'Docker', difficulty: 'advanced' },
  'kubernetes': { title: 'Kubernetes', subject: 'Kubernetes', difficulty: 'advanced' },
  'aws': { title: 'AWS Cloud', subject: 'AWS', difficulty: 'advanced' },
  'angular': { title: 'Angular', subject: 'Angular', difficulty: 'intermediate' },
  'vue': { title: 'Vue.js', subject: 'Vue.js', difficulty: 'intermediate' },
  'django': { title: 'Django', subject: 'Django', difficulty: 'intermediate' },
  'flask': { title: 'Flask', subject: 'Flask', difficulty: 'intermediate' },
  'java': { title: 'Java Programming', subject: 'Java', difficulty: 'intermediate' },
  'cpp': { title: 'C++ Programming', subject: 'C++', difficulty: 'intermediate' },
  'csharp': { title: 'C# Programming', subject: 'C#', difficulty: 'intermediate' },
  'php': { title: 'PHP', subject: 'PHP', difficulty: 'intermediate' },
  'ruby': { title: 'Ruby', subject: 'Ruby', difficulty: 'intermediate' },
  'go': { title: 'Go (Golang)', subject: 'Go', difficulty: 'intermediate' },
  'rust': { title: 'Rust', subject: 'Rust', difficulty: 'advanced' },
  'swift': { title: 'Swift (iOS)', subject: 'Swift', difficulty: 'intermediate' },
  'kotlin': { title: 'Kotlin (Android)', subject: 'Kotlin', difficulty: 'intermediate' },
  'flutter': { title: 'Flutter', subject: 'Flutter', difficulty: 'intermediate' },
  'react-native': { title: 'React Native', subject: 'React Native', difficulty: 'intermediate' },
  'machine-learning': { title: 'Machine Learning', subject: 'ML', difficulty: 'advanced' },
  'deep-learning': { title: 'Deep Learning', subject: 'Deep Learning', difficulty: 'advanced' },
  'data-structures': { title: 'Data Structures', subject: 'DSA', difficulty: 'intermediate' },
  'algorithms': { title: 'Algorithms', subject: 'Algorithms', difficulty: 'intermediate' },
  'system-design': { title: 'System Design', subject: 'System Design', difficulty: 'advanced' },
  'blockchain': { title: 'Blockchain', subject: 'Blockchain', difficulty: 'advanced' },
  'cybersecurity': { title: 'Cybersecurity', subject: 'Security', difficulty: 'advanced' },
  'devops': { title: 'DevOps', subject: 'DevOps', difficulty: 'advanced' },
  'linux': { title: 'Linux', subject: 'Linux', difficulty: 'intermediate' },
  'redis': { title: 'Redis', subject: 'Redis', difficulty: 'intermediate' },
  'graphql': { title: 'GraphQL', subject: 'GraphQL', difficulty: 'intermediate' },
  'rest-api': { title: 'REST API Design', subject: 'APIs', difficulty: 'intermediate' },
  'testing': { title: 'Software Testing', subject: 'Testing', difficulty: 'intermediate' },
  'agile': { title: 'Agile Methodology', subject: 'Agile', difficulty: 'beginner' },
  'dsa': { title: 'Data Structures & Algorithms', subject: 'DSA', difficulty: 'intermediate' },
  'web-security': { title: 'Web Security', subject: 'Security', difficulty: 'advanced' },
  'firebase': { title: 'Firebase', subject: 'Firebase', difficulty: 'beginner' },
  'tailwind': { title: 'Tailwind CSS', subject: 'Tailwind', difficulty: 'beginner' },
  'bootstrap': { title: 'Bootstrap', subject: 'Bootstrap', difficulty: 'beginner' },
  'sass': { title: 'SASS/SCSS', subject: 'SASS', difficulty: 'intermediate' },
  'webpack': { title: 'Webpack', subject: 'Webpack', difficulty: 'advanced' },
  'vite': { title: 'Vite', subject: 'Vite', difficulty: 'intermediate' },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, questionCount = 20, difficulty } = body;

    if (!category || !QUIZ_CATEGORIES[category as keyof typeof QUIZ_CATEGORIES]) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    const quizInfo = QUIZ_CATEGORIES[category as keyof typeof QUIZ_CATEGORIES];
    const numQuestions = Math.min(questionCount, 30); // Max 30 questions

    // Check if this is a CBSE category (has class property)
    const isCBSE = 'class' in quizInfo;
    const classInfo = isCBSE ? (quizInfo as CBSECategory).class : undefined;
    const difficultyInfo = !isCBSE ? (quizInfo as TechCategory).difficulty : undefined;

    // Create AI prompt for question generation
    const prompt = `You are an expert exam creator. Generate ${numQuestions} unique, high-quality multiple-choice questions.

**Subject**: ${quizInfo.subject}
**Title**: ${quizInfo.title}
${classInfo ? `**Class**: ${classInfo} (CBSE Curriculum)` : ''}
${difficultyInfo ? `**Difficulty**: ${difficultyInfo}` : ''}

**Requirements**:
1. Generate EXACTLY ${numQuestions} questions
2. Each question MUST have exactly 4 options in an array
3. Options MUST be a valid JSON array: ["Option A", "Option B", "Option C", "Option D"]
4. correctAnswer is the index (0, 1, 2, or 3) of the correct option
5. Mix difficulty: easy (30%), medium (50%), hard (20%)
6. Questions should be clear, unambiguous, and test real understanding
7. For CBSE: Follow NCERT syllabus
8. For Tech: Include practical scenarios

**CRITICAL - JSON Format**:
You MUST return valid JSON. Each question must look EXACTLY like this:
{
  "id": 1,
  "question": "Your question text here?",
  "options": ["First option", "Second option", "Third option", "Fourth option"],
  "correctAnswer": 0,
  "difficulty": "easy",
  "topic": "Topic name",
  "explanation": "Brief explanation"
}

**Output Structure**:
{
  "questions": [
    { question object 1 },
    { question object 2 },
    ...
  ]
}

**IMPORTANT**:
- Use double quotes for ALL strings
- Options must be a proper array with square brackets []
- No syntax errors in JSON
- correctAnswer must be 0, 1, 2, or 3
- Each question gets +4 marks for correct, -1 for wrong, 0 for unattempted

Generate ${numQuestions} questions now in valid JSON format:`;

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert exam question creator. You MUST respond with perfectly valid JSON only. Ensure all "options" arrays use proper square brackets [] with exactly 4 strings. All strings must use double quotes. No syntax errors.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7, // Lower for more consistent JSON formatting
      max_tokens: 8000,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    let quizData;
    try {
      // Clean the response - remove any markdown formatting
      let cleanContent = content.trim();
      
      // Remove markdown code blocks if present
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      quizData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('AI Response:', content);
      throw new Error('AI generated invalid quiz format. Please try again - this happens occasionally.');
    }

    // Validate structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz structure. Please try generating the quiz again.');
    }

    // Validate each question has proper options array
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        console.error(`Question ${i + 1} has invalid options:`, q.options);
        throw new Error(`Generated quiz has formatting issues. Please try again.`);
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
        console.error(`Question ${i + 1} has invalid correctAnswer:`, q.correctAnswer);
        throw new Error(`Generated quiz has invalid answer format. Please try again.`);
      }
    }

    // Calculate total marks (each question = 4 marks)
    const totalMarks = quizData.questions.length * 4;

    console.log(`✅ Generated ${quizData.questions.length} questions for ${quizInfo.title}`);

    return NextResponse.json({
      success: true,
      data: {
        title: quizInfo.title,
        category,
        duration: 60, // 60 minutes
        totalMarks,
        passingMarks: Math.ceil(totalMarks * 0.4), // 40% to pass
        questions: quizData.questions,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'llama-3.3-70b-versatile',
          questionCount: quizData.questions.length,
          difficulty: difficulty || difficultyInfo || 'mixed',
          markingScheme: {
            correct: '+4',
            incorrect: '-1',
            unattempted: '0'
          }
        }
      }
    });

  } catch (error: any) {
    console.error('Quiz generation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate quiz',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET - List all available categories
export async function GET() {
  const categories = Object.entries(QUIZ_CATEGORIES).map(([key, value]) => ({
    id: key,
    ...value
  }));

  // Group categories
  const grouped = {
    cbse: {
      title: 'CBSE Classes 9-12',
      categories: categories.filter(c => c.id.startsWith('class-'))
    },
    programming: {
      title: 'Programming Languages',
      categories: categories.filter(c => 
        ['python', 'javascript', 'typescript', 'java', 'cpp', 'csharp', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin'].includes(c.id)
      )
    },
    webDev: {
      title: 'Web Development',
      categories: categories.filter(c => 
        ['html-css', 'react', 'nextjs', 'angular', 'vue', 'nodejs', 'tailwind', 'bootstrap', 'sass', 'webpack', 'vite'].includes(c.id)
      )
    },
    backend: {
      title: 'Backend & Databases',
      categories: categories.filter(c => 
        ['sql', 'mongodb', 'redis', 'graphql', 'rest-api', 'django', 'flask'].includes(c.id)
      )
    },
    mobile: {
      title: 'Mobile Development',
      categories: categories.filter(c => 
        ['flutter', 'react-native'].includes(c.id)
      )
    },
    devops: {
      title: 'DevOps & Cloud',
      categories: categories.filter(c => 
        ['docker', 'kubernetes', 'aws', 'devops', 'linux', 'firebase'].includes(c.id)
      )
    },
    advanced: {
      title: 'Advanced Topics',
      categories: categories.filter(c => 
        ['machine-learning', 'deep-learning', 'blockchain', 'cybersecurity', 'web-security', 'system-design', 'data-structures', 'algorithms', 'dsa'].includes(c.id)
      )
    },
    other: {
      title: 'Testing & Methodology',
      categories: categories.filter(c => 
        ['testing', 'agile', 'git'].includes(c.id)
      )
    }
  };

  return NextResponse.json({
    success: true,
    data: {
      total: categories.length,
      grouped,
      all: categories
    }
  });
}