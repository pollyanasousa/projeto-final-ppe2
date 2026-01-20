// cypress/e2e/ct01-cadastro-maior-idade.cy.js

describe('CT-01: Cadastro de Candidato Maior de Idade', () => {
  
  beforeEach(() => {
    // Visita a página antes de cada teste
    cy.visit('/index.html')
  })

  it('Deve realizar matrícula de candidato maior de idade com sucesso', () => {
    
    // 1. Verificar se a página carregou corretamente
    cy.get('h1').should('contain', 'Conservatório de Música de Pernambuco')
    cy.get('#inscricaoForm').should('be.visible')

    // 2. Preencher nome completo
    cy.get('#nomeCompleto')
      .should('be.visible')
      .type('Maria Silva Santos')
      .should('have.value', 'Maria Silva Santos')

    // 3. Preencher data de nascimento (maior de idade)
    cy.get('#dataNascimento')
      .type('2000-01-01')
      .should('have.value', '2000-01-01')

    // 4. Preencher CPF (sem pendência)
    cy.get('#cpfCandidato')
      .type('11111111111')
      // Aguardar formatação automática
      .should('have.value', '111.111.111-11')

    // 5. Manter seleção "Não" para menor de idade
    cy.get('#menorIdade')
      .should('have.value', 'nao')

    // 6. Verificar que seção de responsável está oculta
    cy.get('#responsavelSection')
      .should('not.be.visible')

    // 7. Preencher e-mail
    cy.get('#email')
      .type('maria.silva@email.com')
      .should('have.value', 'maria.silva@email.com')

    // 8. Preencher telefone
    cy.get('#telefone')
      .type('81999999999')
      // Aguardar formatação automática
      .should('have.value', '(81) 99999-9999')

    // 9. Preencher CEP
    cy.get('#cep')
      .type('50030230')
      .should('have.value', '50030-230')

    // 10. Aguardar consulta de CEP e verificar preenchimento automático
    cy.get('#cep').blur() // Trigger blur event
    cy.wait(2000) // Aguardar resposta da API

    cy.get('#logradouro')
      .should('not.have.value', '')
      .and('not.be.disabled')
    
    cy.get('#bairro').should('not.have.value', '')
    cy.get('#cidade').should('not.have.value', '')
    cy.get('#uf').should('not.have.value', '')

    // 11. Preencher número
    cy.get('#numero')
      .type('100')
      .should('have.value', '100')

    // 12. Preencher complemento (opcional)
    cy.get('#complemento')
      .type('Apto 201')
      .should('have.value', 'Apto 201')

    // 13. Selecionar instrumento
    cy.get('#instrumento')
      .select('piano')
      .should('have.value', 'piano')

    // 14. Selecionar nível de experiência
    cy.get('#nivelExperiencia')
      .select('iniciante')
      .should('have.value', 'iniciante')

    // 15. Verificar que isenção NÃO está marcada
    cy.get('#solicitaIsencao')
      .should('not.be.checked')

    // 16. Submeter formulário
    cy.get('button[type="submit"]')
      .should('contain', 'Processar Matrícula')
      .click()

    // 17. Verificar loading aparece
    cy.get('#loading', { timeout: 1000 })
      .should('be.visible')

    // 18. Aguardar processamento (verificação de inadimplência)
    cy.wait(3000)

    // 19. Verificar que modal de sucesso aparece
    cy.get('#sucessoModal', { timeout: 10000 })
      .should('be.visible')
      .and('have.class', 'show')

    // 20. Verificar conteúdo do modal de sucesso
    cy.get('#sucessoModal h2')
      .should('contain', 'Matrícula Realizada com Sucesso')

    // 21. Verificar que número de protocolo foi gerado
    cy.get('#protocoloNumero')
      .should('not.be.empty')
      .invoke('text')
      .should('match', /PROT-\d{8}/) // Formato PROT-12345678

    // 22. Verificar orientações ao candidato
    cy.get('.success-info')
      .should('be.visible')
      .and('contain', 'e-mail de confirmação')
      .and('contain', 'documentação')

    // 23. Fechar modal
    cy.get('#sucessoModal button')
      .contains('Nova Matrícula')
      .click()

    // 24. Verificar que modal fechou
    cy.get('#sucessoModal')
      .should('not.have.class', 'show')

    // 25. Verificar que formulário foi limpo
    cy.get('#nomeCompleto')
      .should('have.value', '')
    
    cy.get('#cpfCandidato')
      .should('have.value', '')
  })

  it('Deve validar campos obrigatórios antes de submeter', () => {
    // Tentar submeter formulário vazio
    cy.get('button[type="submit"]').click()

    // HTML5 validation deve impedir submit
    cy.get('#nomeCompleto:invalid').should('exist')
    
    // Modal de sucesso NÃO deve aparecer
    cy.get('#sucessoModal').should('not.have.class', 'show')
  })

  it('Deve formatar CPF automaticamente durante digitação', () => {
    cy.get('#cpfCandidato')
      .type('11111111111')
      .should('have.value', '111.111.111-11')

    // Limpar e testar outro formato
    cy.get('#cpfCandidato')
      .clear()
      .type('123.456.789-00')
      .should('have.value', '123.456.789-00')
  })

  it('Deve formatar telefone automaticamente', () => {
    cy.get('#telefone')
      .type('81987654321')
      .should('have.value', '(81) 98765-4321')
  })

})