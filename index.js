import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Partials,
  AttachmentBuilder
} from "discord.js";
import { askGemini, createImage } from "./gemini.js";

const required = ["DISCORD_TOKEN", "GEMINI_API_KEY"];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`Thiếu biến môi trường: ${missing.join(", ")}`);
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

const histories = new Map();
const MAX_TURNS = Math.max(2, Number(process.env.MAX_HISTORY_TURNS || 12));
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function splitMessage(text, limit = 1900) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > limit) {
    let cut = remaining.lastIndexOf("\n", limit);
    if (cut < limit * 0.5) cut = limit;
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

async function downloadImage(attachment) {
  if (!IMAGE_TYPES.has(attachment.contentType || "")) return null;
  if (attachment.size > MAX_IMAGE_BYTES) return null;

  const response = await fetch(attachment.url);
  if (!response.ok) throw new Error("Không tải được ảnh đính kèm.");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) return null;

  return {
    inlineData: {
      mimeType: attachment.contentType,
      data: buffer.toString("base64")
    }
  };
}

function isImageRequest(text) {
  return /\b(tạo ảnh|vẽ ảnh|generate image|create an image|draw an image)\b/i.test(text);
}

client.once("ready", () => {
  console.log(`Đã đăng nhập Discord bằng ${client.user.tag}`);
  client.user.setActivity("Tag tôi để trò chuyện ✨");
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const botWasMentioned = message.mentions.users.has(client.user.id);
  const isReplyToBot = message.reference?.messageId
    ? await message.channel.messages.fetch(message.reference.messageId).then(m => m.author.id === client.user.id).catch(() => false)
    : false;

  // Chỉ bắt đầu hội thoại khi được tag; có thể tiếp tục bằng cách reply tin nhắn của bot.
  if (!botWasMentioned && !isReplyToBot) return;

  let prompt = message.content
    .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
    .trim();

  const key = `${message.channelId}:${message.author.id}`;
  const history = histories.get(key) || [];

  await message.channel.sendTyping();

  try {
    // Yêu cầu tạo ảnh: bot tạo ảnh rồi gửi file PNG/JPEG trực tiếp.
    if (isImageRequest(prompt)) {
      const image = await createImage(prompt);
      const extension = image.mimeType.includes("jpeg") ? "jpg" : "png";
      const file = new AttachmentBuilder(image.buffer, { name: `anh-ai.${extension}` });
      await message.reply({ content: "Đây là ảnh AI vừa tạo nè ✨", files: [file] });
      return;
    }

    const imageParts = [];
    for (const attachment of message.attachments.values()) {
      const part = await downloadImage(attachment);
      if (part) imageParts.push(part);
    }

    const answer = await askGemini(history, prompt, imageParts);

    history.push({ role: "user", parts: [{ text: prompt || "Hãy xem ảnh tôi gửi." }] });
    history.push({ role: "model", parts: [{ text: answer }] });
    while (history.length > MAX_TURNS * 2) history.splice(0, 2);
    histories.set(key, history);

    const chunks = splitMessage(answer);
    for (let i = 0; i < chunks.length; i++) {
      if (i === 0) await message.reply(chunks[i]);
      else await message.channel.send(chunks[i]);
    }
  } catch (error) {
    console.error(error);
    const messageText = error.message?.includes("429")
      ? "AI đang quá tải hoặc đã chạm giới hạn sử dụng. Thử lại sau nhé."
      : `Có lỗi khi xử lý: ${error.message || "lỗi không xác định"}`;
    await message.reply(messageText.slice(0, 1900)).catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);
