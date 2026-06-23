# banco-api-performance

## Teste de Login com k6

O projeto contém um teste de login em `tests/login.test.js` para validar a API REST de autenticação com cobertura de cenário positivo (credenciais válidas) e negativo (credenciais inválidas).

### Endpoint testado

- `POST http://localhost:3000/login`

### Como executar

**Smoke** — validação rápida (1 VU por 30s), use antes de qualquer carga real:

```bash
k6 run -e SCENARIO=smoke -e BASE_URL=http://localhost:3000 -e TEST_USER=julio.lima -e TEST_PASS=123456 tests/login.test.js
```

**Load** — carga progressiva com ramp-up, sustentação e ramp-down:

```bash
k6 run -e SCENARIO=load -e BASE_URL=http://localhost:3000 -e TEST_USER=julio.lima -e TEST_PASS=123456 tests/login.test.js
```

> `SCENARIO` padrão é `load` e `BASE_URL` padrão é `http://localhost:3000` — as variáveis têm fallback e são opcionais em ambiente local.

### Ciclo de execução do teste

| Fase | Responsável | O que faz |
|---|---|---|
| Antes dos VUs | `setup()` | Verifica se a API está acessível; aborta se não responder |
| Durante a carga | `export default` | Executa cenários positivo e negativo repetidamente |
| Após todos os VUs | `teardown()` | Registra o encerramento do teste |

### Cenários disponíveis

| Cenário | Executor | VUs | Duração total |
|---|---|---|---|
| `smoke` | constant-vus | 1 | 30s |
| `load` | ramping-vus | 0 → 10 → 0 | 1m 45s |

### Perfil de carga (cenário `load`)

| Fase | Duração | VUs |
|---|---|---|
| Ramp-up | 30s | 0 → 10 |
| Carga sustentada | 1m | 10 |
| Ramp-down | 15s | 10 → 0 |

### Thresholds configurados

| Métrica | Critério | O que mede |
|---|---|---|
| `http_req_failed` | `rate < 1%` | Falhas de rede e respostas 4xx/5xx não esperadas |
| `http_req_duration` | `p(95) < 500ms` e `p(99) < 1000ms` | Latência total da requisição |
| `http_req_waiting` | `p(95) < 400ms` | TTFB — tempo até o primeiro byte da resposta |
| `http_req_connecting` | `p(95) < 100ms` | Handshake TCP — abertura de conexão |

### O que o teste valida

**Cenário positivo (credenciais válidas):**
- Status `200`
- `Content-Type` com `application/json`
- Resposta contém `token` com formato JWT válido (`header.payload.signature`)

**Cenário negativo (credenciais inválidas):**
- Status `401` (Unauthorized)
- Resposta contém campo `message` com texto explicativo

### Tags nas requisições

Cada requisição carrega tags para filtragem de métricas em dashboards (Grafana, k6 Cloud):

| Tag | Valores possíveis |
|---|---|
| `endpoint` | `login` |
| `env` | `local`, `staging`, `production` (via `-e ENV=...`) |
| `scenario` | `smoke`, `load` |

### Arquivos relevantes

- `tests/login.test.js`
- `RESULTADO.md`
- `RECOMENDACOES.md`
- `RESULTADOS_DESEMPENHO.md`
- `dashboard.html`
