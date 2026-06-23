# Resultado do Teste de Login

Este arquivo sumariza o que foi implementado em `tests/login.test.js` e os resultados da execução.

## Configuração atual do teste

| Item | Descrição | Resultado |
| ---- | --------- | --------- |
| Endpoint testado | `POST http://localhost:3000/login` | Correto para o backend `banco-api` |
| BASE_URL | Via `__ENV.BASE_URL` com fallback `http://localhost:3000` | Troca de ambiente sem alterar o código |
| Cenários disponíveis | `smoke` (1 VU / 30s) e `load` (ramp-up 30s → 1m sustentado → ramp-down 15s com 10 VUs) | Selecionável via `-e SCENARIO=smoke\|load` |
| Credenciais | Via `__ENV.TEST_USER` / `__ENV.TEST_PASS` com fallback inline | Seguro e portável |
| `setup()` | Verifica disponibilidade da API antes de iniciar os VUs | Aborta o teste se o servidor estiver fora do ar |
| `teardown()` | Registra encerramento após todos os VUs finalizarem | Ponto de extensão para limpeza de dados |
| Tags nas requisições | `endpoint`, `env`, `scenario` em cada request | Filtragem de métricas no Grafana / k6 Cloud |
| Cenário positivo | Credenciais válidas → status `200` + token JWT + Content-Type JSON | Valida o fluxo esperado |
| Cenário negativo | Credenciais inválidas → status `401` + mensagem de erro | Valida segurança e comportamento de rejeição |
| `http.expectedStatuses(401)` | Marca `401` como status esperado no cenário negativo | Impede que o k6 contabilize `401` como falha no `http_req_failed` |
| Validação JWT | Verifica formato `header.payload.signature` (3 partes separadas por ponto) | Detecta mudança de contrato de resposta da API |
| Log de diagnóstico | `console.error` / `console.warn` em respostas inesperadas | Facilita debug durante execução de carga |
| `k6` thresholds | `http_req_failed rate<0.01`<br>`http_req_duration p(95)<500ms, p(99)<1000ms`<br>`http_req_waiting p(95)<400ms`<br>`http_req_connecting p(95)<100ms` | Abrangem latência, TTFB, TCP e confiabilidade |
| Principal correção histórica | Ajuste da rota de `/api/login` para `/login` | Resolveu o erro `404 Cannot POST /api/login` |

<sup>1</sup> Grupos no relatório: `login flow — valid credentials`, `login flow — invalid credentials`, `send authentication request`, `validate response payload`, `validate error response payload`.

## Checks configurados por iteração

| Grupo | Check | Critério |
|---|---|---|
| Positivo | `valid login — status is 200` | `r.status === 200` |
| Positivo | `valid login — content-type is json` | Header contém `application/json` |
| Positivo | `valid login — response contains valid JWT token` | Token existe, é string e tem 3 partes separadas por `.` |
| Negativo | `invalid login — status is 401` | `r.status === 401` |
| Negativo | `invalid login — response contains error message` | Campo `message` presente e não vazio |

## Insight QA - Informação Mais Preciosa

A **combinação de métricas mais importante** para validar a qualidade deste endpoint:

| Critério | Evidência | Impacto |
| -------- | --------- | ------- |
| **Checks positivos: 100%** | Status 200, Content-Type e JWT válido passaram | Prova que o fluxo esperado funciona |
| **Checks negativos: 100%** | Status 401 e mensagem de erro presentes | Prova que a API rejeita acessos indevidos corretamente |
| **http_req_failed: 0.00%** | Nenhuma falha não esperada nas requisições | Endpoint confiável e estável |
| **Thresholds atendidos** | p(95) < 500ms, p(99) < 1000ms, TTFB < 400ms | Performance dentro da especificação |

**Conclusão**: A combinação garante **funcionalidade** + **segurança** + **confiabilidade** + **performance**, permitindo:

- Automatizar em CI/CD com segurança
- Detectar regressões de comportamento e de segurança rapidamente
- Validar que o endpoint está pronto para produção
