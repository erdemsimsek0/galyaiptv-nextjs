import chromium from '@sparticuz/chromium';
import puppeteer, { type ElementHandle, type Page } from 'puppeteer-core';

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
    linePageReady?: string;
    lineSearchInput?: string;
    lineUserRow?: string;
    lineUserRowUsername?: string;
    lineEditButton?: string;
    lineEditorReady?: string;
    lineInSelect?: string;
    lineNotInSelect?: string;
    lineSaveButton?: string;
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

export interface PanelLineState {
  inChannels: string[];
  notInChannels: string[];
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
  return page.$eval(selector, (el: Element) => el.textContent?.trim() || '');
}


function describeSelector(selector?: string) {
  return selector ? ` (${selector})` : '';
}

async function waitForAnySelector(page: Page, selectors: string[], timeout: number) {
  const startedAt = Date.now();

  for (const selector of selectors) {
    const remaining = timeout - (Date.now() - startedAt);
    if (remaining <= 0) break;

    try {
      await page.waitForSelector(selector, { timeout: remaining });
      return selector;
    } catch {
      continue;
    }
  }

  return null;
}

async function clearAndType(page: Page, selector: string, value: string) {
  await page.waitForSelector(selector, { timeout: 15000 });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type(selector, value, { delay: 20 });
}

async function loginToPanel(page: Page, config: PanelAutomationConfig) {
  await page.goto(panelBaseUrl(), { waitUntil: 'networkidle2', timeout: 45000 });
  await clearAndType(page, config.selectors.usernameInput, config.username);
  await clearAndType(page, config.selectors.passwordInput, config.password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 }).catch(() => null),
    page.click(config.selectors.submitButton),
  ]);
  await page.waitForSelector(config.selectors.postLoginReady, { timeout: 20000 });
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

    await clearAndType(page, config.selectors.usernameInput, config.username);
    await clearAndType(page, config.selectors.passwordInput, config.password);

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

    await clearAndType(page, config.selectors.userSearchInput, identifier);

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
      (rows: Element[], selectors: { userRowEmail?: string; userRowUsername?: string }, expected: string) => {
        const clean = (value: string | null | undefined) => (value || '').trim().toLowerCase();
        return rows.findIndex((row: Element) => {
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

function panelBaseUrl() {
  return process.env.PANEL_AUTOMATION_URL || 'https://pa.ipguzel.com/';
}

function panelLinesUrl() {
  return process.env.PANEL_LINES_URL || 'https://pa.ipguzel.com/lines';
}

async function findLineSearchInput(page: Page, config: PanelAutomationConfig) {
  if (config.selectors.lineSearchInput) {
    await page.waitForSelector(config.selectors.lineSearchInput, { timeout: 30000 });
    return config.selectors.lineSearchInput;
  }

  const fallbackSelector = await waitForAnySelector(
    page,
    [
      "input[placeholder*='Search']",
      "input[placeholder*='search']",
      "input[placeholder*='User']",
      "input[type='search']",
      'table input',
    ],
    30000,
  );

  if (!fallbackSelector) {
    throw new Error('Lines sayfasındaki kullanıcı arama alanı bulunamadı. lineSearchInput selectoru tanımlayın.');
  }

  return fallbackSelector;
}

async function findLineUserRow(page: Page, config: PanelAutomationConfig, username: string) {
  if (config.selectors.lineUserRow) {
    await page.waitForSelector(config.selectors.lineUserRow, { timeout: 30000 });
    const rows = await page.$$(config.selectors.lineUserRow);

    for (const row of rows) {
      const matches = await row.evaluate((element: Element, expected: string, usernameSelector?: string) => {
        const text = usernameSelector ? element.querySelector(usernameSelector)?.textContent : element.textContent;
        return (text || '').toLowerCase().includes(expected.toLowerCase());
      }, username, config.selectors.lineUserRowUsername);

      if (matches) return row;
    }
  }

  await page.waitForFunction(
    (expected: string) => Array.from(document.querySelectorAll('table tbody tr, [role="row"]')).some((row) => (row.textContent || '').toLowerCase().includes(expected.toLowerCase())),
    { timeout: 30000 },
    username,
  );

  const handles = await page.$$('table tbody tr, [role="row"]');
  for (const row of handles) {
    const matches = await row.evaluate((element: Element, expected: string) => (element.textContent || '').toLowerCase().includes(expected.toLowerCase()), username);
    if (matches) return row;
  }

  return null;
}

async function clickLineEditButton(page: Page, config: PanelAutomationConfig, row: ElementHandle<Element>) {
  if (config.selectors.lineEditButton) {
    const button = await row.$(config.selectors.lineEditButton);
    if (!button) {
      throw new Error(`Edit butonu bulunamadı${describeSelector(config.selectors.lineEditButton)}.`);
    }

    await Promise.all([
      page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }).catch(() => null),
      button.click(),
    ]);
    return;
  }

  const clicked = await row.evaluate((element: Element) => {
    const candidates = Array.from(element.querySelectorAll<HTMLElement | HTMLInputElement>('button,a,input[type="button"],input[type="submit"]'));
    const editButton = candidates.find((candidate: HTMLElement | HTMLInputElement) => {
      const text = (candidate.textContent || (candidate as HTMLInputElement).value || '').trim().toLowerCase();
      return text === 'edit' || text.includes('edit') || text.includes('düzenle');
    }) as HTMLElement | HTMLInputElement | undefined;

    if (!editButton) return false;
    editButton.click();
    return true;
  });

  if (!clicked) {
    throw new Error('Lines sayfasında Edit butonu bulunamadı. lineEditButton selectoru tanımlayın.');
  }

  await page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }).catch(() => null);
}

async function waitForLineEditor(page: Page, config: PanelAutomationConfig) {
  if (config.selectors.lineEditorReady) {
    await page.waitForSelector(config.selectors.lineEditorReady, { timeout: 45000 });
    return;
  }

  const readySelector = await waitForAnySelector(
    page,
    [
      config.selectors.lineInSelect || '',
      config.selectors.lineNotInSelect || '',
      'select[multiple]',
      '.ms-container',
      '.multi-select-container',
      '[data-role="line-editor"]',
      '.modal.show',
      '.modal-dialog',
    ].filter(Boolean),
    45000,
  );

  if (!readySelector) {
    throw new Error('Kanal düzenleme ekranı açıldıktan sonra editor alanı bulunamadı. lineEditorReady / lineInSelect / lineNotInSelect selectorlarını tanımlayın.');
  }
}

async function openLineEditor(page: Page, config: PanelAutomationConfig, username: string) {
  await page.goto(panelLinesUrl(), { waitUntil: 'networkidle2', timeout: 45000 });

  if (config.selectors.linePageReady) {
    await page.waitForSelector(config.selectors.linePageReady, { timeout: 30000 });
  }

  const searchSelector = await findLineSearchInput(page, config);
  await clearAndType(page, searchSelector, username);
  await page.waitForNetworkIdle({ idleTime: 600, timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(1200);

  const row = await findLineUserRow(page, config, username);
  if (!row) {
    throw new Error(`Lines sayfasında ${username} kullanıcısı bulunamadı.`);
  }

  await clickLineEditButton(page, config, row);
  await waitForLineEditor(page, config);
}

async function getSelectHandle(page: Page, preferredSelector: string | undefined, fallback: 'in' | 'not_in') {
  if (preferredSelector) {
    const handle = await page.$(preferredSelector);
    if (handle) return handle;
  }

  const selectHandles = await page.$$('select[multiple]');
  if (selectHandles.length >= 2) {
    return fallback === 'in' ? selectHandles[1] : selectHandles[0];
  }

  return null;
}

async function readLineState(page: Page, config: PanelAutomationConfig): Promise<PanelLineState> {
  const inSelect = await getSelectHandle(page, config.selectors.lineInSelect, 'in');
  const notInSelect = await getSelectHandle(page, config.selectors.lineNotInSelect, 'not_in');

  if (!inSelect || !notInSelect) {
    throw new Error('IN / NOT IN listeleri bulunamadı. lineInSelect ve lineNotInSelect selectorlarını kontrol edin.');
  }

  const readOptions = async (handle: ElementHandle<Element>) => handle.evaluate((element: Element) =>
    Array.from(element.querySelectorAll('option'))
      .map((option: Element) => option.textContent?.trim() || '')
      .filter(Boolean),
  );

  return {
    inChannels: await readOptions(inSelect),
    notInChannels: await readOptions(notInSelect),
  };
}

async function moveChannels(page: Page, config: PanelAutomationConfig, channels: string[], source: 'in' | 'not_in') {
  const sourceHandle = await getSelectHandle(page, source === 'in' ? config.selectors.lineInSelect : config.selectors.lineNotInSelect, source);
  if (!sourceHandle) {
    throw new Error(`Kaynak kanal listesi bulunamadı (${source}).`);
  }

  for (const channel of channels) {
    const moved = await sourceHandle.evaluate(async (element: Element, channelName: string) => {
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const option = Array.from(element.querySelectorAll<HTMLOptionElement>('option')).find((candidate: HTMLOptionElement) => (candidate.textContent || '').trim() === channelName);
      if (!option) return false;

      option.selected = true;
      option.dispatchEvent(new Event('change', { bubbles: true }));
      option.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      await sleep(150);
      return true;
    }, channel);

    if (!moved) {
      throw new Error(`Kanal taşınamadı: ${channel}`);
    }
  }
}

async function clickSave(page: Page, config: PanelAutomationConfig) {
  if (config.selectors.lineSaveButton) {
    await page.waitForSelector(config.selectors.lineSaveButton, { timeout: 15000 });
    await Promise.all([
      page.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }).catch(() => null),
      page.click(config.selectors.lineSaveButton),
    ]);
    return;
  }

  const saved = await page.evaluate(() => {
    const saveButton = Array.from(document.querySelectorAll('button,a,input[type="submit"]')).find((button) => {
      const text = (button.textContent || (button as HTMLInputElement).value || '').trim().toLowerCase();
      return text === 'save' || text.includes('save');
    }) as HTMLElement | HTMLInputElement | undefined;

    if (!saveButton) return false;
    saveButton.click();
    return true;
  });

  if (!saved) {
    throw new Error('Save butonu bulunamadı. lineSaveButton selectoru tanımlayın.');
  }

  await page.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }).catch(() => null);
}

export async function loadPanelLineState(username: string): Promise<PanelLineState> {
  const config = loadConfig();
  const browser = await getBrowser(config.headless);
  const page = await browser.newPage();

  try {
    await loginToPanel(page, config);
    await openLineEditor(page, config, username);
    return await readLineState(page, config);
  } finally {
    await page.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}

export async function savePanelLineState(username: string, target: PanelLineState): Promise<PanelLineState> {
  const config = loadConfig();
  const browser = await getBrowser(config.headless);
  const page = await browser.newPage();

  try {
    await loginToPanel(page, config);
    await openLineEditor(page, config, username);
    const current = await readLineState(page, config);

    const toDisable = current.inChannels.filter((channel) => target.notInChannels.includes(channel));
    const toEnable = current.notInChannels.filter((channel) => target.inChannels.includes(channel));

    if (toDisable.length > 0) await moveChannels(page, config, toDisable, 'in');
    if (toEnable.length > 0) await moveChannels(page, config, toEnable, 'not_in');

    await clickSave(page, config);
    return await readLineState(page, config);
  } finally {
    await page.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}
