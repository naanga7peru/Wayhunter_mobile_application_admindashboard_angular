// Run with Playwright MCP browser_run_code_unsafe using this file as the filename.
// The Angular development preview must be running on localhost:4201.
async (page, screenshotDirectory) => {
  const base = 'http://localhost:4201/preview/';
  const destinations = [
    'authentication', 'dashboard', 'users', 'hunter-verification', 'advertisements',
    'places', 'trips-historical-routes', 'hazards', 'group-trips', 'games', 'coins-rewards',
    'merchants-voucher-inventory', 'redemptions-settlements', 'campaigns',
    'reports-analytics', 'notifications', 'settings-security-audit',
  ];
  const viewports = [[1920, 1080], [1440, 900], [1024, 768], [390, 844]];
  const errors = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const onPageError = error => errors.push(error.message);
  const onConsole = message => {
    if (message.type() === 'error') errors.push(message.text());
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  const waitForFocus = locator =>
    locator.and(page.locator(':focus')).waitFor({ state: 'visible' });
  const activate = async (locator, key) => {
    await locator.waitFor({ state: 'visible' });
    await locator.focus();
    await waitForFocus(locator);
    await page.keyboard.press(key);
  };
  const dialog = page.locator('dialog.drawer');
  const trigger = page.locator('.mobile-toggle');
  const close = dialog.locator('.close-drawer');
  let navigations = 0;
  const audit = [];

  try {
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height });
      await page.goto(base + 'dashboard');
      await page.locator('wayhunter-dashboard-page').waitFor();
      const mobile = await trigger.isVisible();
      const navigation = mobile ? dialog : page.locator('.sidebar');
      const groupButtons = navigation.locator('.group-button');

      for (const [pass, motion] of ['no-preference', 'reduce'].entries()) {
        await page.emulateMedia({ reducedMotion: motion });
        for (const [index, path] of destinations.entries()) {
          const key = (pass + index) % 2 ? 'Enter' : 'Space';
          if (mobile) {
            await activate(trigger, key);
            await waitForFocus(close);
            const last = dialog.locator('button:visible, a[href]:visible').last();
            await page.keyboard.press('Shift+Tab');
            assert(await last.evaluate(node => node === document.activeElement), 'Reverse Tab must wrap to the last control immediately');
            await page.keyboard.press('Tab');
            assert(await close.evaluate(node => node === document.activeElement), 'Forward Tab must wrap to Close navigation immediately');
            await page.keyboard.press('Tab');
            await waitForFocus(groupButtons.first());
            await page.keyboard.press('Shift+Tab');
            await waitForFocus(close);
            if (index === 0) {
              await page.keyboard.press('Escape');
              await dialog.waitFor({ state: 'hidden' });
              await waitForFocus(trigger);
              await activate(trigger, key);
              await waitForFocus(close);
            }
          }

          const link = navigation.locator(`a[href="/preview/${path}"]`);
          const group = link.locator('xpath=ancestor::li[2]').locator('button.group-button');
          if (await group.getAttribute('aria-expanded') !== 'true') await activate(group, key);
          await link.waitFor({ state: 'visible' });
          assert(await navigation.locator('.group-button[aria-expanded="true"]').count() === 1,
            `${width} ${path}: expected one open category`);

          if (!mobile && index === 0) {
            const firstLink = group.locator('xpath=..').locator('a[href]').first();
            await group.focus();
            await waitForFocus(group);
            await page.keyboard.press('Tab');
            await waitForFocus(firstLink);
            await page.keyboard.press('Shift+Tab');
            await waitForFocus(group);
          }

          // Wait for the SPA URL and rendered active link instead of a document load event.
          await activate(link, 'Enter');
          await page.waitForURL(base + path, { waitUntil: 'commit' });
          const module = page.locator(`wayhunter-${path}-page`);
          await module.waitFor({ state: 'visible' });
          await link.and(navigation.locator('[aria-current="page"]')).waitFor({ state: 'attached' });
          await group.and(navigation.locator('.current[aria-expanded="true"]')).waitFor({ state: 'attached' });
          if (mobile) {
            await dialog.waitFor({ state: 'hidden' });
            await waitForFocus(trigger);
          }
          const overflow = await module.evaluate(() => {
            const main = document.querySelector('main');
            return document.documentElement.scrollWidth > innerWidth || main.scrollWidth > main.clientWidth;
          });
          assert(!overflow, `${width} ${path}: page-wide overflow`);
          const duration = await group.evaluate(node => getComputedStyle(node).transitionDuration);
          assert((duration === '0s') === (motion === 'reduce'), `${width} ${path}: motion ${duration}`);
          navigations++;

          if (pass === 0 && (width === 1920 || width === 390)) {
            const headings = await page.locator('main h1, main h2').allTextContents();
            assert(await page.locator('main h1').count() === 1, `${path}: expected a single page heading`);
            audit.push({ width, path, headings: headings.slice(0, 3) });
            if (screenshotDirectory) {
              const id = String(index + 1).padStart(2, '0');
              await page.screenshot({ path: `${screenshotDirectory}/ADM-${id}-${width}.png`, fullPage: true });
            }
          }
        }
      }
    }

    const chartTables = [];
    for (const [path, selector] of [
      ['dashboard', 'wayhunter-dashboard-chart'],
      ['reports-analytics', 'wayhunter-report-trend'],
    ]) {
      await page.goto(base + path);
      await page.locator(selector).first().waitFor();
      const summaries = page.locator(`${selector} details summary`);
      for (const summary of await summaries.all()) {
        await activate(summary, 'Enter');
        const details = summary.locator('xpath=..');
        await details.getByRole('table').waitFor({ state: 'visible' });
        assert(await details.locator('tbody tr').count() > 0, `${path}: chart data table has no rows`);
      }
      assert(await summaries.count() > 0, `${path}: missing chart data controls`);
      chartTables.push([path, await summaries.count()]);
    }
    assert(errors.length === 0, errors.join('\n'));
    return { navigations, chartTables, errors, audit };
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
  }
}
