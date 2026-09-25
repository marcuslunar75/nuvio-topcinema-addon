// ==========================================
// TopCinema Provider for Nuvio App
// ==========================================

const BASE_URL = 'https://topcinema.io';

/**
 * جلب عنوان الفيلم/المسلسل باستخدام TMDB API
 */
async function getMediaTitle(tmdbId, mediaType) {
  try {
    // يمكن استخدام المفتاح الخاص بك أو الاعتماد على العنوان الممرر
    const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=15d2ea6d0da1d01ae46e369316e8b164&language=ar-SA`);
    const data = await response.json();
    return data.title || data.name || data.original_title || data.original_name;
  } catch (err) {
    console.error('[TopCinema] TMDB Fetch Error:', err);
    return null;
  }
}

/**
 * البحث في موقع TopCinema عن الرابط الخاص بالفيلم أو الحلقة
 */
async function searchTopCinema(query) {
  try {
    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();

    // البحث عن روابط الأفلام/المسلسلات في نتائج البحث عبر Regex
    const linkRegex = /href="(https:\/\/topcinema\.io\/(?:movie|episode|series)\/[^"]+)"/gi;
    const matches = [...html.matchAll(linkRegex)];

    if (matches.length > 0) {
      return matches[0][1]; // إرجاع النتيجة الأولى الأكثر تطابقاً
    }
    return null;
  } catch (err) {
    console.error('[TopCinema] Search Error:', err);
    return null;
  }
}

/**
 * استخراج روابط السيرفرات من صفحة العرض
 */
async function extractStreams(pageUrl) {
  const streams = [];
  try {
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await response.text();

    // استخراج سيرفرات المشاهدة المضمنة في HTML (مثل data-link أو iframes)
    const serverRegex = /(?:data-link|data-server|src)="([^"]+(?:embed|watch|player|vidsrc|mixdrop|dood|stream)[^"]*)"/gi;
    let match;
    let serverIndex = 1;

    while ((match = serverRegex.exec(html)) !== null) {
      let streamUrl = match[1];
      if (streamUrl.startsWith('//')) {
        streamUrl = 'https:' + streamUrl;
      }

      streams.push({
        name: 'TopCinema',
        title: `سيرفر TopCinema #${serverIndex}`,
        url: streamUrl,
        quality: '1080p',
        behaviorHints: {
          notSupported: false
        }
      });
      serverIndex++;
    }
  } catch (err) {
    console.error('[TopCinema] Extraction Error:', err);
  }
  return streams;
}

/**
 * الدالة الرئيسية المستدعاة بواسطة تطبيق Nuvio
 */
function getStreams(tmdbId, mediaType, season, episode) {
  return getMediaTitle(tmdbId, mediaType)
    .then(title => {
      if (!title) return [];
      
      let searchQuery = title;
      if (mediaType === 'tv' && season && episode) {
        searchQuery += ` الحلقة ${episode}`;
      }

      return searchTopCinema(searchQuery);
    })
    .then(pageUrl => {
      if (!pageUrl) return [];
      return extractStreams(pageUrl);
    })
    .catch(error => {
      console.error('[TopCinema] Main Error:', error);
      return [];
    });
}

module.exports = { getStreams };
