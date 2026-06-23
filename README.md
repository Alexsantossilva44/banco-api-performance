# banco-api-performance

## Teste de Login com k6

O projeto contém um teste de login em `tests/login.test.js` para validar a API REST de autenticação.

### Endpoint testado

- `POST http://localhost:3000/login`

### Como executar

```bash
k6 run tests/login.test.js
```

Com credenciais via variáveis de ambiente:

```bash
k6 run -e TEST_USER=julio.lima -e TEST_PASS=123456 tests/login.test.js
```

### Perfil de carga

| Fase | Duração | VUs |
|---|---|---|
| Ramp-up | 30s | 0 → 10 |
| Carga sustentada | 1m | 10 |
| Ramp-down | 15s | 10 → 0 |

### Thresholds configurados

| Métrica | Critério |
|---|---|
| `http_req_failed` | `rate < 1%` |
| `http_req_duration` | `p(95) < 500ms` e `p(99) < 1000ms` |
| `http_req_waiting` | `p(95) < 400ms` (TTFB) |
| `http_req_connecting` | `p(95) < 100ms` |

### O que o teste valida

- `status` 200
- `Content-Type` com `application/json`
- resposta JSON contendo `token`

### Recomendações de QA

- Incluir casos de teste com credenciais inválidas (esperado `401` ou `403`)
- Validar o schema completo do payload quando houver mais campos esperados

### Arquivos relevantes

- `tests/login.test.js`
- `RESULTADO.md`
- `RECOMENDACOES.md`
