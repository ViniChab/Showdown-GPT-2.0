import fs from "fs";

export class PuppeteerService {
  constructor() {
    console.log("### PUPPETEER SERVICE STARTED");
  }

  async waitForTimeout(timeout, page) {
    if (page) {
      await this.screenshot(page);
    }

    await new Promise((r) => setTimeout(r, timeout));

    if (page) {
      await this.screenshot(page);
    }
  }

  async screenshot(page) {
    await page.screenshot({ path: "screenshot.png" });
  }

  async clickUsingCss(page, selector) {
    await this.screenshot();

    const button = await page.waitForSelector(selector);
    await button.click();

    await this.screenshot();
  }

  async typeUsingCss(page, selector, text) {
    await this.screenshot();

    const input = await page.waitForSelector(selector);
    await input.type(text);

    await this.screenshot();
  }

  async clickOnXpathButton(page, selector) {
    await this.screenshot();

    let success = false;

    while (!success) {
      try {
        await page.evaluate((text) => {
          /** @type { any } */
          const button = document.evaluate(
            `//button[text()="${text}"]`,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;

          button.click();
        }, selector);

        success = true;
      } catch {}
    }

    await this.screenshot();
  }

  async saveSession(page, filePath) {
    const cookies = await page.cookies();
    const cookiesString = JSON.stringify(cookies);

    const sessionStorage = await page.evaluate(() => {
      return JSON.stringify(window.sessionStorage);
    });

    const localStorage = await page.evaluate(() => {
      return JSON.stringify(window.localStorage);
    });

    fs.writeFileSync(
      filePath,
      JSON.stringify({
        cookies: cookiesString,
        sessionStorage,
        localStorage,
      })
    );
  }

  async restoreSession(page, filePath) {
    /** @type { string } */
    const sessionData = fs.readFileSync(filePath, "utf8");
    if (!sessionData) {
      return;
    }

    /** @type { { cookies: string, sessionStorage: string, localStorage: string } } */
    const parsedSessionData = JSON.parse(sessionData);

    const cookies = JSON.parse(parsedSessionData.cookies);
    await page.setCookie(...cookies);

    await page.evaluate((sessionStorageData) => {
      window.sessionStorage.clear();
      const parsedData = JSON.parse(sessionStorageData);

      for (let key in parsedData) {
        window.sessionStorage.setItem(key, parsedData[key]);
      }
    }, parsedSessionData.sessionStorage);

    await page.evaluate((localStorageData) => {
      window.localStorage.clear();
      const parsedData = JSON.parse(localStorageData);

      for (let key in parsedData) {
        window.localStorage.setItem(key, parsedData[key]);
      }
    }, parsedSessionData.localStorage);
  }
}
