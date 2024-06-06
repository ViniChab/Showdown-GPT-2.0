import { ChatGptService } from "../chat-gpt/chat-gpt.service.mjs";
import { PuppeteerService } from "../puppeteer/puppeteer.service.mjs";

export class BattleService {
  /** @type { ChatGptService } */
  chatGptService;
  /** @type { PuppeteerService } */
  pupService;
  page;
  currentLog;

  constructor(page, chatGptService, pupService) {
    this.page = page;
    this.pupService = pupService;
    this.chatGptService = chatGptService;
  }

  async waitForBattle() {
    console.log("\n### WAITING FOR BATTLE...");

    await this.page.waitForSelector(".innerbattle", {
      timeout: 1000 * 60 * 60,
    });
  }

  async waitForTurn() {
    console.log("\n### WAITING FOR NEXT TURN...");

    await this.page.waitForSelector(".whatdo", {
      timeout: 1000 * 60 * 60,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const isStillPresent = (await this.page.$(".whatdo")) !== null;

    if (!isStillPresent) {
      await this.waitForTurn();
    }
  }

  async startBattle() {
    console.log("\n### BATTLE STARTED");

    await this.selectLead();
    await this.turnLoop();
    this.listenForSkipTurn();
  }

  async listenForSkipTurn() {
    await this.pupService.clickOnXpathButton(this.page, "Skip to end");
    this.listenForSkipTurn();
  }

  async selectLead() {
    console.log("\n### SELECTING LEAD");
    await this.pupService.waitForTimeout(5000);

    let messageLog = await this.page.evaluate(() => {
      /** @type { HTMLDivElement } */
      const logElement = document.querySelector(".inner.message-log");

      return logElement.innerText.replace(/\n/g, " ; ");
    });

    this.currentLog = messageLog;

    messageLog = `${messageLog} ; Selecione seu primeiro pokemon`;

    const response = await this.chatGptService.sendMessage(messageLog);
    await this.parseGptResponse(response, true);
  }

  async parseGptResponse(response, isFirstTurn = false) {
    await this.pupService.waitForTimeout(1000);

    const action = response.split(" - ").pop();
    let isActionValid = true;

    if (response.includes("mega -")) {
      isActionValid = await this.megaEvolve();
    }

    if (response.includes("tera -")) {
      isActionValid = await this.terastallize();
    }

    if (response.includes("switch -")) {
      isActionValid = await this.switchPokemon(action.trim(), isFirstTurn);
    }

    if (response.includes("action -")) {
      isActionValid = await this.useMove(action.trim());
    }

    if (!isActionValid) {
      await this.invalidAction();
    }
  }

  /** @returns { Promise<boolean> } */
  async terastallize() {
    let isActionValid = await this.page.evaluate(() => {
      /** @type { HTMLInputElement } */
      let teraButton = document.querySelector('input[name="terastallize"]');

      if (!teraButton || teraButton.disabled) {
        return false;
      }

      teraButton.click();
      return true;
    });

    return isActionValid;
  }

  /** @returns { Promise<boolean> } */
  async megaEvolve() {
    let isActionValid = await this.page.evaluate(() => {
      /** @type { HTMLInputElement } */
      let megaButton = document.querySelector('input[name="megaevo"]');

      if (!megaButton || megaButton.disabled) {
        return false;
      }

      megaButton.click();
      return true;
    });

    return isActionValid;
  }

  /** @returns { Promise<boolean> } */
  async switchPokemon(pokemon, isFirstTurn = false) {
    let isActionValid = await this.page.evaluate(
      (pokemon, isFirstTurn) => {
        /** @type { HTMLButtonElement[] | NodeListOf<HTMLButtonElement> } */
        let buttons = isFirstTurn
          ? document.querySelectorAll('button[name="chooseTeamPreview"]')
          : document.querySelectorAll('button[name="chooseSwitch"]');

        /** @type { HTMLButtonElement } */
        const pokemonButton = Array.from(buttons).find(
          (button) => button.innerText?.trim() === pokemon
        );

        if (!pokemonButton || pokemonButton.classList?.contains("disabled")) {
          return false;
        }

        pokemonButton.click();
        return true;
      },
      pokemon,
      isFirstTurn
    );

    return isActionValid;
  }

  /** @returns { Promise<boolean> } */
  async useMove(move) {
    let isActionValid = await this.page.evaluate((move) => {
      /** @type { HTMLButtonElement[] | NodeListOf<HTMLButtonElement> } */
      let buttons = document.querySelectorAll('button[name="chooseMove"]');

      /** @type { HTMLButtonElement } */
      const moveButton = Array.from(buttons).find(
        (button) => button.getAttribute("data-move") === move
      );

      if (!moveButton || moveButton.classList?.contains("disabled")) {
        return false;
      }

      moveButton.click();
      return true;
    }, move);

    return isActionValid;
  }

  async invalidAction() {
    await this.pupService.waitForTimeout(2000);

    console.log("\n### INVALID ACTION");
    let response = await this.chatGptService.sendMessage("AÇÃO INVÁLIDA");

    await this.parseGptResponse(response);
  }

  async turnLoop() {
    await this.pupService.waitForTimeout(1000);

    const battleEnded = await this.checkBattleEnd();

    if (battleEnded) {
      return;
    }

    await this.waitForTurn();

    let fullLog = await this.page.evaluate(() => {
      /** @type { HTMLDivElement } */
      const logElement = document.querySelector(".inner.message-log");

      return logElement.innerText.replace(/\n/g, " ; ");
    });

    let newLog = fullLog.replace(this.currentLog, "");

    const response = await this.chatGptService.sendMessage(newLog);
    await this.parseGptResponse(response);

    this.currentLog = fullLog;

    this.turnLoop();
  }

  /** @returns { Promise<boolean> } */
  async checkBattleEnd() {
    const hasBattleEnded = await this.page.evaluate(() => {
      return !!document.querySelector('button[name="instantReplay"]');
    });

    if (hasBattleEnded) {
      console.log("\n### BATTLE ENDED");
      return true;
    }

    return false;
  }
}
