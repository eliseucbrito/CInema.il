### 1\. Visão Geral da Arquitetura

O serviço funcionará como uma **API REST** que recebe pedidos de envio. No entanto, para não travar o cliente enquanto o servidor SMTP processa o envio, usaremos uma **Fila (Queue)**.

  * **Entrada:** POST `/email/send` (Protegido por Keycloak)
  * **Processamento:** Validação DTO -\> Autenticação -\> Enfileiramento (Redis/BullMQ).
  * **Worker:** Consome a fila -\> Renderiza Template -\> Envia via SMTP (Nodemailer) e Google OAuth2 -\> Atualiza Status.

-----

### 2\. Estrutura de Pastas Sugerida (Modular/DDD)

Vamos manter uma estrutura limpa, separando a camada de apresentação (Controllers) da regra de negócio (Services) e infraestrutura.

```text
src/
├── app.module.ts
├── common/                  # Decorators, Filters, Guards globais
│   ├── guards/
│   │   └── keycloak-auth.guard.ts
│   └── filters/
├── config/                  # Configurações de env (SMTP, Keycloak, Redis)
├── modules/
│   ├── auth/                # Módulo de integração com Keycloak
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── email/               # Domínio Principal
│   │   ├── email.controller.ts
│   │   ├── email.service.ts
│   │   ├── email.module.ts
│   │   ├── email.processor.ts # Worker da Fila (BullMQ)
│   │   ├── dto/
│   │   │   └── send-email.dto.ts
│   │   └── interfaces/
│   │       └── email-payload.interface.ts
│   └── health/              # Health checks (Kubernetes/Docker)
└── templates/               # Templates de email (Handlebars/EJS)
    ├── default.hbs
    └── welcome.hbs
```

-----

### 3\. Roteiro Técnico (Abordagem TDD)

Como vamos usar TDD, o ciclo para cada etapa será: **Red** (Escrever teste que falha) -\> **Green** (Implementar o mínimo para passar) -\> **Refactor** (Melhorar o código).

#### Etapa 1: Configuração do Ambiente e Ferramentas

  * **Ação:** Inicializar NestJS, configurar Jest, ESLint e instalar dependências (`@nestjs-modules/mailer`, `nodemailer`, `@nestjs/bull`, `handlebars`).
  * **Infra:** Configurar `docker-compose.yml` com **Redis** (para filas) e **Mailhog** (servidor SMTP fake para testar visualmente os emails localmente sem enviar de verdade).

#### Etapa 2: Definição do Contrato (DTO) e Validação

Antes de qualquer lógica, definimos *o que* vamos receber.

1.  **Teste (Red):** Criar teste unitário verificando se um payload sem `to`, `subject` ou `body` lança erro.
2.  **Implementação (Green):** Criar o `SendEmailDto` usando `class-validator`.
      * *Nota:* Aqui definimos a estrutura dinâmica. O `from` pode ser opcional (usar default) ou obrigatório.
3.  **Teste de Remetente (Red):** Testar validação de regex para garantir que o remetente seja `@cin.ufpe.br`.

#### Etapa 3: Lógica de Envio (Service) com Mock

Não testamos o envio real no teste unitário, testamos se o serviço *chama* o provedor de email.

1.  **Teste (Red):** Criar `email.service.spec.ts`.
      * Cenário: "Deve chamar o mailerService.sendMail com os argumentos corretos".
      * Cenário: "Deve aceitar remetentes dinâmicos (`support@...`, `graduate@...`)".
2.  **Implementação (Green):** Implementar o `EmailService`. Injetar o `MailerService` (do NestJS) e configurar o método `send`.
      * *Importante:* A configuração do `MailerModule` deve permitir sobrescrever o `from` padrão global.

#### Etapa 4: Implementação de Filas (BullMQ)

Para escalar, o Controller não envia o email, ele coloca na fila.

1.  **Teste (Red):** O teste do Controller deve verificar se o `Queue.add` foi chamado, e não o `MailerService.send`.
2.  **Implementação (Green):**
      * Configurar `BullModule`.
      * Criar o `EmailProcessor` (Consumer) que move a lógica de envio (criada na etapa 3) para dentro do método `process`.
      * O Controller agora apenas valida o DTO e adiciona o job no Redis.

#### Etapa 5: Autenticação com Keycloak (API Keys)

Aqui validaremos se o microserviço chamador tem permissão.

  * **Estratégia:** Utilizar o fluxo **Client Credentials** do OAuth2. O microserviço cliente envia um Bearer Token ou usamos um Guard que valida uma API Key estática contra a introspecção do Keycloak.

<!-- end list -->

1.  **Teste (Red):** Teste E2E (`/test/app.e2e-spec.ts`).
      * Request sem header -\> 401 Unauthorized.
      * Request com key inválida -\> 403 Forbidden.
2.  **Implementação (Green):**
      * Criar `KeycloakAuthGuard`.
      * Usar `passport-keycloak` ou validar manualmente chamando o endpoint de *introspection* do Keycloak.
      * Configurar a validação de *Roles* (ex: o cliente tem a role `email-sender`?).

#### Etapa 6: Segurança do Remetente (Spoofing Check)

Para evitar que o serviço de "Biblioteca" envie emails em nome da "Reitoria", precisamos de uma validação lógica.

1.  **Teste (Red):** O usuário autenticado com ClientID "library-service" tenta enviar como "reitoria@cin.ufpe.br". O teste deve esperar um erro.
2.  **Implementação (Green):** Criar um mapa de permissões ou verificar nos atributos do token do Keycloak quais domínios/alias aquele cliente pode usar.

-----

### 4\. Exemplo Prático de TDD (O "Spec" do Service)

Aqui está como seria o arquivo de teste inicial para garantir o envio dinâmico antes mesmo de codificar o serviço:

```typescript
// src/modules/email/email.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;

  // Mock do MailerService para não enviar email real
  const mockMailerService = {
    sendMail: jest.fn().mockResolvedValue('Email sent'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('deve enviar um email com o remetente dinâmico correto', async () => {
    const dto = {
      to: 'aluno@cin.ufpe.br',
      from: 'graduate@cin.ufpe.br', // Remetente dinâmico
      subject: 'Resultado Seleção',
      body: '<p>Aprovado</p>',
    };

    await service.sendEmail(dto);

    // Asserção: Verificamos se a biblioteca de email foi chamada com o "from" correto
    expect(mockMailerService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: dto.to,
      from: dto.from,
      subject: dto.subject,
      html: dto.body,
    }));
  });
});
```

### 5\. Considerações sobre Keycloak e API Keys

No Keycloak, "API Key" pura não é um conceito nativo padrão. O ideal para comunicação *Machine-to-Machine* (M2M) é:

1.  Criar um **Client** no Keycloak para cada microserviço consumidor (ex: `cIn-academic-service`).
2.  Habilitar **Service Accounts Enabled**.
3.  O microserviço consumidor usa o `Client ID` e `Client Secret` para obter um **Access Token**.
4.  Seu microserviço de email valida esse Token.

**Por que isso é melhor que uma string API Key estática?**

  * O token expira (segurança).
  * Você pode adicionar **Roles** ao token (ex: `can-send-as-support`).
  * O Keycloak gerencia a auditoria.


### 6\. Configuração do Google OAuth2 (Pré-requisito de Infra)

Para que o envio funcione sem interação humana (Server-to-Server), precisamos de um Refresh Token.

Passo a Passo de Configuração:

GCP Console: Criar projeto > Habilitar Gmail API.

Credenciais: Criar OAuth Client ID (Web Application).

Autorização Inicial: Usar o OAuth Playground com o Client ID/Secret gerados para autorizar o escopo https://mail.google.com/.

Obtenção do Token: Trocar o Authorization Code pelo Refresh Token.

Google Workspace: Na conta sistema-notificacoes@cin.ufpe.br, adicionar support, graduate, etc., como Aliases.

Variáveis de Ambiente Necessárias (.env):

```text
# Keycloak (Entrada)
KEYCLOAK_AUTH_SERVER_URL=[https://auth.cin.ufpe.br](https://auth.cin.ufpe.br)...
KEYCLOAK_REALM=...

# Google OAuth2 (Saída)
EMAIL_USER=sistema-notificacoes@cin.ufpe.br
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REFRESH_TOKEN=1//04... (Token Permanente)
```

### Próximo passo

Gostaria que eu gerasse o arquivo `docker-compose.yml` contendo o setup do **Redis** e do **Mailhog** para você começar o ambiente de desenvolvimento agora?

### Observações

1. As funcionalidades de autenticação com Keycloak e Google OAuth2 só devem serem implementadas ao final da aplicação. Ao esbarrar nesses passos, ignore-os.