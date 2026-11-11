"""Browser acceptance for all Callback Casefiles; run with python play_cases.py."""
import os
import shutil
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

URL = os.getenv("CASE_GAME_URL", "http://127.0.0.1:8786/problem-solver/")
PACK = [
    ["0-0", "2-0", "2-1", "1-2"],
    ["0-0", "3-0", "2-1", "0-2", "3-2"],
    ["0-0", "2-0", "3-1", "0-3", "1-2", "4-3"],
]
ROUTES = [
    [4, 0, 1, 2, 6, 7, 11, 15],
    [5, 10, 15, 16, 17, 12, 7, 8, 9, 4],
    [1, 0, 5, 10, 11, 16, 11, 12, 7, 8, 9, 4],
]
LAMPS = [[0, 8], [0, 5, 10, 15], [0, 4, 7, 10, 13, 16]]
PUSH = ["urrdru", "uldlurrrdru", "uruldlurrrddurudddl"]
DIRECTIONS = dict(u="up", r="right", d="down", l="left")


def press(page, attr, value, mobile):
    control = page.locator(f'[{attr}="{value}"]:visible')
    expect(control).to_have_count(1)
    if mobile:
        control.tap()
    else:
        control.click()


def solve(page, game, level, mobile):
    def act(command):
        press(page, "data-case-action", command, mobile)

    if game == "vanpack":
        if level == 0:
            act("cell-3-3")  # collision; must leave the case available
        for index, cell in enumerate(PACK[level]):
            act(f"pick-{index}")
            for _ in range((-index - 1) % 4):
                act("rotate")
            act(f"cell-{cell}")
    elif game == "dispatch":
        for i, street in enumerate(ROUTES[level]):
            act(f"drive-{street}")
            if i == 0:
                act("undo")
                act(f"drive-{street}")
    elif game == "switchboard":
        if level == 0:
            act("lamp-1")
            act("lamp-1")
        for lamp in LAMPS[level]:
            act(f"lamp-{lamp}")
    elif game == "recovery":
        for direction in PUSH[level]:
            action = DIRECTIONS[direction]
            if mobile:
                act(action)
            else:
                page.keyboard.press("Arrow" + action.capitalize())
    else:
        solve_deduction(page, game, level, act)


def run():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=shutil.which("google-chrome") or shutil.which("chromium"), args=["--no-sandbox"])
        for mobile, levels in [(False, [0,1,2]), (True, [0,1,2])]:
            context = browser.new_context(
                viewport={"width": 360 if mobile else 1200, "height": 780 if mobile else 850},
                is_mobile=mobile, has_touch=mobile,
            )
            page = context.new_page()
            page.set_default_timeout(5000)
            errors = []
            page.on("pageerror", lambda exc: errors.append(str(exc)))
            page.goto(URL)
            page.evaluate("document.fonts.ready")
            out = Path('screenshots')
            out.mkdir(exist_ok=True)
            size = 'phone' if mobile else 'desktop'
            page.screenshot(path=str(out / ('problem-solver-' + size + '.png')))
            press(page, "data-home", "cases", mobile)
            folder = page.locator("[data-catalog]:visible")
            expect(folder).to_have_count(6)
            games = [button.get_attribute("data-catalog") for button in folder.all()]
            for game in games:
                for level in levels:
                    press(page, "data-catalog", game, mobile)
                    press(page, "data-case-level", str(level), mobile)
                    if game == "dispatch" and level == 0:
                        press(page, "data-case-nav", "hint", mobile)
                    assert page.locator("#dlg").evaluate("e => e.scrollWidth <= e.clientWidth+1"), (size, game, level, "overflow")
                    if game == 'switchboard' and level == 0:
                        page.screenshot(path=str(out / ('switchboard-' + size + '.png')))
                    solve(page, game, level, mobile)
                    expect(page.locator("[data-case-won]:visible")).to_have_count(1)
                    press(page, "data-case-nav", "folders", mobile)
                    expect(folder).to_have_count(6)
                    print(f"PASS {'touch' if mobile else 'desktop'} {game} {level}", flush=True)
            page.reload()
            home = page.locator('[data-home="cases"]:visible')
            if home.count():
                press(page, "data-home", "cases", mobile)
            expect(folder).to_have_count(6)
            assert not errors, errors
            context.close()
        browser.close()


def solve_deduction(page, game, level, act):
    if game == 'lockbox':
        if level == 0:
            for n in [2, 2, 2]:
                act('key-' + str(n))
            act('test')
            expect(page.get_by_text('222 rattled the drawer.', exact=False)).to_be_visible()
        for n in [[1, 3, 0], [2, 2, 1], [3, 1, 3]][level]:
            act('key-' + str(n))
        act('test')
    elif game == 'alibi':
        for n in [[0, 5, 1, 4, 2, 3], [2, 5, 0, 3, 1, 4], [2, 3, 1, 5, 0, 4]][level]:
            act('tag-' + str(n))
        act('file')
    else:
        raise AssertionError(game)


if __name__ == '__main__':
    run()
