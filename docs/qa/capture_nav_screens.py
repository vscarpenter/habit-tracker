from pathlib import Path
from playwright.sync_api import sync_playwright


BASE_URL = "https://127.0.0.1:8080/"
OUT_DIR = Path("docs/qa/nav-screens")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def set_theme(page, theme: str) -> None:
    page.add_init_script(
        script=f"""
        (() => {{
          try {{ localStorage.setItem('habitflow-theme', {theme!r}); }} catch (e) {{}}
        }})()
        """,
    )


def capture_desktop(browser, theme: str) -> None:
    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
        ignore_https_errors=True,
    )
    page = context.new_page()
    set_theme(page, theme)
    page.goto(BASE_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(1800)
    page.screenshot(path=str(OUT_DIR / f"today-desktop-{theme}.png"), full_page=True)

    routes = [
        ("Habits", "habits"),
        ("Week", "week"),
        ("Month", "month"),
        ("Stats", "stats"),
        ("Settings", "settings"),
    ]
    for label, slug in routes:
        page.get_by_role("link", name=label).first.click()
        page.wait_for_timeout(1600)
        page.screenshot(path=str(OUT_DIR / f"{slug}-desktop-{theme}.png"), full_page=True)
    context.close()


def capture_mobile(browser, theme: str) -> None:
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        is_mobile=True,
        has_touch=True,
        device_scale_factor=3,
        ignore_https_errors=True,
        user_agent=(
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 "
            "Mobile/15E148 Safari/604.1"
        ),
    )
    page = context.new_page()
    set_theme(page, theme)
    page.goto(BASE_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(1800)
    page.screenshot(path=str(OUT_DIR / f"today-mobile-{theme}.png"), full_page=True)

    # Bottom nav covers these routes
    routes = [
        ("Week", "week"),
        ("Month", "month"),
        ("Stats", "stats"),
        ("Settings", "settings"),
    ]
    for label, slug in routes:
        page.get_by_role("link", name=label).first.click()
        page.wait_for_timeout(1800)
        page.screenshot(path=str(OUT_DIR / f"{slug}-mobile-{theme}.png"), full_page=True)

    # Habits route is not in mobile bottom nav; open via script pushState navigation.
    page.evaluate("window.history.pushState({}, '', '/habits'); window.dispatchEvent(new PopStateEvent('popstate'));")
    page.wait_for_timeout(1200)
    # Fall back to hard navigation if app router did not render habits
    if "/habits/" not in page.url and not page.locator("text=Habits").count():
        page.goto(BASE_URL.rstrip("/") + "/habits", wait_until="domcontentloaded")
        page.wait_for_timeout(1000)
    page.screenshot(path=str(OUT_DIR / f"habits-mobile-{theme}.png"), full_page=True)
    context.close()


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        for theme in ("light", "dark"):
            capture_desktop(browser, theme)
            capture_mobile(browser, theme)
        browser.close()


if __name__ == "__main__":
    main()
