/** @type {import('lighthouse').Config} */
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4200/login'],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage',
        onlyCategories: ['accessibility', 'performance'],
      },
      startServerCommand: 'npx serve -s dist/softon-portal-web/browser -l 4200',
      startServerReadyPattern: 'Accepting connections',
      startServerReadyTimeout: 120000,
    },
    assert: {
      assertions: {
        'categories:accessibility': ['warn', { minScore: 0.85 }],
        'categories:performance': ['warn', { minScore: 0.5 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
