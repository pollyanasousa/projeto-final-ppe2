// cypress.config.js

const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // URL base do sistema - Live Server porta 5501
    baseUrl: 'http://localhost:8080',
    
    // Configurações de tempo
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,
    
    // Viewport padrão
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Vídeos e screenshots
    video: true,
    videoCompression: 32,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    screenshotOnRunFailure: true,
    
    // Configurações de retry
    retries: {
      runMode: 2,      // 2 tentativas no modo headless
      openMode: 0      // 0 tentativas no modo interativo
    },
    
    // Configuração de spec files
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    
    // Experimental
    experimentalStudio: true,
    
    setupNodeEvents(on, config) {
      // Implementar event listeners aqui
      
      // Exemplo: log de início de teste
      on('before:run', (details) => {
        console.log('Iniciando execução dos testes Cypress')
        console.log('Specs encontrados:', details.specs.length)
      })
      
      // Exemplo: log após conclusão
      on('after:run', (results) => {
        console.log('Testes concluídos!')
        console.log('Total de testes:', results.totalTests)
        console.log('Passaram:', results.totalPassed)
        console.log('Falharam:', results.totalFailed)
      })
      
      return config
    },
  },
  
  // Configurações do Component Testing (se necessário no futuro)
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})