# Feature: Email Templates

## Visão Geral
Esta feature permite o envio de emails utilizando templates pré-definidos (ex: Handlebars). O cliente pode optar por enviar um corpo de email estático (HTML/Text) ou indicar um template e fornecer os parâmetros necessários para sua renderização.

## Requisitos

1.  **Identificação de Uso de Template:**
    *   O endpoint de envio deve aceitar um campo que indique se um template será usado (ex: `template` ou `useTemplate`).
    *   Alternativamente, a presença do campo `template` (nome do template) pode indicar implicitamente o uso.

2.  **Parâmetros do Template:**
    *   Se um template for selecionado, o cliente deve enviar um objeto contendo as variáveis necessárias para aquele template (ex: `context` ou `variables`).

3.  **Validação:**
    *   **Existência:** Verificar se o template solicitado existe no sistema.
    *   **Completude:** Verificar se todas as variáveis obrigatórias para o template escolhido foram fornecidas.
    *   **Exclusividade:** Não deve ser permitido enviar `body` (conteúdo estático) e `template` simultaneamente, ou deve haver uma precedência clara.

## Exemplos de Testes Unitários (Descrição)

1.  **Deve falhar se o template solicitado não existir:**
    *   *Cenário:* O cliente envia `template: 'non_existent_template'`.
    *   *Resultado Esperado:* Erro 400 Bad Request indicando que o template não foi encontrado.

2.  **Deve falhar se variáveis obrigatórias do template estiverem faltando:**
    *   *Cenário:* O template 'welcome' exige `name` e `link`. O cliente envia apenas `name`.
    *   *Resultado Esperado:* Erro 400 Bad Request listando os campos faltantes.

3.  **Deve falhar se `template` e `body` forem enviados juntos:**
    *   *Cenário:* O cliente envia `template: 'welcome'` e `body: '<p>Ola</p>'`.
    *   *Resultado Esperado:* Erro 400 Bad Request informando conflito de parâmetros.

4.  **Deve passar se o template existir e todas as variáveis forem fornecidas:**
    *   *Cenário:* O cliente envia `template: 'welcome'` e `context: { name: 'João', link: '...' }`.
    *   *Resultado Esperado:* Sucesso (201 Created/200 OK) e o email enfileirado com os dados do template.

5.  **Deve passar se não usar template e enviar apenas o body:**
    *   *Cenário:* O cliente não envia `template`, mas envia `body`, `subject`, `to`.
    *   *Resultado Esperado:* Sucesso, processamento padrão de email estático.
