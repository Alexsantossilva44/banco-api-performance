# banco-api-performance

## Introducao

Este repositorio contem testes de performance para a API bancaria `banco-api`, escritos em JavaScript com K6. O objetivo e validar endpoints importantes da aplicacao, como autenticacao e transferencias, observando tempo de resposta, taxa de falhas e estabilidade da API sob diferentes perfis de execucao.

Repositorio GitHub:

```text
https://github.com/Alexsantossilva44/banco-api-performance
```

Os testes usam uma URL base configuravel por variavel de ambiente. Neste projeto, a variavel esperada para informar o endereco da API e `baseURL`.

Exemplo:

```bash
k6 run -e baseURL=http://localhost:3000 tests/login.test.js
```

> Atencao: variaveis de ambiente no K6 diferenciam letras maiusculas e minusculas. Por isso, use `baseURL` nos comandos de execucao.

## Tecnologias utilizadas

- JavaScript: linguagem usada para escrever os scripts de teste.
- K6: ferramenta de execucao dos testes de performance.
- K6 HTTP API: modulo usado para enviar requisicoes HTTP para a API.
- K6 Checks: validacoes funcionais durante a execucao dos testes.
- K6 Groups: organizacao dos fluxos testados dentro do relatorio.
- K6 Thresholds: criterios de aceitacao para metricas de performance.
- JSON: formato usado para massa de dados nos fixtures.

## Estrutura do repositorio

```text
banco-api-performance/
├── fixtures/
│   └── postLogin.json
├── helpers/
│   └── autenticacao.js
├── tests/
│   ├── login.test.js
│   └── transferencias.test.js
├── dashboard.html
├── README.md
├── README_2.md
├── RECOMENDACOES.md
├── RESULTADO.md
└── RESULTADOS_DESEMPENHO.md
```

## Objetivo de cada grupo de arquivos

### `tests/`

Contem os scripts de teste executados pelo K6.

- `login.test.js`: testa o endpoint de login com cenario positivo e negativo, validando status HTTP, retorno em JSON, token JWT e mensagem de erro para credenciais invalidas.
- `transferencias.test.js`: testa o endpoint de transferencias usando autenticacao via token obtido previamente.

### `helpers/`

Contem funcoes e configuracoes reutilizaveis pelos testes.

- `autenticacao.js`: centraliza a URL base da API, le os dados de login, define o cenario de execucao e possui a funcao `obterToken()` para autenticar e reutilizar o token em outros testes.

### `fixtures/`

Contem massas de dados usadas durante os testes.

- `postLogin.json`: payload com usuario e senha validos para autenticar na API.

### Arquivos de resultado e analise

Guardam evidencias, conclusoes e recomendacoes obtidas apos as execucoes.

- `RESULTADO.md`: resumo dos resultados de execucao.
- `RESULTADOS_DESEMPENHO.md`: analise das metricas de desempenho.
- `RECOMENDACOES.md`: melhorias sugeridas a partir dos resultados observados.
- `dashboard.html`: relatorio HTML gerado pelo dashboard web do K6.

### Arquivos de documentacao e configuracao

- `README.md`: documentacao principal existente do projeto.
- `README_2.md`: documentacao complementar com instalacao, estrutura e execucao.
- `.gitignore`: define arquivos e pastas que nao devem ser versionados, como `node_modules/`.

## Modo de instalacao e de execucao do projeto

### 1. Clonar o repositorio

```bash
git clone https://github.com/Alexsantossilva44/banco-api-performance.git
cd banco-api-performance
```

### 2. Instalar o K6

No Windows, usando Chocolatey:

```powershell
choco install k6
```

No macOS, usando Homebrew:

```bash
brew install k6
```

No Linux, consulte a documentacao oficial de instalacao do K6:

```text
https://grafana.com/docs/k6/latest/set-up/install-k6/
```

Confirme a instalacao:

```bash
k6 version
```

### 3. Subir a API alvo dos testes

Antes de executar os testes, a API bancaria precisa estar rodando. Em ambiente local, a URL padrao usada nos exemplos e:

```text
http://localhost:3000
```

### 4. Executar o teste de login

PowerShell:

```powershell
k6 run -e baseURL=http://localhost:3000 tests/login.test.js
```

Bash/Linux/macOS:

```bash
k6 run -e baseURL=http://localhost:3000 tests/login.test.js
```

### 5. Executar o teste de login por cenario

Smoke test:

```bash
k6 run -e baseURL=http://localhost:3000 -e SCENARIO=smoke tests/login.test.js
```

Load test:

```bash
k6 run -e baseURL=http://localhost:3000 -e SCENARIO=load tests/login.test.js
```

### 6. Executar o teste de transferencias

```bash
k6 run -e baseURL=http://localhost:3000 tests/transferencias.test.js
```

### 7. Executar com dashboard web em tempo real

O K6 permite acompanhar a execucao em tempo real usando o Web Dashboard. Para isso, use a variavel de ambiente `K6_WEB_DASHBOARD=true`.

PowerShell:

```powershell
$env:K6_WEB_DASHBOARD="true"
k6 run -e baseURL=http://localhost:3000 tests/login.test.js
```

Bash/Linux/macOS:

```bash
K6_WEB_DASHBOARD=true k6 run -e baseURL=http://localhost:3000 tests/login.test.js
```

Durante a execucao, o dashboard fica disponivel no endereco informado pelo proprio K6 no terminal, normalmente:

```text
http://127.0.0.1:5665
```

### 8. Executar com dashboard em tempo real e exportar relatorio HTML

Para acompanhar o relatorio em tempo real e exportar o resultado ao final da execucao, combine as variaveis `K6_WEB_DASHBOARD` e `K6_WEB_DASHBOARD_EXPORT`.

PowerShell:

```powershell
$env:K6_WEB_DASHBOARD="true"
$env:K6_WEB_DASHBOARD_EXPORT="html-report.html"
k6 run -e baseURL=http://localhost:3000 tests/login.test.js
```

Bash/Linux/macOS:

```bash
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=html-report.html k6 run -e baseURL=http://localhost:3000 tests/login.test.js
```

Ao final, o K6 gera o arquivo:

```text
html-report.html
```

Esse arquivo pode ser aberto no navegador para consultar o relatorio consolidado da execucao.
