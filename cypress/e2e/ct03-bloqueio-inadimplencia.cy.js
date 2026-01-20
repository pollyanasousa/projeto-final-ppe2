// cypress/e2e/ct03-bloqueio-inadimplencia.cy.js

describe('CT-03: Bloqueio por Inadimplência Financeira', () => {
  
  beforeEach(() => {
    cy.visit('/index.html')
  })

  it('Deve bloquear matrícula de candidato com pendência financeira', () => {
    
    // Preencher com CPF que possui pendência (444.444.444-44)
    cy.get('#nomeCompleto').type('Carlos Eduardo Santos')
    cy.get('#dataNascimento').type('1995-03-10')
    
    // CPF COM pendência
    cy.get('#cpfCandidato')
      .type('44444444444')
      .should('have.value', '444.444.444-44')

    cy.get('#menorIdade').select('nao')

    // Preencher dados de contato
    cy.get('#email').type('carlos.santos@email.com')
    cy.get('#telefone').type('81977777777')

    // Preencher endereço
    cy.get('#cep').type('50030230')
    cy.get('#cep').blur()
    cy.wait(2000)
    cy.get('#numero').type('200')

    // Selecionar curso
    cy.get('#instrumento').select('guitarra')
    cy.get('#nivelExperiencia').select('intermediario')

    // Submeter formulário
    cy.get('button[type="submit"]').click()

    // Verificar loading durante verificação
    cy.get('#loading', { timeout: 1000 })
      .should('be.visible')
      .and('contain', 'Verificando informações')

    // Aguardar verificação de inadimplência
    cy.wait(3000)

    // Verificar que modal de PENDÊNCIA aparece (não o de sucesso)
    cy.get('#pendenciaModal', { timeout: 10000 })
      .should('be.visible')
      .and('have.class', 'show')

    // Verificar conteúdo do modal de pendência
    cy.get('#pendenciaModal h2')
      .should('contain', 'Matrícula Bloqueada')
      .and('contain', 'Pendência Financeira')

    // Verificar ícone de alerta vermelho
    cy.get('#pendenciaModal .modal-icon svg path')
      .should('have.attr', 'fill', '#dc3545')

    // Verificar orientações ao funcionário
    cy.get('#pendenciaModal')
      .should('contain', 'INSTRUÇÃO AO FUNCIONÁRIO')
      .and('contain', 'pendência financeira')

    // Verificar detalhes da dívida são exibidos
    cy.get('#debtDetails')
      .should('be.visible')
      .and('not.be.empty')

    // Verificar informações de contato da secretaria
    cy.get('#pendenciaModal')
      .should('contain', '(81) 3355-0000')
      .and('contain', 'secretaria@conservatorio.pe.gov.br')
      .and('contain', 'Rua da Aurora')

    // Verificar botão de fechar
    cy.get('#pendenciaModal button')
      .should('contain', 'Fechar e Limpar Formulário')
      .and('be.visible')

    // Modal de SUCESSO NÃO deve aparecer
    cy.get('#sucessoModal')
      .should('not.have.class', 'show')

    // Fechar modal de pendência
    cy.get('#pendenciaModal button').click()

    // Verificar que modal fechou
    cy.get('#pendenciaModal')
      .should('not.have.class', 'show')

    // Verificar que formulário foi limpo
    cy.get('#nomeCompleto').should('have.value', '')
    cy.get('#cpfCandidato').should('have.value', '')
  })

  it('Deve exibir alerta de advertência no modal de pendência', () => {
    
    // Simular processo com CPF inadimplente
    cy.get('#nomeCompleto').type('Teste Inadimplente')
    cy.get('#dataNascimento').type('1990-01-01')
    cy.get('#cpfCandidato').type('44444444444')
    cy.get('#email').type('teste@email.com')
    cy.get('#telefone').type('81999999999')
    cy.get('#cep').type('50030230')
    cy.get('#cep').blur()
    cy.wait(2000)
    cy.get('#numero').type('10')
    cy.get('#instrumento').select('piano')
    cy.get('#nivelExperiencia').select('iniciante')

    cy.get('button[type="submit"]').click()
    cy.wait(3000)

    // Verificar alerta de advertência dentro do modal
    cy.get('#pendenciaModal .alert-warning', { timeout: 10000 })
      .should('be.visible')
      .and('have.class', 'show')
      .and('contain', 'Orientação')
      .and('contain', 'regularizar')
  })

  it('Deve verificar inadimplência do responsável quando menor', () => {
    
    // Cadastro de menor com responsável inadimplente
    cy.get('#nomeCompleto').type('Menor Teste')
    cy.get('#dataNascimento').type('2012-01-01')
    cy.get('#cpfCandidato').type('11111111111') // Candidato OK

    cy.get('#menorIdade').select('sim')

    // Responsável COM pendência
    cy.get('#nomeResponsavel').type('Responsável Inadimplente')
    cy.get('#cpfResponsavel').type('44444444444') // CPF com pendência

    cy.get('#email').type('teste@email.com')
    cy.get('#telefone').type('81999999999')
    cy.get('#cep').type('50030230')
    cy.get('#cep').blur()
    cy.wait(2000)
    cy.get('#numero').type('10')
    cy.get('#instrumento').select('violao')
    cy.get('#nivelExperiencia').select('iniciante')

    cy.get('button[type="submit"]').click()
    cy.wait(4000) // 2 CPFs para verificar

    // Deve bloquear por pendência do responsável
    cy.get('#pendenciaModal', { timeout: 10000 })
      .should('be.visible')
      .and('have.class', 'show')

    // Modal de sucesso NÃO deve aparecer
    cy.get('#sucessoModal').should('not.have.class', 'show')
  })

})