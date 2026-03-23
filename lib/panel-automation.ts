import chromium from '@sparticuz/chromium';
import puppeteer, { type Page } from 'puppeteer-core';

export type PanelAutomationAction = 'inspect' | 'refresh';

interface PanelAutomationTarget {
  email: string;
  username?: string;
}

interface PanelAutomationConfig {
  panelUrl: string;
  username: string;
  password: string;
  headless: boolean;
  selectors: {
    usernameInput: string;
    passwordInput: string;
    submitButton: string;
    postLoginReady: string;
    userSearchInput: string;
    userSearchButton?: string;
    userRow: string;
    userRowEmail?: string;
    userRowUsername?: string;
    openUserButton?: string;
    detailReady?: string;
    statusField?: string;
    expiryField?: string;
    packageField?: string;
    refreshButton?: string;
  };
}

export interface PanelAutomationResult {
  ok: boolean;
  message: string;
  inspectedAt: string;
  data?: {
    matchedBy: 'email' | 'username';
    status?: string;
    expiresAt?: string;
    packageName?: string;
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} tanımlı değil. Panel otomasyonu için Railway/Vercel ortam değişkenlerini tamamlayın.`);
  }
  return value;
}

function loadConfig(): PanelAutomationConfig {
  const rawSelectors = requireEnv('PANEL_AUTOMATION_SELECTORS');
  let selectors: PanelAutomationConfig['selectors'];

  try {
    selectors = JSON.parse(rawSelectors) as PanelAutomationConfig['selectors'];
  } catch {
    throw new Error('PANEL_AUTOMATION_SELECTORS geçerli bir JSON olmalı.');
  }

  return {
    panelUrl: requireEnv('PANEL_AUTOMATION_URL'),
    username: requireEnv('PANEL_AUTOMATION_USERNAME'),
    password: requireEnv('PANEL_AUTOMATION_PASSWORD'),
    headless: process.env.PANEL_AUTOMATION_HEADLESS !== 'false',
    selectors,
  };
}

async function getBrowser(headless: boolean) {
  const executablePath = await chromium.executablePath();
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1440, height: 900 },
    executablePath,
    headless,
  });
}

async function getTextBySelector(page: Page, selector?: string) {
  if (!selector) return undefined;
  const handle = await page.$(selector);
  if (!handle) return undefined;
  return page.$eval(selector, (el) => el.textContent?.trim() || '');
}

export async function runPanelAutomation(params: {
  action: PanelAutomationAction;
  target: PanelAutomationTarget;
}): Promise<PanelAutomationResult> {
  const config = loadConfig();
  const browser = await getBrowser(config.headless);
  const page = await browser.newPage();

  try {
    await page.goto(config.panelUrl, { waitUntil: 'networkidle2', timeout: 45000 });

    await page.waitForSelector(config.selectors.usernameInput, { timeout: 15000 });
    await page.type(config.selectors.usernameInput, config.username, { delay: 15 });
    await page.type(config.selectors.passwordInput, config.password, { delay: 15 });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 }).catch(() => null),
      page.click(config.selectors.submitButton),
    ]);

    await page.waitForSelector(config.selectors.postLoginReady, { timeout: 20000 });

    const identifier = params.target.email || params.target.username;
    const matchedBy = params.target.email ? 'email' : 'username';
    if (!identifier) {
      throw new Error('Kullanıcıyı panelde aramak için email veya username gerekli.');
    }

    await page.click(config.selectors.userSearchInput, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type(config.selectors.userSearchInput, identifier, { delay: 20 });

    if (config.selectors.userSearchButton) {
      await Promise.all([
        page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => null),
        page.click(config.selectors.userSearchButton),
      ]);
    } else {
      await page.keyboard.press('Enter');
      await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => null);
    }

    await page.waitForSelector(config.selectors.userRow, { timeout: 15000 });

    const rowMatches = await page.$$eval(
      config.selectors.userRow,
      (rows, selectors, expected) => {
        const clean = (value: string | null | undefined) => (value || '').trim().toLowerCase();
        return rows.findIndex((row) => {
          const email = selectors.userRowEmail
            ? row.querySelector(selectors.userRowEmail)?.textContent
            : row.textContent;
          const username = selectors.userRowUsername
            ? row.querySelector(selectors.userRowUsername)?.textContent
            : row.textContent;
          return clean(email).includes(clean(expected)) || clean(username).includes(clean(expected));
        });
      },
      { userRowEmail: config.selectors.userRowEmail, userRowUsername: config.selectors.userRowUsername },
      identifier,
    );

    if (rowMatches < 0) {
      throw new Error(`Panelde ${identifier} için eşleşen kullanıcı bulunamadı.`);
    }

    const rows = await page.$$(config.selectors.userRow);
    const row = rows[rowMatches];
    if (!row) {
      throw new Error('Eşleşen kullanıcı satırı okunamadı.');
    }

    if (config.selectors.openUserButton) {
      const button = await row.$(config.selectors.openUserButton);
      if (!button) {
        throw new Error('Kullanıcı detay butonu bulunamadı.');
      }
      await Promise.all([
        page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => null),
        button.click(),
      ]);
    } else {
      await row.click();
    }

    if (config.selectors.detailReady) {
      await page.waitForSelector(config.selectors.detailReady, { timeout: 15000 });
    }

    if (params.action === 'refresh') {
      if (!config.selectors.refreshButton) {
        throw new Error('PANEL_AUTOMATION_SELECTORS içinde refreshButton tanımlı değil.');
      }
      await Promise.all([
        page.waitForNetworkIdle({ idleTime: 700, timeout: 15000 }).catch(() => null),
        page.click(config.selectors.refreshButton),
      ]);
    }

    const status = await getTextBySelector(page, config.selectors.statusField);
    const expiresAt = await getTextBySelector(page, config.selectors.expiryField);
    const packageName = await getTextBySelector(page, config.selectors.packageField);

    return {
      ok: true,
      message: params.action === 'refresh'
        ? 'Panelde kullanıcı yenileme aksiyonu tetiklendi.'
        : 'Panel verisi başarıyla okundu.',
      inspectedAt: new Date().toISOString(),
      data: {
        matchedBy,
        status,
        expiresAt,
        packageName,
      },
    };
  } finally {
    await page.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}
