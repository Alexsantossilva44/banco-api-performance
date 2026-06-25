# Recomendações de QA para o teste de login

- [x] Adicionar teste de carga com `stages` e `duration` contínuo para verificar estabilidade.
- [x] Usar `group()` para separar claramente setup, execução e validação no relatório do `k6`.
- [x] Documentar os endpoints e payloads testados no README ou no relatório de QA.
- [x] Configurar `thresholds` abrangentes: p(95), p(99), TTFB e handshake TCP.
- [x] Externalizar credenciais via variáveis de ambiente (`__ENV`).
- [x] Criar cenário de teste com credenciais inválidas para verificar resposta `401`.
- [x] Validar o schema do payload de resposta além da presença de `token` — formato JWT verificado.
- [x] Usar `setup()` e `teardown()` para controlar o ciclo de vida do teste.
- [x] Adicionar múltiplos cenários (`smoke` e `load`) selecionáveis via variável de ambiente.
- [x] Externalizar a URL base via `__ENV.BASE_URL` para portabilidade entre ambientes.
- [x] Adicionar tags nas requisições (`endpoint`, `env`, `scenario`) para filtragem em dashboards.
- [x] Usar `http.expectedStatuses()` para não distorcer métricas em testes de cenário negativo.
- [x] Adicionar log de diagnóstico (`console.error` / `console.warn`) para facilitar debug em carga.
- [x] Aplicar `expectedStatuses(200, 404, 405)` no healthcheck do `setup()` — `GET /login` retorna 405 por design e não deve ser contabilizado como falha.
- [x] Adaptar `validateErrorResponse()` para aceitar o campo `error` retornado pela API, com fallback para `message` para compatibilidade futura.
- [ ] Verificar o comportamento do endpoint quando o corpo da requisição contém campos ausentes ou inválidos.
- [ ] Registrar os resultados do teste em um relatório único para comparar timings e falhas entre execuções.
