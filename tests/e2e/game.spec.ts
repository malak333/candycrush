import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createGame, findHint, getLevel, swap } from '../../src/game'
import type { GameState } from '../../src/game'

async function readGame(page: Page): Promise<GameState> {
  return page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || 'null')
        if (item?.savedGame?.board) return item.savedGame
        if (item?.progress?.savedGame?.board) return item.progress.savedGame
      } catch { /* Ignore unrelated storage. */ }
    }
    throw new Error('No saved game checkpoint found')
  })
}

async function makeMatch(page: Page) {
  const before = await readGame(page)
  const pair = findHint(before)
  expect(pair).not.toBeNull()
  await page.locator(`[data-cell="${pair![0]}"]`).click()
  await page.locator(`[data-cell="${pair![1]}"]`).click()
  await expect.poll(async () => (await readGame(page)).score).toBeGreaterThan(before.score)
  return before
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(raw => {
    if (!localStorage.getItem('sugar-spell.progress.v1')) localStorage.setItem('sugar-spell.progress.v1', raw)
  }, JSON.stringify({ version: 1, unlocked: 1, stars: {}, best: {}, sound: true, tutorialSeen: false, savedGame: createGame(1, 20261025) }))
  await page.goto('./')
  await expect(page.getByTestId('board')).toBeVisible()
})

test('play a legal match, persist progress and sound, and recover after reload', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const oldSound = await page.getByRole('button', { name: /Turn sound/ }).getAttribute('aria-pressed')
  await page.getByRole('button', { name: /Turn sound/ }).click()
  const before = await makeMatch(page)
  const after = await readGame(page)
  expect(after.movesLeft).toBe(before.movesLeft - 1)
  await page.reload()
  expect(await readGame(page)).toEqual(after)
  await expect(page.getByRole('button', { name: /Turn sound/ })).toHaveAttribute('aria-pressed', oldSound === 'true' ? 'false' : 'true')
  expect(errors).toEqual([])
})

test('nonmatching swaps cost no move and do not change the board', async ({ page }) => {
  const before = await readGame(page)
  let invalid: [number, number] | undefined
  for (let i = 0; i < 64 && !invalid; i++) {
    if (i % 8 !== 7 && !swap(before, i, i + 1).valid) invalid = [i, i + 1]
  }
  expect(invalid).toBeDefined()
  await page.locator(`[data-cell="${invalid![0]}"]`).click()
  await page.locator(`[data-cell="${invalid![1]}"]`).click()
  await expect(page.getByText('Try a swap that makes a match!')).toBeVisible()
  expect(await readGame(page)).toEqual(before)
})

test('hints and boosters work with finite inventory and no move cost', async ({ page }) => {
  const before = await readGame(page)
  await page.getByRole('button', { name: 'Show a hint' }).click()
  await expect(page.locator('.cell.hinted')).toHaveCount(2)
  await page.getByRole('button', { name: /^Lollipop hammer/ }).click()
  await page.locator('[data-cell="0"]').click()
  await expect.poll(async () => (await readGame(page)).boosters.hammer).toBe(before.boosters.hammer - 1)
  const hammered = await readGame(page)
  expect(hammered.movesLeft).toBe(before.movesLeft)
  if (hammered.status === 'playing') {
    await page.getByRole('button', { name: /^Shuffle,/ }).click()
    const shuffled = await readGame(page)
    expect(shuffled.boosters.shuffle).toBe(before.boosters.shuffle - 1)
    expect(shuffled.movesLeft).toBe(before.movesLeft)
    expect(findHint(shuffled)).not.toBeNull()
  }
})

test('level journey locks future levels and dialogs support keyboard dismissal', async ({ page }) => {
  await page.getByRole('button', { name: 'Explore the journey' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Level 2:/ })).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'How to play' }).click()
  await expect(page.getByRole('heading', { name: 'A little candy magic' })).toBeVisible()
  await page.getByRole('button', { name: 'Let’s make some magic' }).click()
  await page.getByRole('button', { name: 'Pause game' }).click()
  await page.getByRole('button', { name: 'Keep playing' }).click()
  await expect(page.getByTestId('board')).toBeVisible()
})

test('winning unlocks the next level and preserves earned stars', async ({ page }) => {
  const game = await readGame(page)
  const fixture = { ...game, score: getLevel(game.levelId).targetScore - 10 }
  await page.evaluate(next => {
    for (const key of Object.keys(localStorage)) {
      try {
        const value = JSON.parse(localStorage.getItem(key) || 'null')
        if (value?.savedGame?.board) { value.savedGame = next; localStorage.setItem(key, JSON.stringify(value)); break }
        if (value?.progress?.savedGame?.board) { value.progress.savedGame = next; localStorage.setItem(key, JSON.stringify(value)); break }
      } catch { /* Ignore unrelated storage. */ }
    }
  }, fixture)
  await page.reload()
  await makeMatch(page)
  await expect(page.getByRole('heading', { name: 'Sweet success!' })).toBeVisible()
  await page.getByRole('button', { name: 'Next sweet adventure' }).click()
  expect((await readGame(page)).levelId).toBe(2)
  await page.getByRole('button', { name: 'Explore the journey' }).click()
  await expect(page.getByRole('button', { name: /^Level 2:/ })).toBeEnabled()
})

test('app shell, progress and game survive an offline reload', async ({ page, context }) => {
  const manifestURL = new URL((await page.locator('link[rel="manifest"]').getAttribute('href'))!, page.url());
  const response = await page.request.get(manifestURL.href);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(new URL(manifest.start_url, manifestURL).pathname).toBe(new URL(page.url()).pathname);
  for (const icon of manifest.icons) expect((await page.request.get(new URL(icon.src, manifestURL).href)).ok()).toBe(true);
  await expect(page.getByText('Ready for offline play')).toBeVisible({ timeout: 20000 })
  await page.evaluate(() => navigator.serviceWorker.ready)
  const before = await readGame(page)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByTestId('board')).toBeVisible()
  await expect(page.getByText('You’re playing offline')).toBeVisible()
  expect(await readGame(page)).toEqual(before)
  await makeMatch(page)
  await context.setOffline(false)
})

test('small iPhone and desktop layouts fit, with accessible game and install instructions', async ({ page }, testInfo) => {
  await page.screenshot({ path: testInfo.outputPath('initial-layout.png'), fullPage: true });
  for (const width of [320, 390, 768, 1365]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.locator('.cell')).toHaveCount(64)
  }
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(results.violations).toEqual([])
  await page.getByRole('button', { name: /Take a little sweet/ }).click()
  await expect(page.getByRole('dialog')).toContainText('Add to Home Screen')
  await expect(page.getByRole('dialog')).toContainText('Safari')
})

test('keyboard selects neighboring sweets and arrows move focus', async ({ page }) => {
  const game = await readGame(page)
  const [a, b] = findHint(game)!
  await page.locator(`[data-cell="${a}"]`).focus()
  await page.keyboard.press('Enter')
  const key = b === a + 1 ? 'ArrowRight' : b === a - 1 ? 'ArrowLeft' : b > a ? 'ArrowDown' : 'ArrowUp'
  await page.keyboard.press(key)
  await expect(page.locator(`[data-cell="${b}"]`)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await readGame(page)).score).toBeGreaterThan(game.score)
})

test('a swipe swaps adjacent candies once without a follow-up click selecting another candy', async ({ page }) => {
  const before = await readGame(page)
  const [a, b] = findHint(before)!
  const from = await page.locator(`[data-cell="${a}"]`).boundingBox()
  const to = await page.locator(`[data-cell="${b}"]`).boundingBox()
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2)
  await page.mouse.down()
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 5 })
  await page.mouse.up()
  await expect.poll(async () => (await readGame(page)).movesLeft).toBe(before.movesLeft - 1)
  await expect(page.getByTestId('board')).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('.cell.selected')).toHaveCount(0)
})
