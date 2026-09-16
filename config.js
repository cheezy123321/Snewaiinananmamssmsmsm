import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // 🤖 Bot Profile Settings (Configured for Sadew Sunera)
    botName: process.env.BOT_NAME || "Aira 💗",
    ownerName: process.env.OWNER_NAME || "Sadew Sunera",
    ownerNumber: process.env.OWNER_NUMBER || "94769162583", // ඔයාගේ WhatsApp අංකය මෙතනට හෝ .env එකට ලබාදෙන්න
    prefix: process.env.PREFIX || ".",

    // 🔑 ASITHA-MD Session ID Configuration
    sessionId: process.env.SESSION_ID || "",
    
    // 📱 Phone Pairing Code Mode (Session ID නොමැති විට පමණක් භාවිතා වේ)
    phoneNumber: process.env.PHONE_NUMBER || "94769162583",
    usePairingCode: process.env.USE_PAIRING_CODE !== "false",

    // 🧠 AI Engine Configuration
    aiApiKey: process.env.AI_API_KEY || "YOUR_AI_API_KEY",
    aiApiUrl: process.env.AI_API_URL || "https://api.asitha.top/v1/chat/completions",
    aiModel: process.env.AI_MODEL || "gpt-4o-mini",

    // ⚙️ Automation Preferences
    autoReadStatus: process.env.AUTO_READ_STATUS !== "false",
    autoReactStatus: process.env.AUTO_REACT_STATUS !== "false",
    statusEmojis: ["❤️", "💗", "🩵", "💗", "💙", "💕", "💜"]
};