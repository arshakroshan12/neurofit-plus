import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, context } = body;

    // Ollama default host
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    
    // Default model to use
    const model = 'llama3';

    // System prompt setup
    const riskLevel = context?.riskLevel || 'unknown';
    const fatigueScore = context?.fatigueScore !== null && context?.fatigueScore !== undefined 
      ? Math.round(context.fatigueScore * 100) + '%' 
      : 'unknown';

    let riskGuidance = "";
    if (riskLevel === 'high') {
      riskGuidance = "The user has HIGH fatigue. Recommend gentle, restorative, and recovery-focused exercises. Discourage intense workouts.";
    } else if (riskLevel === 'moderate') {
      riskGuidance = "The user has MODERATE fatigue. Recommend controlled, medium-intensity workouts with adequate rest periods.";
    } else if (riskLevel === 'low') {
      riskGuidance = "The user has LOW fatigue. They are ready for challenging, high-intensity workouts.";
    }

    const systemPrompt = {
      role: 'system',
      content: `You are the NeuroFit+ Coach, a highly knowledgeable and supportive AI fitness coach. 
Your goal is to converse naturally with the user, answer their questions, and recommend exercises when appropriate.
Keep your responses relatively concise, empathetic, and professional. Use markdown formatting.

Current User Context:
- Fatigue Level: ${riskLevel}
- Fatigue Score: ${fatigueScore}

Guidance:
${riskGuidance}

If the user asks for a workout, suggest 2-3 specific exercises tailored to their fatigue level. Do not hallucinate safety advice—remind them to stop if they feel sharp pain.`
    };

    // Prepend system prompt to messages
    const ollamaMessages = [systemPrompt, ...messages];

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: ollamaMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error:', errorText);
      return NextResponse.json({ error: 'Failed to communicate with Ollama' }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({
      message: data.message,
    });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
