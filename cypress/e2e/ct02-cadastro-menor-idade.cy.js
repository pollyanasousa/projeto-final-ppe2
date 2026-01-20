// cypress/e2e/ct02-cadastro-menor-idade.cy.js

describe('CT-02: Cadastro de Candidato Menor de Idade com Responsável', () => {
  
  beforeEach(() => {
    cy.visit('/index.html')
  })

  it('Deve exibir seção de responsável ao selecionar menor de idade', () => {
    
    // Inicialmente, seção responsável deve estar oculta
    cy.get('#responsavelSection')
      .should('exist')
      .and('not.be.visible')

    // Selecionar "Sim" para menor de idade
    cy.get('#menorIdade')
      .select('sim')
      .should('have.value', 'sim')

    // Verificar que seção de responsável apareceu
    cy.get('#responsavelSection')
      .should('be.visible')

    // Verificar campos do responsável estão visíveis
    cy.get('#nomeResponsavel').should('be.visible')
    cy.get('#cpfResponsavel').should('be.visible')

    // Voltar para "Não"
    cy.get('#menorIdade')
      .select('nao')

    // Seção deve sumir novamente
    cy.get('#responsavelSection')
      .should('not.be.visible')
  })

  it('Deve realizar matrícula de menor com responsável e isenção', () => {
    
    // Dados do candidato menor
    cy.get('#nomeCompleto').type('João Pedro Oliveira')
    cy.get('#dataNascimento').type('2010-05-15')
    cy.get('#cpfCandidato').type('22222222222')

    // Selecionar menor de idade
    cy.get('#menorIdade').select('sim')

    // Verificar que seção apareceu
    cy.get('#responsavelSection').should('be.visible')

    // Preencher dados do responsável
    cy.get('#nomeResponsavel')
      .should('be.visible')
      .type('Ana Paula Oliveira')

    cy.get('#cpfResponsavel')
      .type('33333333333')
      .should('have.value', '333.333.333-33')

    // Dados de contato
    cy.get('#email').type('ana.oliveira@email.com')
    cy.get('#telefone').type('81988888888')

    // Endereço
    cy.get('#cep').type('51020120')
    cy.get('#cep').blur()
    cy.wait(2000)

    cy.get('#numero').type('50')

    // Curso
    cy.get('#instrumento').select('violao')
    cy.get('#nivelExperiencia').select('basico')

    // MARCAR isenção de mensalidade
    cy.get('#solicitaIsencao')
      .should('not.be.checked')
      .check()
      .should('be.checked')

    // Submeter
    cy.get('button[type="submit"]').click()

    // Aguardar verificação (2 CPFs: candidato + responsável)
    cy.get('#loading', { timeout: 1000 }).should('be.visible')
    cy.wait(4000)

    // Verificar sucesso
    cy.get('#sucessoModal', { timeout: 10000 })
      .should('be.visible')

    cy.get('#protocoloNumero')
      .should('not.be.empty')
  })

  it('Deve validar campos do responsável quando menor de idade', () => {
    
    // Preencher dados básicos
    cy.get('#nomeCompleto').type('Criança Teste')
    cy.get('#dataNascimento').type('2015-01-01')
    cy.get('#cpfCandidato').type('11111111111')

    // Selecionar menor
    cy.get('#menorIdade').select('sim')

    // NÃO preencher dados do responsável
    
    // Preencher restante do formulário
    cy.get('#email').type('teste@email.com')
    cy.get('#telefone').type('81999999999')
    cy.get('#cep').type('50030230')
    cy.get('#cep').blur()
    cy.wait(2000)
    cy.get('#numero').type('10')
    cy.get('#instrumento').select('piano')
    cy.get('#nivelExperiencia').select('iniciante')

    // Tentar submeter sem preencher responsável
    cy.get('button[type="submit"]').click()

    // Deve ter campos inválidos (validação HTML5)
    // Modal de sucesso NÃO deve aparecer
    cy.get('#sucessoModal').should('not.have.class', 'show')
  })

  it('Deve formatar CPF do responsável corretamente', () => {
    
    cy.get('#menorIdade').select('sim')
    
    cy.get('#cpfResponsavel')
      .should('be.visible')
      .type('99999999999')
      .should('have.value', '999.999.999-99')
  })

})