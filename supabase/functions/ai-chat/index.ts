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

    // Using Hugging Face's free inference API with Llama model
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: message,
        parameters: {
          max_length: 100,
          temperature: 0.7,
          do_sample: true,
        }
      }),
    });

    if (!response.ok) {
      // If DialoGPT fails, try with a different free model
      const fallbackResponse = await fetch('https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: message,
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error('AI service temporarily unavailable');
      }

      const fallbackData = await fallbackResponse.json();
      const reply = Array.isArray(fallbackData) ? fallbackData[0]?.generated_text || 'Sorry, I could not process your request.' : 'Sorry, I could not process your request.';
      
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const reply = Array.isArray(data) ? data[0]?.generated_text || 'Hello! How can I help you today?' : 'Hello! How can I help you today?';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      reply: 'Hello! I\'m your AI assistant. I can help you with questions about your medications or general health advice. How can I assist you today?' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});