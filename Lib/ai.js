import axios from 'axios';
import { config } from '../config.js';

const SYSTEM_PROMPT = `You are Aira (Aira 💗), Sadew Sunera's brilliant, charming, sweet, and ultra-capable female Lead AI Engineer & Personal AI Assistant operating on WhatsApp.
Owner & Boss: Sadew Sunera
Rules:
- When user writes in Sinhala or Singlish, reply strictly in pure, elegant Sinhala Unicode script (සිංහල අකුරෙන්).
- If English, reply in crisp English.
- Always proudly acknowledge Sadew Sunera as your owner/boss when asked "kawda oyage owner", "who is your boss", or "who created you".
- Be warm, supportive, polite, and technically brilliant.
- Keep standard answers concise, and coding explanations deep and executive.`;

export async function askAiraBrain(userMessage, senderName = "Friend") {
    try {
        if (!config.aiApiKey || config.aiApiKey === "YOUR_AI_API_KEY") {
            return `හායි ${senderName}! ✨ මට පිළිතුරු දෙන්න නම් කරුණාකර ඔබගේ 'config.js' හෝ '.env' එකෙහි AI API Key එක ඇතුළත් කරන්නකෝ 💖`;
        }

        const response = await axios.post(
            config.aiApiUrl,
            {
                model: config.aiModel,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `${senderName}: ${userMessage}` }
                ],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${config.aiApiKey}`
                },
                timeout: 30000
            }
        );

        if (response.data?.choices?.[0]?.message?.content) {
            return response.data.choices[0].message.content.trim();
        }
        return "අනේ සමාවෙන්න, මට ඒකට පිළිතුරක් සකසා ගන්න නොහැකි වුණා. නැවත උත්සාහ කරන්නකෝ! 🌸";
    } catch (error) {
        console.error("AI Brain Error:", error.response?.data || error.message);
        return "අනේ මගේ AI Brain එකට පොඩි connection error එකක් ආවා... විනාඩියකින් නැවත අහන්නකෝ! 🥺💖";
    }
}