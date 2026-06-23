# Resultados de Desempenho do Teste de Login

Este arquivo apresenta os resultados da última execução do `k6` em formato de tabela com métricas de HTTP, falhas, duração, iterações, rede e totais.

| Categoria | Métrica            | avg    | min    | med    | max     | p(90)   | p(95)   | Total / Observação      |
| --------- | ------------------ | ------ | ------ | ------ | ------- | ------- | ------- | ----------------------- |
| HTTP      | http_req_duration  | 1.68ms | 1.37ms | 1.52ms | 2.11ms  | 2.06ms  | 2.08ms  | 5 requisições           |
| HTTP      | http_req_failed    | 0.00%  | -      | -      | -       | -       | -       | 0 falhas (0/5)          |
| HTTP      | http_reqs          | -      | -      | -      | -       | -       | -       | 5 requisições, 199.10/s |
| EXECUTION | iteration_duration | 5.02ms | 1.52ms | 2.56ms | 16.39ms | 10.87ms | 13.63ms | 5 iterações             |
| EXECUTION | iterations         | -      | -      | -      | -       | -       | -       | 5 iterações, 199.10/s   |
| NETWORK   | data_received      | -      | -      | -      | -       | -       | -       | 2.1 kB (83 kB/s)        |
| NETWORK   | data_sent          | -      | -      | -      | -       | -       | -       | 870 B (35 kB/s)         |
| TOTAL     | checks_total       | -      | -      | -      | -       | -       | -       | 15 checks               |
| TOTAL     | checks_succeeded   | -      | -      | -      | -       | -       | -       | 100.00% (15/15)         |
| TOTAL     | checks_failed      | -      | -      | -      | -       | -       | -       | 0.00% (0/15)            |

## Notas

- Os resultados acima foram gerados com a configuração anterior (`vus: 1`, `iterations: 5`) e representam a baseline inicial do endpoint.
- A configuração atual usa `stages` com 10 VUs e duração total de 1m 45s — os próximos resultados refletirão carga concorrente real.
- Thresholds atuais: `http_req_failed rate<0.01`, `http_req_duration p(95)<500ms` e `p(99)<1000ms`, `http_req_waiting p(95)<400ms`, `http_req_connecting p(95)<100ms`.
- Os resultados são referentes à execução do arquivo `tests/login.test.js`.
