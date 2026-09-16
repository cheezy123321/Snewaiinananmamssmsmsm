import axios from 'axios';

// 📱 TikTok Downloader without watermark
export async function downloadTikTok(url) {
    try {
        const res = await axios.post('https://www.tikwm.com/api/', { url }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        if (res.data && res.data.data) {
            return {
                title: res.data.data.title || "TikTok Video",
                videoUrl: res.data.data.play,
                author: res.data.data.author?.nickname || "Unknown"
            };
        }
        return null;
    } catch (err) {
        console.error("TikTok Fetch Error:", err.message);
        return null;
    }
}

// 🎵 Media Query Fetcher (YouTube Audio / Video Fallback Stream)
export async function fetchYouTubeMedia(query, type = "mp3") {
    try {
        const endpoint = type === "mp3"
            ? `https://api.giftedtech.my.id/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(query)}`
            : `https://api.giftedtech.my.id/api/download/ytmp4?apikey=gifted&url=${encodeURIComponent(query)}`;
            
        const res = await axios.get(endpoint, { timeout: 25000 });
        if (res.data && res.data.result) {
            return {
                title: res.data.result.title || "Media",
                downloadUrl: res.data.result.download_url || res.data.result.url
            };
        }
        return null;
    } catch (err) {
        console.error("Media Download API Error:", err.message);
        return null;
    }
}