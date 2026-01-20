# Cenários de Teste - Sistema de Matrícula
## Conservatório de Música de Pernambuco

**Documento de Testes Manuais e Automatizados**  
**Versão:** 1.1  
**Data:** Janeiro 2026  
**Autor:** Equipe de QA - Conservatório PE

---

## Cenário 1: Cadastro de Candidato Maior de Idade com Sucesso

### Título
Realizar matrícula de candidato maior de idade sem pendências financeiras

### Objetivo
Verificar se o sistema permite cadastrar um candidato maior de 18 anos com todos os dados válidos e sem inadimplência, gerando protocolo de matrícula com sucesso.

### Pré-condições
- Sistema acessível em localhost
- CPF do candidato não possui pendências financeiras
- CEP válido para consulta na Brasil API
- Conexão com MongoDB ativa

### Passos Detalhados

1. Acessar a página inicial do sistema (`index.html`)
2. Preencher o campo "Nome Completo" com: `Maria Silva Santos`
3. Preencher "Data de Nascimento" com: `01/01/2000` (maior de 18 anos)
4. Preencher "CPF do Candidato" com: `111.111.111-11`
5. Manter "O candidato é menor de idade?" como: `Não`
6. Preencher "E-mail" com: `maria.silva@email.com`
7. Preencher "Telefone/WhatsApp" com: `(81) 99999-9999`
8. Preencher "CEP" com: `50030-230` (CEP válido de Recife)
9. Aguardar preenchimento automático de Logradouro, Bairro, Cidade e UF
10. Preencher "Número" com: `100`
11. Preencher "Complemento" (opcional) com: `Apto 201`
12. Selecionar "Instrumento" como: `Piano`
13. Selecionar "Nível de Experiência" como: `Iniciante (Nunca estudou)`
14. Não marcar a opção "Solicitar isenção de mensalidade"
15. Clicar no botão "Processar Matrícula"
16. Aguardar verificação de inadimplência

### Resultado Esperado

- Sistema exibe indicador de loading durante verificação
- Após verificação bem-sucedida, modal de sucesso é exibido
- Modal contém número de protocolo único (formato: `PROT-XXXXXXXX`)
- Sistema exibe orientações sobre próximos passos
- Mensagem de confirmação indica envio de e-mail
- Formulário é limpo ao fechar o modal
- Dados são salvos no MongoDB

### Critérios de Aceitação

- Todos os campos obrigatórios (*) validados
- CPF formatado automaticamente (XXX.XXX.XXX-XX)
- Telefone formatado automaticamente
- CEP consulta Brasil API e preenche campos
- Sem erros de console do navegador
- Modal de sucesso aparece em menos de 5 segundos

### Resultados da Execução Automatizada

**Status:** Parcialmente Aprovado (75% de sucesso)  
**Total de Testes:** 4  
**Aprovados:** 3  
**Falhados:** 1  
**Tempo de Execução:** 24 segundos

| Teste | Status | Observações |
|-------|--------|-------------|
| Validar campos obrigatórios | PASSOU | Validação funcionando corretamente |
| Formatar CPF automaticamente | PASSOU | Formatação aplicada conforme esperado |
| Formatar telefone automaticamente | PASSOU | Máscara de telefone funcionando |
| Realizar matrícula completa | FALHOU | Elemento de loading não aparece visualmente |

**Problema Identificado:** O elemento `#loading` existe no DOM mas permanece com `display: none`, impedindo a validação visual do loading.

**Ação Recomendada:** Adicionar lógica para exibir o loading ou ajustar o teste para não validar visibilidade.

---

## Cenário 2: Cadastro de Candidato Menor de Idade

### Título
Realizar matrícula de candidato menor de 18 anos com dados do responsável legal

### Objetivo
Validar que o sistema exibe e valida corretamente os campos de responsável legal quando o candidato é menor de idade.

### Pré-condições
- Sistema acessível em localhost
- CPF do candidato e responsável sem pendências
- Conexão com MongoDB ativa

### Passos Detalhados

1. Acessar a página inicial do sistema
2. Preencher "Nome Completo" com: `João Pedro Oliveira`
3. Preencher "Data de Nascimento" com: `15/05/2010` (menor de 18 anos)
4. Preencher "CPF do Candidato" com: `222.222.222-22`
5. Selecionar "O candidato é menor de idade?" como: `Sim`
6. **VERIFICAR:** Seção "Dados do Responsável Legal" deve aparecer
7. Preencher "Nome do Responsável" com: `Ana Paula Oliveira`
8. Preencher "CPF do Responsável" com: `333.333.333-33`
9. Preencher "E-mail" com: `ana.oliveira@email.com`
10. Preencher "Telefone/WhatsApp" com: `(81) 98888-8888`
11. Preencher "CEP" com: `51020-120`
12. Aguardar preenchimento automático do endereço
13. Preencher "Número" com: `50`
14. Selecionar "Instrumento" como: `Violão`
15. Selecionar "Nível de Experiência" como: `Básico (Até 1 ano de estudo)`
16. Marcar opção "Solicitar isenção de mensalidade"
17. Clicar em "Processar Matrícula"

### Resultado Esperado

- Seção de responsável aparece dinamicamente ao selecionar "Sim"
- Campos do responsável tornam-se obrigatórios (*)
- Sistema valida CPF do responsável contra inadimplência
- Modal de sucesso exibe protocolo
- Informação sobre isenção é registrada
- Ambos CPFs (candidato + responsável) são verificados

### Critérios de Aceitação

- Seção responsável aparece/desaparece conforme seleção
- Validação dos 2 CPFs (candidato e responsável)
- Checkbox de isenção registrado corretamente
- Dados do responsável salvos no MongoDB

### Resultados da Execução Automatizada

**Status:** Parcialmente Aprovado (75% de sucesso)  
**Total de Testes:** 4  
**Aprovados:** 3  
**Falhados:** 1  
**Tempo de Execução:** 28 segundos

| Teste | Status | Observações |
|-------|--------|-------------|
| Exibir seção de responsável | PASSOU | Seção aparece corretamente ao selecionar menor |
| Validar campos do responsável | PASSOU | Validação de campos obrigatórios funcionando |
| Formatar CPF do responsável | PASSOU | Formatação aplicada corretamente |
| Realizar matrícula completa | FALHOU | Mesmo problema do loading do CT-01 |

**Problema Identificado:** Elemento de loading não é exibido visualmente.

**Ação Recomendada:** Mesma correção do CT-01.

---

## Cenário 3: Bloqueio por Inadimplência Financeira

### Título
Tentar realizar matrícula com CPF que possui pendência financeira

### Objetivo
Verificar se o sistema detecta e bloqueia matrícula de candidatos com inadimplência no CPF, exibindo modal informativo com detalhes da pendência.

### Pré-condições
- Sistema configurado com verificação de inadimplência ativa
- CPF de teste com pendência cadastrada no sistema
- MongoDB com histórico de inadimplências

### Passos Detalhados

1. Acessar a página inicial do sistema
2. Preencher "Nome Completo" com: `Carlos Eduardo Santos`
3. Preencher "Data de Nascimento" com: `10/03/1995`
4. Preencher "CPF do Candidato" com: `444.444.444-44` (CPF com pendência)
5. Selecionar "O candidato é menor de idade?" como: `Não`
6. Preencher campos de contato e endereço normalmente
7. Selecionar instrumento e nível de experiência
8. Clicar em "Processar Matrícula"
9. Aguardar verificação de inadimplência

### Resultado Esperado

- Sistema exibe loading "Verificando informações do candidato..."
- Após verificação, modal de "Pendência Financeira" é exibido
- Modal contém:
  - Ícone vermelho de alerta
  - Título "Matrícula Bloqueada - Pendência Financeira"
  - Detalhes da(s) pendência(s) encontrada(s)
  - Orientações para regularização
  - Contatos da secretaria (telefone, e-mail, endereço)
- Botão "Fechar e Limpar Formulário"
- Matrícula NÃO é processada
- Dados NÃO são salvos no MongoDB

### Critérios de Aceitação

- Verificação de inadimplência funciona corretamente
- Modal de pendência bloqueia o processo
- Detalhes da dívida são exibidos
- Formulário é limpo ao fechar modal
- Nenhum registro é criado no banco de dados

### Resultados da Execução Automatizada

**Status:** FALHOU COMPLETAMENTE (0% de sucesso)  
**Total de Testes:** 3  
**Aprovados:** 0  
**Falhados:** 3  
**Tempo de Execução:** 2min 17s

| Teste | Status | Observações |
|-------|--------|-------------|
| Bloquear matrícula com pendência | FALHOU | Loading não aparece, modal não é exibido |
| Exibir alerta de advertência | FALHOU | Modal de pendência não é exibido |
| Verificar inadimplência do responsável | FALHOU | Verificação não está funcionando |

**CRÍTICO:** A funcionalidade de verificação de inadimplência não está operacional.

**Problemas Identificados:**
1. Loading não é exibido
2. Modal de pendência não aparece mesmo com CPF inadimplente
3. Função de verificação pode não estar sendo chamada

**Ação Recomendada:** 
- Verificar se a função `verificarPendencias()` está sendo executada
- Confirmar se o CPF de teste retorna inadimplência do backend
- Adicionar logs para debug da verificação
- Testar manualmente a abertura do modal

---

## Cenário 4: Preenchimento Automático de Endereço via CEP

### Título
Validar consulta automática de endereço através da Brasil API

### Objetivo
Testar a integração com a Brasil API para preenchimento automático dos campos de endereço ao digitar um CEP válido.

### Pré-condições
- Conexão com internet ativa
- Brasil API acessível
- CEP válido para teste

### Passos Detalhados

1. Acessar a página inicial do sistema
2. Preencher campos básicos até chegar na seção de endereço
3. Clicar no campo "CEP"
4. Digitar CEP válido: `50030-230` (Av. Guararapes, Recife)
5. Clicar fora do campo ou pressionar TAB (evento `blur`)
6. **OBSERVAR:** Loading aparece durante consulta
7. **VERIFICAR:** Campos preenchidos automaticamente:
   - Logradouro: `Avenida Guararapes`
   - Bairro: `Santo Antônio`
   - Cidade: `Recife`
   - UF: `PE`
8. Alterar para CEP inválido: `00000-000`
9. Verificar mensagem de erro

### Resultado Esperado

**Para CEP válido:**
- Loading aparece brevemente
- Campos são preenchidos automaticamente
- Campos ficam editáveis (caso API retorne dados incompletos)
- Nenhum erro no console

**Para CEP inválido:**
- Alert de erro: "CEP não encontrado. Verifique o número digitado."
- Campos de endereço permanecem vazios/editáveis
- Sistema não trava

### Critérios de Aceitação

- Consulta à Brasil API funciona
- Timeout adequado (máx 10 segundos)
- Tratamento de erros implementado
- CEP formatado automaticamente (XXXXX-XXX)
- Campos editáveis após preenchimento automático

### Resultados da Execução Automatizada

**Status:** Aprovado com Ressalvas (85.7% de sucesso)  
**Total de Testes:** 7  
**Aprovados:** 6  
**Falhados:** 1  
**Tempo de Execução:** 1min 0s

| Teste | Status | Observações |
|-------|--------|-------------|
| Preencher endereço automaticamente | FALHOU | Bairro retornado diferente do esperado |
| Formatar CEP automaticamente | PASSOU | Máscara de CEP funcionando |
| Exibir erro para CEP inválido | PASSOU | Tratamento de erro funcionando |
| Permitir edição manual | PASSOU | Campos editáveis após preenchimento |
| Consultar CEP diferente | PASSOU | Atualização de campos funcionando |
| Exibir hint sobre consulta | PASSOU | Mensagem informativa presente |
| Validar formato de 8 dígitos | PASSOU | Validação de formato funcionando |

**Problema Identificado:** A API ViaCEP retornou "Cais do Apolo" ao invés de "Guararapes" para o CEP `50030-230`.

**Ação Recomendada:** Atualizar o teste com o valor real retornado pela API ou usar CEP diferente.

---

## Cenário 5: Interação com Assistente Virtual (Agente IA)

### Título
Utilizar o assistente virtual para tirar dúvidas sobre o processo seletivo

### Objetivo
Validar funcionamento do agente de IA, incluindo abertura do chat, envio de mensagens e recebimento de respostas contextualizadas.

### Pré-condições
- Sistema com agente IA configurado
- API do agente (Claude/OpenAI) acessível
- Conexão com internet

### Passos Detalhados

1. Acessar a página inicial do sistema
2. Localizar botão flutuante do "Assistente CPM" (canto inferior direito)
3. Clicar no botão do assistente
4. **VERIFICAR:** Janela de chat abre com mensagem de boas-vindas
5. Ler mensagem inicial do assistente
6. Digitar no campo de input: `Quais documentos preciso apresentar?`
7. Clicar no botão de enviar (ícone de avião)
8. Aguardar resposta do assistente
9. Enviar segunda mensagem: `Quanto custa a matrícula?`
10. Verificar resposta
11. Clicar no botão "X" para fechar o chat
12. Reabrir o chat e verificar histórico de mensagens

### Resultado Esperado

- Botão flutuante visível e responsivo
- Chat abre com animação suave
- Mensagem de boas-vindas é exibida automaticamente
- Mensagens do usuário aparecem alinhadas à direita (azul)
- Respostas do assistente aparecem à esquerda (cinza)
- Loading/digitando aparece enquanto aguarda resposta
- Respostas são contextualizadas sobre o processo seletivo
- Histórico de conversa é mantido na sessão
- Chat fecha suavemente ao clicar no "X"
- Interface responsiva e agradável

### Critérios de Aceitação

- Chat abre/fecha corretamente
- Mensagens enviadas e recebidas
- Respostas coerentes com o contexto
- Interface responsiva
- Histórico mantido durante a sessão
- Indicador de "digitando" funciona

### Resultados da Execução Automatizada

**Status:** Parcialmente Aprovado (44.4% de sucesso)  
**Total de Testes:** 9  
**Aprovados:** 4  
**Falhados:** 5  
**Tempo de Execução:** 3min 6s

| Teste | Status | Observações |
|-------|--------|-------------|
| Exibir botão flutuante | PASSOU | Botão visível e posicionado corretamente |
| Abrir/fechar janela do chat | PASSOU | Funcionalidade de toggle funcionando |
| Exibir mensagem de boas-vindas | FALHOU | Mensagem não é renderizada no DOM |
| Enviar e receber mensagem | FALHOU | Mensagens não aparecem no chat |
| Enviar com tecla Enter | FALHOU | Mensagens não são renderizadas |
| Manter histórico da conversa | FALHOU | Input desabilitado impedindo teste |
| Exibir indicador de digitando | PASSOU | Indicador de loading funcionando |
| Interface responsiva | PASSOU | Layout adaptativo funcionando |
| Não enviar mensagem vazia | FALHOU | Mensagens não renderizadas |

**CRÍTICO:** O sistema de mensagens do chat não está renderizando as mensagens no DOM.

**Problemas Identificados:**
1. Elemento `#agente-messages .agente-message` não é encontrado
2. Input do chat fica desabilitado em determinadas condições
3. Função `addMessage()` pode não estar executando corretamente

**Ação Recomendada:**
- Verificar se `addMessage()` está sendo chamada
- Adicionar logs para debug da renderização
- Conferir se elementos estão sendo criados no DOM
- Testar manualmente o envio de mensagens

---

## Resumo Geral dos Resultados

### Estatísticas por Cenário

| Cenário | Total | Passou | Falhou | Taxa de Sucesso |
|---------|-------|--------|--------|-----------------|
| CT-01   | 4     | 3      | 1      | 75.0%           |
| CT-02   | 4     | 3      | 1      | 75.0%           |
| CT-03   | 3     | 0      | 3      | 0.0%            |
| CT-04   | 7     | 6      | 1      | 85.7%           |
| CT-05   | 9     | 4      | 5      | 44.4%           |
| **Total** | **27** | **16** | **11** | **59.3%**   |

### Priorização de Correções

**ALTA PRIORIDADE (Bloqueadores):**
1. CT-03: Sistema de verificação de inadimplência (0% de sucesso)
2. CT-05: Sistema de mensagens do chat IA (44% de sucesso)

**MÉDIA PRIORIDADE:**
3. CT-01/CT-02: Indicador visual de loading
4. CT-04: Validação de dados retornados pela API

---

## Informações Adicionais

### Ferramentas Utilizadas
- **Framework de Testes:** Cypress 13.17.0
- **Linguagem:** JavaScript
- **Navegador:** Electron 118 (headless)
- **Node.js:** v22.20.0

### Dados de Teste

**CPFs para Teste:**
- `111.111.111-11` - Sem pendências
- `222.222.222-22` - Sem pendências
- `333.333.333-33` - Sem pendências (Responsável)
- `444.444.444-44` - **COM pendência**

**CEPs para Teste:**
- `50030-230` - Av. Guararapes, Recife
- `51020-120` - Boa Viagem, Recife
- `00000-000` - CEP inválido

### Ambientes de Teste
- **Local:** `http://localhost:5500` ou `http://127.0.0.1:5500`
- **Porta alternativa:** Verificar se Live Server usa porta diferente

### Observações Importantes

1. **MongoDB:** Certifique-se de que o MongoDB está rodando e acessível
2. **APIs Externas:** Brasil API e API do Agente IA devem estar funcionando
3. **CORS:** Configurar CORS adequadamente para desenvolvimento local
4. **Console:** Sempre verificar console do navegador para erros JavaScript

---

## Matriz de Rastreabilidade

| Cenário | Requisito Funcional | Prioridade | Status |
|---------|---------------------|------------|--------|
| CT-01 | Cadastro de candidato maior | Alta | Parcialmente Aprovado |
| CT-02 | Cadastro de menor com responsável | Alta | Parcialmente Aprovado |
| CT-03 | Verificação de inadimplência | Crítica | FALHOU |
| CT-04 | Consulta CEP automática | Média | Aprovado com Ressalvas |
| CT-05 | Assistente virtual IA | Baixa | Parcialmente Aprovado |

---

**Documento aprovado por:** Equipe de Desenvolvimento  
**Data da última revisão:** 20/01/2026  
**Versão:** 1.1