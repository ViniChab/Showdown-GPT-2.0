import { ChatGptService } from "./src/services/chat-gpt/chat-gpt.service.mjs";
import dotenv from "dotenv";

dotenv.config();

const chatGptService = new ChatGptService();
await chatGptService.startGptService();
await chatGptService.sendMessage("teste");
