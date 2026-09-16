import { askAiraBrain } from './ai.js';
import { downloadTikTok, fetchYouTubeMedia } from './downloaders.js';
import { config } from '../config.js';
import { prisma } from '../src/lib/prisma.js';

export async function handleIncomingMessage(sock, m) {
    try {
        if (!m.message || m.key.fromMe) return;

        const senderJid = m.key.remoteJid;
        const isGroup = senderJid.endsWith('@g.us');
        const pushName = m.pushName || "යාළුවා";
        const messageType = Object.keys(m.message)[0];

        // 1. Text Content Extraction
        let body = "";
        if (messageType === 'conversation') {
            body = m.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            body = m.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage' && m.message.imageMessage.caption) {
            body = m.message.imageMessage.caption;
        } else if (messageType === 'videoMessage' && m.message.videoMessage.caption) {
            body = m.message.videoMessage.caption;
        }

        body = (body || "").trim();

        // 2. WhatsApp Status Saver Detection
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;
        const isQuotingStatus = quotedParticipant === 'status@broadcast';

        if (isQuotingStatus || body.toLowerCase() === '.save' || body.toLowerCase() === '!status') {
            if (quotedMsg) {
                await sock.sendMessage(senderJid, { forward: { key: { remoteJid: 'status@broadcast', id: m.message.extendedTextMessage.contextInfo.stanzaId }, message: quotedMsg } });
                await sock.sendMessage(senderJid, { text: "ඔන්න ඔයා ඉල්ලපු Status එක! ✨💖" }, { quoted: m });
                return;
            }
        }

        if (!body) return;

        const prefix = config.prefix;
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : "";
        const args = isCmd ? body.slice(prefix.length + command.length).trim() : body;

        // 3. Optional Prisma Message Logging for Dashboard Stream
        if (prisma?.messageLog) {
            prisma.messageLog.create({
                data: {
                    senderJid,
                    senderName: pushName,
                    message: body,
                    level: isCmd ? 'COMMAND' : 'INFO',
                    latencyMs: 0
                }
            }).catch(() => {});
        }

        // 4. AI Natural Chat Trigger (Mentions "aira" or "අයිරා")
        const lowerBody = body.toLowerCase();
        if (!isCmd && (lowerBody.includes("aira") || lowerBody.includes("අයිරා"))) {
            await sock.sendPresenceUpdate('composing', senderJid);
            const aiReply = await askAiraBrain(body, pushName);
            await sock.sendMessage(senderJid, { text: aiReply }, { quoted: m });
            return;
        }

        // 5. Command Router
        switch (command) {
            case 'menu':
            case 'help': {
                const menu = 
`🌸 *${config.botName} COMMAND HUB* 🌸
👑 *Owner:* ${config.ownerName}

✨ *AI & Conversation:*
• ඕනෑම තැනක *aira* ලියන්න (Auto AI Chat)
• \`${prefix}ai <ප්‍රශ්නය>\` - සෘජුව AI විමසීම

🎵 *Media & Downloader Tools:*
• \`${prefix}song <නම / Link>\` - MP3 Audio Download
• \`${prefix}video <නම / Link>\` - MP4 Video Download
• \`${prefix}tiktok <Link>\` - No Watermark TikTok
• \`${prefix}status\` - Quoted Status Download

👥 *Group Management:*
• \`${prefix}mute\` - Group Mute (Admins only)
• \`${prefix}unmute\` - Group Unmute
• \`${prefix}tagall\` - සියලු සාමාජිකයන් Tag කිරීම

⚡ *Utilities:*
• \`${prefix}ping\` - Bot Response Speed
• \`${prefix}owner\` - Sadew Sunera ගේ තොරතුරු`;

                await sock.sendMessage(senderJid, { text: menu }, { quoted: m });
                break;
            }

            case 'ai': {
                if (!args) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර ප්‍රශ්නයක් ඇතුළත් කරන්න. \nඋදා: \`${prefix}ai Python යනු කුමක්ද?\`` }, { quoted: m });
                    return;
                }
                await sock.sendPresenceUpdate('composing', senderJid);
                const reply = await askAiraBrain(args, pushName);
                await sock.sendMessage(senderJid, { text: reply }, { quoted: m });
                break;
            }

            case 'song': {
                if (!args) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර සින්දුවේ නම හෝ Link එක ලබාදෙන්න! \nඋදා: \`${prefix}song Shape of you\`` }, { quoted: m });
                    return;
                }
                await sock.sendMessage(senderJid, { text: `🎵 *${args}* සොයමින් පවතී... සුළු මොහොතක් රැඳෙන්න!` }, { quoted: m });
                const media = await fetchYouTubeMedia(args, "mp3");
                if (media?.downloadUrl) {
                    await sock.sendMessage(senderJid, { 
                        audio: { url: media.downloadUrl }, 
                        mimetype: 'audio/mp4',
                        fileName: `${media.title}.mp3` 
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(senderJid, { text: "අනේ Audio එක සොයාගැනීමට නොහැකි විය. වෙනත් නමකින් උත්සාහ කරන්න 🥺" }, { quoted: m });
                }
                break;
            }

            case 'video': {
                if (!args) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර වීඩියෝවේ නම හෝ Link එක ලබාදෙන්න!` }, { quoted: m });
                    return;
                }
                await sock.sendMessage(senderJid, { text: `📹 වීඩියෝව සකසමින් පවතී...` }, { quoted: m });
                const media = await fetchYouTubeMedia(args, "mp4");
                if (media?.downloadUrl) {
                    await sock.sendMessage(senderJid, { 
                        video: { url: media.downloadUrl }, 
                        caption: `🎬 *${media.title}*\n_Downloaded via ${config.botName}_` 
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(senderJid, { text: "වීඩියෝව ලබාගැනීමට නොහැකි විය 🥺" }, { quoted: m });
                }
                break;
            }

            case 'tiktok': {
                if (!args || !args.includes('tiktok.com')) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර නිවැරදි TikTok Link එකක් ලබාදෙන්න!` }, { quoted: m });
                    return;
                }
                await sock.sendMessage(senderJid, { text: `📱 TikTok වීඩියෝව බාගත කරමින්...` }, { quoted: m });
                const tiktokData = await downloadTikTok(args);
                if (tiktokData?.videoUrl) {
                    await sock.sendMessage(senderJid, { 
                        video: { url: tiktokData.videoUrl }, 
                        caption: `🎬 *${tiktokData.title}*\n👤 Creator: ${tiktokData.author}` 
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(senderJid, { text: "TikTok වීඩියෝව Download කරගත නොහැකි විය 🥺" }, { quoted: m });
                }
                break;
            }

            case 'ping': {
                const start = Date.now();
                await sock.sendMessage(senderJid, { text: `⚡ Pong! Response Speed: \`${Date.now() - start}ms\`` }, { quoted: m });
                break;
            }

            case 'mute': {
                if (!isGroup) return;
                await sock.groupSettingUpdate(senderJid, 'announcement');
                await sock.sendMessage(senderJid, { text: "🔇 Group එක සාර්ථකව Mute කරන ලදී (Admins Only)!" }, { quoted: m });
                break;
            }

            case 'unmute': {
                if (!isGroup) return;
                await sock.groupSettingUpdate(senderJid, 'not_announcement');
                await sock.sendMessage(senderJid, { text: "🔊 Group එක සාර්ථකව Open කරන ලදී (All Members)!" }, { quoted: m });
                break;
            }

            case 'owner': {
                const info = 
`👑 *Bot Owner & Developer Information:*
• *Owner:* ${config.ownerName}
• *Owner Contact:* +${config.ownerNumber}
• *Bot Engine:* ${config.botName}
• *Status:* 100% Online & Active ✨`;
                await sock.sendMessage(senderJid, { text: info }, { quoted: m });
                break;
            }
        }
    } catch (err) {
        console.error("Handler Error:", err);
    }
}