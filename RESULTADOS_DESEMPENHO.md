# Resultados de Desempenho do Teste de Login

Este arquivo apresenta os resultados da última execução do `k6` em formato de tabela com métricas de HTTP, falhas, duração, iterações, rede e totais.

| Categoria | Métrica             | avg    | min    | med    | max    | p(90)  | p(95)  | Total / Observação             |
| --------- | ------------------- | ------ | ------ | ------ | ------ | ------ | ------ | ------------------------------ |
| HTTP      | http_req_duration   | 2.50ms | 0.51ms | 2.51ms | 4.81ms | 4.04ms | 4.13ms | smoke (29 requisições)         |
| HTTP      | http_req_waiting    | -      | -      | -      | -      | -      | 3.96ms | TTFB p(95)                     |
| HTTP      | http_req_connecting | -      | -      | -      | -      | -      | 0.00ms | handshake TCP p(95)            |
| HTTP      | http_req_failed     | 0.00%  | -      | -      | -      | -      | -      | 0 falhas (0/29)                |
| HTTP      | http_reqs           | -      | -      | -      | -      | -      | -      | 29 requisições, 0.93/s         |
| EXECUTION | iteration_duration  | 2.21s  | 1.02s  | 2.41s  | 2.98s  | 2.78s  | 2.89s  | 14 iterações                   |
| EXECUTION | iterations          | -      | -      | -      | -      | -      | -      | 14 iterações, 0.45/s           |
| NETWORK   | data_received       | -      | -      | -      | -      | -      | -      | 10 kB (326 B/s)                |
| NETWORK   | data_sent           | -      | -      | -      | -      | -      | -      | 5.1 kB (166 B/s)               |
| TOTAL     | checks_total        | -      | -      | -      | -      | -      | -      | 70 checks (smoke, 14 iter × 5) |
| TOTAL     | checks_succeeded    | -      | -      | -      | -      | -      | -      | 100.00% (70/70)                |
| TOTAL     | checks_failed       | -      | -      | -      | -      | -      | -      | 0.00% (0/70)                   |

## Notas

- Resultados do cenário **smoke** (1 VU / 30s) — execução com todas as correções aplicadas.
- Cada iteração executa **5 checks**: `status 200`, `Content-Type JSON`, `JWT válido`, `status 401`, `campo error presente`.
- O `http_req_failed` não contabiliza o `401` (cenário negativo) nem o `405` do healthcheck, pois ambos usam `http.expectedStatuses()`.
- A API retorna `{"error":"..."}` nas respostas de erro — `validateErrorResponse()` aceita `error` com fallback para `message`.
- Thresholds: `http_req_failed rate<0.01` ✓ | `p(95)<500ms` ✓ | `p(99)<1000ms` ✓ | `http_req_waiting p(95)<400ms` ✓ | `http_req_connecting p(95)<100ms` ✓
- Os resultados são referentes à execução do arquivo `tests/login.test.js`.
