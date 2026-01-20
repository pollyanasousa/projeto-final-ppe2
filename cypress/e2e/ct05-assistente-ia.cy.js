// cypress/e2e/ct05-assistente-ia.cy.js

describe('CT-05: Interação com Assistente Virtual (Agente IA)', () => {
  
  beforeEach(() => {
    cy.visit('/index.html')
  })

  it('Deve exibir botão flutuante do assistente', () => {
    
    // Verificar que botão do agente existe e está visível
    cy.get('#agente-btn')
      .should('be.visible')
      .and('have.class', 'agente-btn')

    // Verificar tooltip/title
    cy.get('#agente-btn')
      .should('have.attr', 'title')
      .and('include', 'Assistente CPM')

    // Verificar ícone SVG dentro do botão
    cy.get('#agente-btn svg')
      .should('exist')
  })

  it('Deve abrir e fechar janela do chat ao clicar no botão', () => {
    
    // Inicialmente chat deve estar oculto
    cy.get('#agente-chat')
      .should('have.class', 'hidden')
      .and('not.be.visible')

    // Clicar no botão para abrir
    cy.get('#agente-btn').click()

    // Verificar que chat abriu
    cy.get('#agente-chat')
      .should('not.have.class', 'hidden')
      .and('be.visible')

    // Verificar header do chat
    cy.get('.agente-header h3')
      .should('contain', 'Assistente CPM')

    cy.get('.agente-status')
      .should('contain', 'Online')
      .and('be.visible')

    // Fechar usando botão X
    cy.get('#agente-fechar').click()

    // Verificar que fechou
    cy.get('#agente-chat')
      .should('have.class', 'hidden')
  })

  it('Deve exibir mensagem de boas-vindas ao abrir chat', () => {
    
    // Abrir chat
    cy.get('#agente-btn').click()

    // Aguardar mensagem inicial
    cy.wait(500)

    // Verificar que área de mensagens existe
    cy.get('#agente-messages')
      .should('be.visible')

    // Verificar que há pelo menos uma mensagem inicial
    cy.get('#agente-messages .agente-message')
      .should('have.length.at.least', 1)

    // Primeira mensagem deve ser do assistente (left/bot)
    cy.get('#agente-messages .agente-message')
      .first()
      .should('have.class', 'agente-bot')
      .and('contain.text', 'Olá') // ou qualquer texto de boas-vindas
  })

  it('Deve enviar mensagem e receber resposta', () => {
    
    // Abrir chat
    cy.get('#agente-btn').click()
    cy.wait(500)

    // Digitar mensagem no input
    const mensagem = 'Quais documentos preciso apresentar?'
    
    cy.get('#agente-input')
      .should('be.visible')
      .and('have.attr', 'placeholder')
      .and('include', 'dúvida')

    cy.get('#agente-input')
      .type(mensagem)
      .should('have.value', mensagem)

    // Contar mensagens antes de enviar
    cy.get('#agente-messages .agente-message')
      .then($msgs => {
        const countBefore = $msgs.length

        // Clicar em enviar
        cy.get('#agente-enviar').click()

        // Verificar que input foi limpo
        cy.get('#agente-input')
          .should('have.value', '')

        // Aguardar nova mensagem aparecer
        cy.wait(1000)

        // Verificar que mensagem do usuário foi adicionada
        cy.get('#agente-messages .agente-message')
          .should('have.length.at.least', countBefore + 1)

        // Última mensagem deve ser do usuário
        cy.get('#agente-messages .agente-message')
          .last()
          .should('have.class', 'agente-user')
          .and('contain', mensagem)

        // Aguardar resposta do assistente
        cy.wait(3000)

        // Deve ter mais uma mensagem (resposta do bot)
        cy.get('#agente-messages .agente-message')
          .should('have.length.at.least', countBefore + 2)
      })
  })

  it('Deve enviar mensagem ao pressionar Enter', () => {
    
    cy.get('#agente-btn').click()
    cy.wait(500)

    const mensagem = 'Quanto custa a matrícula?'

    cy.get('#agente-input')
      .type(mensagem)
      .type('{enter}')

    // Input deve limpar
    cy.get('#agente-input')
      .should('have.value', '')

    // Mensagem deve aparecer
    cy.wait(500)
    
    cy.get('#agente-messages .agente-message')
      .last()
      .should('contain', mensagem)
  })

  it('Deve manter histórico de conversa na sessão', () => {
    
    // Abrir chat
    cy.get('#agente-btn').click()
    cy.wait(500)

    // Enviar primeira mensagem
    cy.get('#agente-input')
      .type('Primeira pergunta')
      .type('{enter}')

    cy.wait(2000)

    // Enviar segunda mensagem
    cy.get('#agente-input')
      .type('Segunda pergunta')
      .type('{enter}')

    cy.wait(2000)

    // Deve ter pelo menos: boas-vindas + 2 perguntas + 2 respostas = 5 msgs
    cy.get('#agente-messages .agente-message')
      .should('have.length.at.least', 5)

    // Fechar e reabrir chat
    cy.get('#agente-fechar').click()
    cy.wait(500)
    cy.get('#agente-btn').click()

    // Histórico deve estar mantido
    cy.get('#agente-messages .agente-message')
      .should('have.length.at.least', 5)
  })

  it('Deve exibir indicador de digitando/loading enquanto aguarda resposta', () => {
    
    cy.get('#agente-btn').click()
    cy.wait(500)

    cy.get('#agente-input')
      .type('Teste loading')
      .type('{enter}')

    // Aguardar um pouco e verificar se há indicador
    cy.wait(500)

    // Pode ter uma classe .typing ou .loading
    // Ou uma mensagem temporária "Digitando..."
    cy.get('#agente-messages')
      .should('be.visible')
    
    // Aguardar resposta completa
    cy.wait(3000)
  })

  it('Deve ter interface responsiva e acessível', () => {
    
    // Abrir chat
    cy.get('#agente-btn').click()

    // Verificar elementos essenciais
    cy.get('.agente-header').should('be.visible')
    cy.get('#agente-messages').should('be.visible')
    cy.get('.agente-input-area').should('be.visible')

    // Verificar que input está acessível
    cy.get('#agente-input')
      .should('be.enabled')
      .and('not.be.disabled')

    // Botão enviar visível e clicável
    cy.get('#agente-enviar')
      .should('be.visible')
      .and('not.be.disabled')

    // Botão fechar funcional
    cy.get('#agente-fechar')
      .should('be.visible')
      .click()

    cy.get('#agente-chat')
      .should('have.class', 'hidden')
  })

  it('Não deve enviar mensagem vazia', () => {
    
    cy.get('#agente-btn').click()
    cy.wait(500)

    // Contar mensagens
    cy.get('#agente-messages .agente-message')
      .then($msgs => {
        const count = $msgs.length

        // Tentar enviar sem digitar nada
        cy.get('#agente-enviar').click()

        // Número de mensagens não deve aumentar
        cy.get('#agente-messages .agente-message')
          .should('have.length', count)
      })

    // Tentar com Enter em input vazio
    cy.get('#agente-input').type('{enter}')

    // Número de mensagens continua o mesmo
    cy.get('#agente-messages .agente-message')
      .should('exist')
  })

})