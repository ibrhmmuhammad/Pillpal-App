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

    // First, try to generate a smart health-related response
    const smartReply = generateIntelligentHealthResponse(message);
    if (smartReply) {
      return new Response(JSON.stringify({ reply: smartReply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try Hugging Face models as backup for general conversation
    const models = [
      'microsoft/DialoGPT-medium',
      'facebook/blenderbot-400M-distill'
    ];

    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: message,
            parameters: {
              max_new_tokens: 100,
              temperature: 0.8,
              do_sample: true,
              return_full_text: false,
              pad_token_id: 50256
            },
            options: {
              wait_for_model: true,
              use_cache: false
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('HF Response:', data);
          
          let reply = '';
          
          if (Array.isArray(data) && data.length > 0) {
            reply = data[0]?.generated_text || '';
          } else if (data.generated_text) {
            reply = data.generated_text;
          }

          if (reply && reply.length > 10) {
            // Clean up the response
            reply = reply.replace(message, '').trim();
            reply = reply.replace(/^[:\-\s]+/, '').trim();
            
            // Add health context to the response
            if (reply.length > 10) {
              return new Response(JSON.stringify({ 
                reply: reply + " Please remember, for specific medical advice, always consult with your healthcare provider." 
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        }
      } catch (modelError) {
        console.error(`Error with model ${model}:`, modelError);
        continue;
      }
    }

    // Final fallback with contextual response
    const fallbackReply = generateContextualResponse(message);
    
    return new Response(JSON.stringify({ reply: fallbackReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    return new Response(JSON.stringify({ 
      reply: 'Hello! I\'m your AI health assistant. I can help answer questions about medications, health tips, and wellness. What would you like to know?' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Intelligent health response generator with detailed medical knowledge
function generateIntelligentHealthResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  // Specific medication questions
  if (lowerMessage.includes('aspirin')) {
    return "Aspirin is commonly used for pain relief, reducing inflammation, and preventing heart attacks. The typical adult dose is 325-650mg every 4 hours for pain, or 81mg daily for heart protection. Always take with food to prevent stomach irritation. Consult your doctor before starting daily aspirin therapy.";
  }
  
  if (lowerMessage.includes('ibuprofen')) {
    return "Ibuprofen (Advil, Motrin) is an anti-inflammatory medication. Adult dose: 200-400mg every 4-6 hours, max 1200mg daily without doctor supervision. Take with food to prevent stomach upset. Avoid if you have kidney problems, heart issues, or stomach ulcers.";
  }
  
  if (lowerMessage.includes('acetaminophen') || lowerMessage.includes('tylenol')) {
    return "Acetaminophen (Tylenol) is safe for most people when used correctly. Adult dose: 325-650mg every 4-6 hours, max 3000mg daily. It's gentler on the stomach than NSAIDs but can be harmful to the liver in high doses. Avoid alcohol when taking acetaminophen.";
  }
  
  // Vitamin questions
  if (lowerMessage.includes('vitamin d')) {
    return "Vitamin D supports bone health and immune function. Most adults need 600-800 IU daily, though many people are deficient. Best sources include sunlight exposure (10-15 minutes daily), fatty fish, and fortified foods. Consider getting blood levels tested to determine if supplementation is needed.";
  }
  
  if (lowerMessage.includes('vitamin c')) {
    return "Vitamin C boosts immune function and aids iron absorption. Adults need 65-90mg daily. Rich sources include citrus fruits, berries, peppers, and leafy greens. While generally safe, very high doses (>1000mg) may cause digestive upset. Your body can only absorb so much at once, so spread intake throughout the day.";
  }
  
  // Health conditions
  if (lowerMessage.includes('blood pressure') || lowerMessage.includes('hypertension')) {
    return "High blood pressure often has no symptoms but increases heart disease risk. Normal is below 120/80 mmHg. Lifestyle changes that help: reduce sodium intake, exercise regularly, maintain healthy weight, limit alcohol, manage stress, and quit smoking. Regular monitoring is important.";
  }
  
  if (lowerMessage.includes('diabetes')) {
    return "Diabetes management involves monitoring blood sugar, eating balanced meals, regular exercise, and medication as prescribed. Key tips: eat consistent meal times, choose complex carbs, monitor portions, stay hydrated, and check feet daily for cuts/sores. Regular A1C testing is crucial.";
  }
  
  if (lowerMessage.includes('headache') || lowerMessage.includes('migraine')) {
    return "For headaches: stay hydrated, get adequate sleep (7-9 hours), manage stress, avoid trigger foods, and maintain regular meal times. Red flags requiring immediate care: sudden severe headache, headache with fever/stiff neck, or headache after head injury.";
  }
  
  // Wellness and lifestyle
  if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia')) {
    return "Good sleep hygiene includes: consistent bedtime/wake time, cool dark room, no screens 1 hour before bed, avoid caffeine after 2pm, regular exercise (but not close to bedtime), and a relaxing bedtime routine. Adults need 7-9 hours nightly.";
  }
  
  if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
    return "Adults should aim for 150 minutes moderate aerobic activity weekly plus 2 days strength training. Start slowly if new to exercise. Good options: walking, swimming, cycling, bodyweight exercises. Always warm up and cool down. Consult your doctor before starting intense exercise programs.";
  }
  
  if (lowerMessage.includes('diet') || lowerMessage.includes('nutrition')) {
    return "A balanced diet includes: 5-9 servings fruits/vegetables daily, whole grains, lean proteins, healthy fats (nuts, olive oil, fish), and plenty of water. Limit processed foods, added sugars, and excessive sodium. Portion control is key - use smaller plates and eat slowly.";
  }
  
  // Common symptoms
  if (lowerMessage.includes('fever')) {
    return "Normal body temperature is around 98.6°F (37°C). Fever is typically 100.4°F (38°C) or higher. For adults: rest, stay hydrated, use acetaminophen or ibuprofen for comfort. Seek immediate care for fever above 103°F, difficulty breathing, severe headache, or persistent vomiting.";
  }
  
  if (lowerMessage.includes('cough') || lowerMessage.includes('cold')) {
    return "For common cold/cough: rest, drink plenty of fluids, use a humidifier, honey for cough (not for children under 1 year), saltwater gargle for sore throat. See a doctor if symptoms worsen after a week, fever above 101.3°F, or difficulty breathing.";
  }
  
  // Drug interactions
  if (lowerMessage.includes('interaction') || lowerMessage.includes('together')) {
    return "Always tell your healthcare providers about ALL medications, supplements, and herbs you take. Common interactions: blood thinners with aspirin, certain antibiotics with birth control, grapefruit with many medications. Use one pharmacy for all prescriptions to help catch interactions.";
  }
  
  // General medication questions
  if (lowerMessage.includes('side effect')) {
    return "Common side effects vary by medication. Always read the patient information leaflet. Report serious side effects to your doctor immediately: allergic reactions (rash, swelling, difficulty breathing), severe nausea/vomiting, unusual bleeding, or significant mood changes.";
  }
  
  if (lowerMessage.includes('when to take') || lowerMessage.includes('timing')) {
    return "Medication timing matters for effectiveness and side effects. 'With food' means during or just after eating. 'On empty stomach' means 1 hour before or 2 hours after eating. Set regular times and use pill organizers or phone reminders to maintain consistency.";
  }
  
  return null; // No specific match found
}

// Contextual response for general queries
function generateContextualResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm your AI health assistant. I can help with medication questions, health tips, nutrition advice, and general wellness information. What would you like to know about today?";
  }
  
  if (lowerMessage.includes('how are you')) {
    return "I'm here and ready to help with your health and medication questions! I can provide information about medications, wellness tips, nutrition advice, and general health guidance. What can I assist you with?";
  }
  
  if (lowerMessage.includes('thank')) {
    return "You're welcome! I'm glad I could help. Remember, while I provide general health information, always consult with your healthcare provider for personalized medical advice. Is there anything else I can help you with?";
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return "I can help you with: medication information and interactions, health and wellness tips, nutrition guidance, common symptom information, exercise advice, and general health questions. I can also help you track your medications using this app. What specific area interests you?";
  }
  
  // Default response for unclear queries
  return "I'm here to help with health and medication questions! I can provide information about medications, wellness tips, nutrition advice, exercise guidance, and general health topics. Could you please be more specific about what you'd like to know?";
}