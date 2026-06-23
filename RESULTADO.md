# Resultado do Teste de Login

Este arquivo sumariza o que foi feito em `tests/login.test.js` e o resultado da execução do teste.

| Item                     | Descrição                                                                                                                                            | Resultado                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Endpoint testado         | `POST http://localhost:3000/login`                                                                                                                   | Correto para o backend `banco-api`           |
| Configuração de execução | `stages`: ramp-up 30s → 1m sustentado → ramp-down 15s com 10 VUs                                                                                   | Carga progressiva e concorrente              |
| Credenciais              | Via `__ENV.TEST_USER` / `__ENV.TEST_PASS` com fallback inline                                                                                        | Configurável sem alterar o código            |
| Validações configuradas  | 1. status 200<br>2. `Content-Type` JSON<br>3. payload contém `token`                                                                                 | Todas passaram                               |
| `k6` thresholds          | `http_req_failed rate<0.01`<br>`http_req_duration p(95)<500ms, p(99)<1000ms`<br>`http_req_waiting p(95)<400ms`<br>`http_req_connecting p(95)<100ms` | Abrangem latência, TTFB e confiabilidade     |
| Principal correção       | Ajuste da rota de `/api/login` para `/login`                                                                                                         | Resolveu o erro `404 Cannot POST /api/login` |
| Comentários QA           | Grupo de testes criado com `group()`<sup>1</sup>                                                                                                     | Facilita análise e leitura do relatório      |

<sup>1</sup> O teste agora possui grupos como `login flow`, `send authentication request` e `validate response payload`.

## Recomendações QA

- Adicionar cenário de erro com credenciais inválidas para verificar o comportamento `401` ou `403`.
- Validar o schema completo do payload quando houver mais campos esperados além de `token`.

## Insight QA - Informação Mais Preciosa

A **métrica mais importante para validar a qualidade deste endpoint** é a combinação de:

| Critério                         | Evidência                                              | Impacto                                     |
| -------------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| **Checks: 100% sucesso (30/30)** | Todas as validações (status 200, JSON, token) passaram | Prova que o comportamento esperado funciona |
| **http_req_failed: 0.00%**       | Nenhuma falha nas requisições                          | Endpoint é confiável e não quebra           |
| **Thresholds atendidos**         | p(95) < 500ms, p(99) < 1000ms, TTFB < 400ms           | Performance está dentro da especificação    |

**Conclusão**: A combinação garante **funcionalidade** + **confiabilidade** + **performance**, permitindo:

- Automatizar em CI/CD com segurança
- Detectar regressões rapidamente
- Validar que o endpoint está pronto para produção
