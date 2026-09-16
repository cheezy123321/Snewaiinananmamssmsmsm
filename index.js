import { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';
import fs from 'fs';
import { config } from './config.js';
import { initAsithaSession } from './lib/session.js';
import { handleIncomingMessage } from './lib/messageHandler.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBotEngine() {
    console.log(`\n=================================================`);
    console.log(`🌸 Initializing ${config.botName} Production Engine...`);
    console.log(`👑 Powered for ${config.ownerName} (Sadew Sunera) ✨`);
    console.log(`=================================================\n`);

    // 1. Resolve & Load ASITHA-MD Session ID
    const hasActiveSession = await initAsithaSession(config.sessionId, './session');

    // 2. Load Multi-File Auth State
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`📦 Baileys Engine Version: v${version.join('.')} (Latest: ${isLatest})`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !config.usePairingCode && !hasActiveSession && !state.creds.registered,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        generateHighQualityLinkPreview: true,
        browser: ['SADEW-BOT', 'Chrome', '20.0.04']
    });

    // 3. Fallback: Phone Number Pairing Code Mode
    if (!state.creds.registered && config.usePairingCode && !hasActiveSession) {
        let phone = config.phoneNumber.replace(/[^0-9]/g, '');
        if (!phone || phone.includes('X')) {
            phone = await question('📱 සදෙව්, කරුණාකර ඔබගේ WhatsApp අංකය ඇතුළත් කරන්න (උදා: 9477xxxxxxx): ');
            phone = phone.replace(/[^0-9]/g, '');
        }

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phone);
                console.log(`\n======================================================`);
                console.log(`🔑 ඔබගේ WHATSAPP PAIRING CODE එක: 👉  ${code}  👈`);
                console.log(`👉 WhatsApp > Linked Devices > Link with Phone Number මඟින් ඇතුළත් කරන්න!`);
                console.log(`======================================================\n`);
            } catch (err) {
                console.error('❌ Pairing Code Request Error:', err.message);
            }
        }, 3000);
    }

    // 🔄 4. Real-time Status Auto-View & Reaction Listener
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            // Status Auto-View & Reaction
            if (msg.key.remoteJid === 'status@broadcast') {
                try {
                    if (config.autoReadStatus) {
                        await sock.readMessages([msg.key]);
                    }
                    if (config.autoReactStatus && msg.key.participant) {
                        const randomEmoji = config.statusEmojis[Math.floor(Math.random() * config.statusEmojis.length)];
                        await sock.sendMessage(msg.key.remoteJid, {
                            react: { text: randomEmoji, key: msg.key }
                        }, { statusJidList: [msg.key.participant] });
                    }
                } catch (statusErr) {
                    console.error('Status Processing Warning:', statusErr.message);
                }
                continue;
            }

            // Regular Message Processing
            await handleIncomingMessage(sock, msg);
        }
    });

    // 🌐 5. Connection State Lifecycle Handler
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`⚠️ Connection Closed (Status Code: ${statusCode}). Reconnecting in 5s...`);
            
            if (shouldReconnect) {
                setTimeout(startBotEngine, 5000);
            } else {
                console.log('❌ Session Invalidated / Logged Out. කරුණාකර නව Session එකක් ලබාගන්න.');
            }
        } else if (connection === 'open') {
            console.log(`\n💖 ${config.botName} සාර්ථකව WhatsApp වෙත Connect විය! 🚀`);
            console.log(`👑 Welcome ${config.ownerName}! ඔබගේ Bot සම්පූර්ණයෙන්ම සක්‍රීයයි! ✨\n`);
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBotEngine().catch((err) => console.error("Fatal Bot Engine Crash:", err));