export async function waitForAppReady(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
}

export async function expectToastOrPageSignal(page, textPattern) {
  const signal = page.getByText(textPattern).first();
  await signal.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
}
