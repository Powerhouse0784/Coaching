import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface StudyPlanRequest {
  topics: string;
  days: number;
  hoursPerDay: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  goal: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: StudyPlanRequest = await req.json();
    const { topics, days, hoursPerDay, level, goal } = body;

    // Validate input
    if (!topics || !days || !hoursPerDay || !level) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create detailed prompt for AI
    const prompt = `You are an expert educational AI that creates highly personalized study plans.

Create a comprehensive ${days}-day study plan with the following requirements:

**Student Profile:**
- Topics to learn: ${topics}
- Current level: ${level}
- Study duration: ${days} days
- Daily study time: ${hoursPerDay} hours
- Learning goal: ${goal || 'Master the topics effectively'}

**Instructions:**
1. Break down the topics into logical learning modules
2. Create a day-by-day schedule that progressively builds knowledge
3. Include specific time slots for each task
4. Balance theory, practice, and breaks appropriately
5. Add realistic task descriptions with actionable items
6. Include milestones and checkpoints
7. Adapt difficulty based on the student's level
8. Ensure proper spacing for retention (spaced repetition)

**Output Format (strict JSON):**
{
  "title": "Descriptive title for the study plan",
  "description": "Brief overview of what will be learned",
  "totalHours": ${days * hoursPerDay},
  "schedule": [
    {
      "day": 1,
      "title": "Day title",
      "focus": "Main focus area for the day",
      "objectives": ["objective 1", "objective 2"],
      "tasks": [
        {
          "time": "HH:MM-HH:MM",
          "task": "Specific task description",
          "type": "theory|practice|project|break|review",
          "duration": "minutes",
          "resources": ["resource 1", "resource 2"],
          "link": "https://example.com/resource (REQUIRED for theory/practice/project/review, OMIT for breaks)",
          "completed": false
        }
      ],
      "milestone": "What you should achieve by end of day"
    }
  ],
  "weeklyGoals": ["goal 1", "goal 2"],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "resources": {
    "documentation": ["link or name"],
    "tutorials": ["link or name"],
    "practice": ["link or name"]
  }
}

**Important:**
- Generate ALL ${days} days
- Each day should have ${hoursPerDay} hours of content (including breaks)
- Make tasks specific and actionable
- Include 10-15 minute breaks every 60-90 minutes
- Add variety: theory, hands-on practice, projects, reviews
- For beginners: more fundamentals and guided practice
- For intermediate: balance theory with real projects
- For advanced: focus on complex projects and optimization
- **Include a relevant link for EVERY task EXCEPT breaks** (official docs, tutorials, practice sites)
- **Breaks should NOT have a link property** - users just need to rest
- Links should be real, working URLs to help users get started immediately
- Return ONLY valid JSON, no markdown formatting or explanations

Generate the complete study plan now:`;

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational AI that creates personalized study plans. You always respond with valid JSON only, no markdown or explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile', 
      temperature: 0.7,
      max_tokens: 8000, 
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse and validate the response
    let studyPlan;
    try {
      studyPlan = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('AI Response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate structure
    if (!studyPlan.schedule || !Array.isArray(studyPlan.schedule)) {
      throw new Error('Invalid study plan structure');
    }

    // Log success
    console.log(`✅ Generated ${days}-day study plan for: ${topics}`);

    return NextResponse.json({
      success: true,
      plan: studyPlan,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'llama-3.3-70b-versatile',
        topics,
        days,
        level
      }
    });

  } catch (error: any) {
    console.error('Study plan generation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate study plan',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    // Test Groq connection
    const testCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 10
    });

    return NextResponse.json({
      status: 'healthy',
      service: 'AI Study Planner',
      model: 'llama-3.3-70b-versatile',
      apiConnected: !!testCompletion
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Groq API connection failed' },
      { status: 503 }
    );
  }
}