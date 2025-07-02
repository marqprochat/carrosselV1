# AI Carousel Generator

Este é um aplicativo da web que gera carrosséis para mídias sociais usando inteligência artificial. Os usuários podem inserir informações sobre sua empresa, escolher um tema e um modelo de IA, e o aplicativo irá gerar um carrossel de 5 slides com texto e imagens.

## Recursos

- Gera conteúdo de carrossel (texto e imagens) com base na entrada do usuário.
- Suporta vários modelos de IA: OpenAI (GPT-4 Turbo), Groq (LLaMA3) e Google (Gemini).
- Busca imagens de alta qualidade do Unsplash.
- Permite a edição do texto, fonte, cor, tamanho, e mais.
- Interface de arrastar e soltar para edição de layout.
- Visualização ao vivo do carrossel.

## Começando

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/)

### Instalação

1.  Clone o repositório:
    ```bash
    git clone https://github.com/seu-usuario/ai-carousel-generator.git
    ```
2.  Navegue até o diretório do projeto:
    ```bash
    cd ai-carousel-generator
    ```
3.  Instale as dependências:
    ```bash
    npm install
    ```

## Uso

1.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
2.  Abra seu navegador e acesse `http://localhost:5173`.
3.  Preencha as informações da empresa e o tema do carrossel.
4.  Selecione um modelo de IA.
5.  Clique em "Gerar Carrossel".
6.  Edite o carrossel gerado conforme necessário.

## Variáveis de Ambiente

Para usar os modelos de IA e o Unsplash, você precisará de chaves de API. Crie um arquivo `.env.local` na raiz do projeto e adicione as seguintes variáveis:

```
VITE_OPENAI_API_KEY="sua-chave-de-api-da-openai"
VITE_GROQ_API_KEY="sua-chave-de-api-da-groq"
VITE_GEMINI_API_KEY="sua-chave-de-api-da-gemini"
VITE_UNSPLASH_ACCESS_KEY="sua-chave-de-acesso-do-unsplash"
```

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Compila o aplicativo para produção.
- `npm run lint`: Executa o linter para verificar erros de código.
- `npm run preview`: Inicia um servidor de visualização para a compilação de produção.

## Tecnologias Utilizadas

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Zod](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)
