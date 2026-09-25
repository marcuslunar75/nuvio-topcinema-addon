// ==========================================
// TopCinema Native Provider for Nuvio
// ==========================================

function getStreams(tmdbId, mediaType, season, episode) {
  var apiKey = "15d2ea6d0da1d01ae46e369316e8b164";
  var media = mediaType === "tv" ? "tv" : "movie";
  var tmdbUrl = "https://api.themoviedb.org/3/" + media + "/" + tmdbId + "?api_key=" + apiKey + "&language=ar-SA";

  return fetch(tmdbUrl)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      var query = data.title || data.name || data.original_title || data.original_name;
      if (!query) return [];

      if (mediaType === "tv" && episode) {
        query += " الحلقة " + episode;
      }

      var searchUrl = "https://topcinema.io/?s=" + encodeURIComponent(query);
      return fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
    })
    .then(function(response) {
      return response ? response.text() : "";
    })
    .then(function(html) {
      if (!html) return [];

      // البحث عن رابط الفيلم أو الحلقة من نتائج البحث
      var match = html.match(/href="(https:\/\/topcinema\.io\/(?:movie|episode|series)\/[^"]+)"/i);
      if (!match) return [];

      var targetPageUrl = match[1];
      return fetch(targetPageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
    })
    .then(function(response) {
      return response ? response.text() : "";
    })
    .then(function(html) {
      if (!html) return [];

      var streams = [];
      var serverRegex = /(?:data-link|data-server|src)="([^"]+(?:embed|watch|player|vidsrc|mixdrop|dood|stream)[^"]*)"/gi;
      var match;
      var index = 1;

      while ((match = serverRegex.exec(html)) !== null) {
        var streamUrl = match[1];
        if (streamUrl.indexOf("//") === 0) {
          streamUrl = "https:" + streamUrl;
        }

        streams.push({
          name: "TopCinema",
          title: "سيرفر TopCinema #" + index,
          url: streamUrl,
          quality: "1080p"
        });
        index++;
      }

      return streams;
    })
    .catch(function(err) {
      console.error("[TopCinema Error]:", err);
      return [];
    });
}

module.exports = { getStreams: getStreams };
