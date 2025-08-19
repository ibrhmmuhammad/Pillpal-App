import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Processing message:', message);

    // Try multiple open source models for better reliability
    const models = [
      'microsoft/DialoGPT-medium',
      'facebook/blenderbot-400M-distill', 
      'microsoft/DialoGPT-small'
    ];

    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            inputs: message,
            parameters: {
              max_new_tokens: 150,
              temperature: 0.7,
              do_sample: true,
              return_full_text: false
            },
            options: {
              wait_for_model: true
            }
          }),
        });

        console.log(`Response status for ${model}:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Response data:', data);
          
          let reply = '';
          
          if (Array.isArray(data) && data.length > 0) {
            if (data[0].generated_text) {
              reply = data[0].generated_text.trim();
            } else if (data[0].text) {
              reply = data[0].text.trim();
            }
          } else if (data.generated_text) {
            reply = data.generated_text.trim();
          }

          // Clean up the reply
          if (reply && reply.length > 0) {
            // Remove the input message from the response if it's included
            reply = reply.replace(message, '').trim();
            
            // If reply is still empty or too short, generate a helpful response
            if (!reply || reply.length < 10) {
              reply = generateHealthResponse(message);
            }

            return new Response(JSON.stringify({ reply }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (modelError) {
        console.error(`Error with model ${model}:`, modelError);
        continue; // Try next model
      }
    }

    // If all models fail, return a helpful health-related response
    const fallbackReply = generateHealthResponse(message);
    
    return new Response(JSON.stringify({ reply: fallbackReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    return new Response(JSON.stringify({ 
      reply: 'Hello! I\'m your AI health assistant. I can help you with questions about medications, health tips, or general wellness advice. How can I help you today?' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to generate contextual health responses
function generateHealthResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Medication-related keywords
  if (lowerMessage.includes('medication') || lowerMessage.includes('medicine') || lowerMessage.includes('pill') || lowerMessage.includes('drug')) {
    return "I can help you with medication information! Please remember to always consult with your healthcare provider for personalized medical advice. What specific medication questions do you have?";
  }
  
  // Health symptoms
  if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('sick')) {
    return "I understand you're experiencing discomfort. While I can provide general health information, it's important to consult with a healthcare professional for proper diagnosis and treatment. Is there general health information I can help you with?";
  }
  
  // Wellness topics
  if (lowerMessage.includes('exercise') || lowerMessage.includes('diet') || lowerMessage.includes('sleep') || lowerMessage.includes('wellness')) {
    return "Great question about wellness! I'd be happy to share some general health tips. Regular exercise, balanced nutrition, and adequate sleep are key pillars of good health. What specific aspect would you like to know more about?";
  }
  
  // Emergency keywords
  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('911')) {
    return "If this is a medical emergency, please call 911 or your local emergency services immediately. I'm here for general health information and medication tracking support.";
  }
  
  // General greeting or unclear message
  return "Hello! I'm your AI health assistant. I can help you with general health information, medication reminders, and wellness tips. What would you like to know about today?";
}