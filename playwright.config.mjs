import{defineConfig}from'@playwright/test';
import{browserLaunchOptions}from'./scripts/browser.mjs';
export default defineConfig({testDir:'./tests',timeout:30000,workers:2,fullyParallel:true,reporter:[['list'],['json',{outputFile:'docs/qa/browser-verification.json'}]],use:{baseURL:'http://127.0.0.1:4321',launchOptions:browserLaunchOptions(),screenshot:'only-on-failure'},webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:4321/en/',reuseExistingServer:!process.env.CI,timeout:15000}});
