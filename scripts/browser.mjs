import{existsSync}from'node:fs';
export function browserLaunchOptions(){
  const candidates=[process.env.PLAYWRIGHT_EXECUTABLE_PATH,'C:/Users/WZ/AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe','C:/Users/WZ/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe','C:/Users/WZ/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe'].filter(Boolean);
  const executablePath=candidates.find(p=>existsSync(p));
  return {headless:true,...(executablePath?{executablePath}:{})};
}
