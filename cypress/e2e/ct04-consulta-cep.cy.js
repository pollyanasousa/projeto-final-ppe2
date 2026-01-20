// cypress/e2e/ct04-consulta-cep.cy.js

describe('CT-04: Preenchimento Automático de Endereço via CEP', () => {
  
  beforeEach(() => {
    cy.visit('/index.html')
  })

  it('Deve preencher endereço automaticamente com CEP válido', () => {
    
    // Preencher apenas dados mínimos para chegar no CEP
    cy.get('#nomeCompleto').type('Teste CEP')
    cy.get('#dataNascimento').type('2000-01-01')
    cy.get('#cpfCandidato').type('11111111111')

    // Antes de preencher CEP, campos devem estar vazios
    cy.get('#logradouro').should('have.value', '')
    cy.get('#bairro').should('have.value', '')
    cy.get('#cidade').should('have.value', '')
    cy.get('#uf').should('have.value', '')

    // Digitar CEP válido (Av. Guararapes, Recife)
    cy.get('#cep')
      .type('50030230')
      .should('have.value', '50030-230') // Formatado

    // Trigger blur para iniciar consulta
    cy.get('#cep').blur()

    // Aguardar consulta à Brasil API
    cy.wait(3000)

    // Verificar que logradouro foi preenchido
    cy.get('#logradouro')
      .should('not.have.value', '')
      .invoke('val')
      .should('include', 'Guararapes')

    // Verificar bairro
    cy.get('#bairro')
      .should('not.have.value', '')

    // Verificar cidade
    cy.get('#cidade')
      .should('have.value', 'Recife')

    // Verificar UF
    cy.get('#uf')
      .should('have.value', 'PE')

    // Verificar que campos continuam editáveis
    cy.get('#logradouro').should('not.be.disabled')
    cy.get('#bairro').should('not.be.disabled')
    cy.get('#cidade').should('not.be.disabled')
  })

  it('Deve formatar CEP automaticamente durante digitação', () => {
    
    cy.get('#cep')
      .type('50030230')
      .should('have.value', '50030-230')

    // Limpar e testar outro formato
    cy.get('#cep')
      .clear()
      .type('51020120')
      .should('have.value', '51020-120')
  })

  it('Deve exibir erro para CEP inválido', () => {
    
    cy.get('#cep')
      .type('00000000')
      .blur()

    // Aguardar tentativa de consulta
    cy.wait(2000)

    // Verificar se alert de erro foi exibido
    cy.get('#alertBox', { timeout: 5000 })
      .should('be.visible')
      .and('have.class', 'show')
      .and('contain', 'CEP não encontrado')

    // Campos devem permanecer vazios
    cy.get('#logradouro').should('have.value', '')
    cy.get('#bairro').should('have.value', '')
    cy.get('#cidade').should('have.value', '')
  })

  it('Deve permitir edição manual dos campos após preenchimento automático', () => {
    
    // Preencher com CEP válido
    cy.get('#cep')
      .type('50030230')
      .blur()

    cy.wait(3000)

    // Verificar preenchimento
    cy.get('#logradouro').should('not.have.value', '')

    // Editar manualmente o logradouro
    cy.get('#logradouro')
      .clear()
      .type('Rua Editada Manualmente')
      .should('have.value', 'Rua Editada Manualmente')

    // Editar bairro
    cy.get('#bairro')
      .clear()
      .type('Bairro Editado')
      .should('have.value', 'Bairro Editado')

    // Cidade e UF também devem ser editáveis
    cy.get('#cidade')
      .clear()
      .type('Outra Cidade')
      .should('have.value', 'Outra Cidade')
  })

  it('Deve consultar CEP diferente e atualizar campos', () => {
    
    // Primeiro CEP
    cy.get('#cep')
      .type('50030230')
      .blur()

    cy.wait(3000)

    cy.get('#cidade').should('have.value', 'Recife')

    // Limpar e digitar novo CEP
    cy.get('#cep')
      .clear()
      .type('51020120') // Boa Viagem
      .blur()

    cy.wait(3000)

    // Verificar que campos foram atualizados
    cy.get('#cidade').should('have.value', 'Recife')
    cy.get('#bairro').should('not.have.value', '')
  })

  it('Deve exibir hint sobre consulta automática', () => {
    
    // Verificar que há texto informativo sobre a API
    cy.get('#cep')
      .parent()
      .find('small')
      .should('contain', 'Brasil API')
  })

  it('Deve validar formato de CEP (8 dígitos)', () => {
    
    cy.get('#cep')
      .type('123') // CEP incompleto
      .should('have.value', '123')
    
    // Verificar maxlength
    cy.get('#cep')
      .should('have.attr', 'maxlength', '9') // XXXXX-XXX
  })

})