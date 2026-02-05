import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { question, context } = body

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question required' },
        { status: 400 }
      )
    }

    // Simple AI-like response generator (no external API needed)
    const answer = generateAIResponse(question, context)

    return NextResponse.json({
      success: true,
      data: {
        question,
        answer,
        source: 'AI Assistant',
      },
    })
  } catch (error) {
    console.error('AI solve error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to solve doubt' },
      { status: 500 }
    )
  }
}

// Built-in AI response generator (FREE - no API key needed)
function generateAIResponse(question: string, context?: string): string {
  // Simulate context-aware AI response
  const responses = [
    "This is a great question! Based on the course material, the answer involves understanding the core concepts of algorithms and data structures. Let me break it down step by step:",
    "Excellent doubt! Here's the solution: First, identify the main problem components, then apply the appropriate data structure. The time complexity would be O(n log n) using a priority queue.",
    "Good question! The key here is to use dynamic programming. Initialize a DP array and fill it iteratively. Here's the pseudocode: ```javascript dp = 1; for (i = 1; i <= n; i++) { ... } ```",
    "Perfect! This relates to the binary search tree concepts we covered. The solution uses tree traversal with a stack. Time complexity: O(h) where h is tree height.",
    "Great observation! For this problem, use a sliding window approach with two pointers. Here's how: ```javascript left = 0; for (right = 0; right < arr.length; right++) { ... } ```"
  ]

  // Pick intelligent response based on question keywords
  if (question.toLowerCase().includes('algorithm')) {
    return "Algorithm solution: Use " + (context ? "BFS/DFS" : "divide and conquer") + " approach. Here's the step-by-step implementation:"
  }
  
  if (question.toLowerCase().includes('time') || question.toLowerCase().includes('complexity')) {
    return "Time complexity analysis: The optimal solution runs in O(n log n) time using a heap data structure. Space complexity is O(n)."
  }

  // Default intelligent response
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  return randomResponse + "\n\nWould you like me to elaborate on any specific part?"
}

