import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config(); // 加载 .env

const GIST_ID = "affd7cb848230b61febf54339a26bfae"; // 从 Secrets 读取
const TOKEN = process.env.GH_TOKEN; // 从 Secrets 读取

async function getHitokoto() {
  const res = await fetch("https://v1.hitokoto.cn/?encode=text");
  return await res.text();
}

async function updateGist(content) {
  const url = `https://api.github.com/gists/${GIST_ID}`;
  const body = {
    files: {
      "🌱 Daily Quote": { content },
    },
  };

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `token ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (res.ok) {
    console.log("✅ Gist 更新成功:", data.html_url);
  } else {
    console.error("❌ 更新失败:", data);
  }
}

(async () => {
  try {
    const hitokoto = await getHitokoto();
    await updateGist(hitokoto);
  } catch (err) {
    console.error(err);
  }
})();
