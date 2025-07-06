const fs = require("fs");
const Parser = require("rss-parser");
const parser = new Parser();

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function formatGMTDate(gmtString) {
  const date = new Date(gmtString);

  if (isNaN(date.getTime())) {
    return "无效日期";
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

function getCdnUrlFromProxy(proxyUrl) {
  try {
    const url = new URL(proxyUrl);
    const uriParam = url.searchParams.get("uri");
    return uriParam ? decodeURIComponent(uriParam) : null;
  } catch {
    return null;
  }
}

// 从RSS内容中提取缩略
function extractThumbnail(item) {
  if (item.enclosure?.url) return item.enclosure.url;

  // 尝试从内容中提取第一个图片
  const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];

  return null;
}

async function updateReadme() {
  try {
    console.log("Fetching RSS feed...");
    const feed = await parser.parseURL("https://baiwumm.com/rss.xml");

    let svgCards = "";
    feed.items.slice(0, 5).forEach((item) => {
      // 转义所有文本内容
      const safeTitle = escapeXml(item.title || "无标题");
      const safeDescription = escapeXml(item.contentSnippet || item.description || "无描述内容");
      const safeDate = formatGMTDate(escapeXml(item.pubDate || new Date().toISOString()));
      const safeUrl = escapeXml(item.link || "#");
      const safeThumbnail = escapeXml(getCdnUrlFromProxy(extractThumbnail(item)) || "https://picsum.photos/300/200");
      svgCards += `
<svg fill="none" width="100%" height="100%" viewBox="0 0 1000 140" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: sans-serif;
        }
        @keyframes gradientBackground {
          0% {
            background-position-x: 0%;
          }
          100% {
            background-position-x: 100%;
          }
        }
        .flex {
          display: flex;
          align-items: center;
          width: 100%;
          height: 100%;
        }
        .outer-container {
          width: 100%;
          height: 100%;
          min-height: 140px;
        }
        .container {
          height: 100%;
          width: 100%;
          border: 1px solid rgba(0,0,0,.2);
          padding: 10px 20px;
          border-radius: 10px;
          background: rgb(255,255,255);
          background: linear-gradient(60deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 47%, rgba(246,246,246,1) 50%, rgba(255,255,255,1) 53%, rgba(255,255,255,1) 100%);
          background-size: 600% 400%;
          animation: gradientBackground 3s ease infinite;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        img {
          margin-right: 10px;
          width: 150px;
          height: 100%;
          min-height: 98px;
          object-fit: cover;
        }
        .right {
          flex: 1;
          min-width: 0;
        }
        a {
          text-decoration: none;
          color: inherit;
        }
        p {
          line-height: 1.5;
          color: #555;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        h3 {
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        small {
          color: #888;
          display: block;
          margin-top: 5px;
          margin-bottom: 8px;
        }
      </style>
      <div class="outer-container flex">
        <a class="container flex" href="${safeUrl}" target="_blank">
          <img src="${safeThumbnail}"/>
          <div class="right">
            <h3>${safeTitle}</h3>
            <small>${safeDate}</small>
            <p>${safeDescription}</p>
          </div>
        </a>
      </div>
    </div>
  </foreignObject>
</svg>\n\n`;
    });

    const readme = fs.readFileSync("README.md", "utf8");
    const updatedReadme = readme.replace(
      /<!-- RSS_CARDS_START -->[\s\S]*?<!-- RSS_CARDS_END -->/,
      `<!-- RSS_CARDS_START -->\n${svgCards}\n<!-- RSS_CARDS_END -->`
    );

    fs.writeFileSync("README.md", updatedReadme);
    console.log("README.md updated successfully!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updateReadme();
