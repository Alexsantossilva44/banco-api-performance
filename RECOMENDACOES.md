# Recomendações de QA para o teste de login

- [x] Adicionar teste de carga com `stages` e `duration` contínuo para verificar estabilidade.
- [x] Usar `group()` para separar claramente setup, execução e validação no relatório do `k6`.
- [x] Documentar os endpoints e payloads testados no README ou no relatório de QA.
- [x] Configurar `thresholds` abrangentes: p(95), p(99), TTFB e handshake TCP.
- [x] Externalizar credenciais via variáveis de ambiente (`__ENV`).
- [ ] Criar cenário de teste com credenciais inválidas para verificar resposta `401` ou `403`.
- [ ] Validar o schema completo do payload de resposta, não apenas a presença de `token`.
- [ ] Verificar o comportamento do endpoint quando o corpo contém campos ausentes ou inválidos.
- [ ] Registrar os resultados do teste em um relatório único para comparar timings e falhas entre execuções.
