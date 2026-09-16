import fs from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * ASITHA-MD Session Resolver Engine
 * Decodes or fetches creds.json from ASITHA-MD Session ID string
 */
export async function initAsithaSession(sessionId, sessionDir = './session') {
    try {
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        const credsPath = path.join(sessionDir, 'creds.json');

        // 1. creds.json දැනටමත් පවතී නම් එය භාවිතා කරන්න
        if (fs.existsSync(credsPath)) {
            const stats = fs.statSync(credsPath);
            if (stats.size > 50) {
                console.log('✅ Local creds.json file detected. Skipping session download.');
                return true;
            }
        }

        // 2. Session ID එකක් ලබාදී නොමැති නම් Pairing Code වෙත මාරු වන්න
        if (!sessionId || sessionId.trim() === "") {
            console.log('ℹ️ No SESSION_ID provided. Falling back to Pairing Code mode.');
            return false;
        }

        console.log('🔄 Resolving ASITHA-MD Session ID...');
        let cleanedSession = sessionId.trim();

        // Remove ASITHA-MD prefixes
        if (cleanedSession.startsWith('ASITHA-MD~')) {
            cleanedSession = cleanedSession.replace('ASITHA-MD~', '');
        } else if (cleanedSession.startsWith('ASITHA-MD;;;')) {
            cleanedSession = cleanedSession.replace('ASITHA-MD;;;', '');
        }

        let credsContent = "";

        // Case A: Cloud Pastebin / Session Server Fetch (if session is a short ID or URL)
        if (cleanedSession.startsWith('http://') || cleanedSession.startsWith('https://')) {
            const res = await axios.get(cleanedSession, { timeout: 15000 });
            credsContent = typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : res.data;
        } 
        // Case B: Base64 Encoded Session String
        else {
            try {
                const decoded = Buffer.from(cleanedSession, 'base64').toString('utf-8');
                // Check if valid JSON
                JSON.parse(decoded);
                credsContent = decoded;
            } catch (b64Err) {
                // If not raw base64, attempt fetching from official Asitha Session Server
                console.log('🌐 Fetching credentials from Asitha Session Cloud...');
                const cloudUrl = `https://session.asitha.top/session/${cleanedSession}`;
                try {
                    const res = await axios.get(cloudUrl, { timeout: 15000 });
                    credsContent = typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : res.data;
                } catch {
                    // Fallback to pastebin raw
                    const pasteUrl = `https://pastebin.com/raw/${cleanedSession}`;
                    const pasteRes = await axios.get(pasteUrl, { timeout: 15000 });
                    credsContent = typeof pasteRes.data === 'object' ? JSON.stringify(pasteRes.data, null, 2) : pasteRes.data;
                }
            }
        }

        // Validate JSON before writing
        if (credsContent) {
            JSON.parse(credsContent);
            fs.writeFileSync(credsPath, credsContent, 'utf-8');
            console.log('✨ ASITHA-MD Session successfully restored to ./session/creds.json!');
            return true;
        } else {
            console.error('❌ Could not parse valid credentials from Session ID.');
            return false;
        }
    } catch (error) {
        console.error('❌ Error initializing ASITHA-MD Session:', error.message);
        return false;
    }
}