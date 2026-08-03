import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('https://poneglyph.one/api')
        # Wait for some content to load
        await page.wait_for_timeout(3000)
        content = await page.evaluate('document.body.innerText')
        print(content)
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
