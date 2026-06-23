// Importa o módulo HTTP do k6 — é ele quem envia as requisições para a API
import http from 'k6/http';

// check: valida se a resposta atende a um critério (ex: status 200)
// group: agrupa ações no relatório, facilitando leitura dos resultados
// sleep: pausa a execução por um tempo, simulando o comportamento de um usuário real
import { check, group, sleep } from 'k6';

// "options" é o objeto de configuração reconhecido automaticamente pelo k6
export const options = {

  // "stages" define o perfil de carga em fases progressivas — mais realista que um número fixo de iterações
  stages: [
    { duration: '30s', target: 10 }, // fase 1 — aumenta gradualmente de 0 para 10 usuários virtuais em 30 segundos (ramp-up)
    { duration: '1m',  target: 10 }, // fase 2 — mantém 10 usuários simultâneos por 1 minuto (carga sustentada)
    { duration: '15s', target: 0  }, // fase 3 — reduz de 10 para 0 usuários em 15 segundos (ramp-down suave)
  ],

  // "thresholds" são os critérios de aprovação/reprovação do teste
  // se qualquer threshold for violado, o k6 encerra com status de falha
  thresholds: {
    http_req_failed:     ['rate<0.01'],               // no máximo 1% das requisições podem falhar (erro de rede ou status 4xx/5xx)
    http_req_duration:   ['p(95)<500', 'p(99)<1000'], // 95% das respostas devem chegar em menos de 500ms; 99% em menos de 1000ms
    http_req_waiting:    ['p(95)<400'],               // TTFB (tempo até o primeiro byte da resposta) deve ser menor que 400ms em 95% dos casos
    http_req_connecting: ['p(95)<100'],               // o handshake TCP (abertura de conexão) deve levar menos de 100ms em 95% dos casos
  },
};

// Função auxiliar que valida se o corpo da resposta tem o formato esperado
// Retorna true somente se: o corpo existir, for um objeto, tiver a chave "token" do tipo string e não vazia
function validateLoginResponsePayload(parsedBody) {
  return (
    parsedBody &&                              // garante que o corpo não é null nem undefined
    typeof parsedBody === 'object' &&          // garante que é um objeto JSON (não string, número, etc.)
    typeof parsedBody.token === 'string' &&    // garante que o campo "token" existe e é do tipo string
    parsedBody.token.length > 0               // garante que o token não é uma string vazia
  );
}

// Função principal do teste — o k6 executa este bloco repetidamente para cada usuário virtual (VU) durante os stages
export default function () {

  // "group" agrupa um conjunto de ações com um nome — aparece no relatório final para facilitar análise
  group('login flow', () => {

    // URL do endpoint de autenticação que será testado
    const url = 'http://localhost:3000/login';

    // Corpo da requisição em formato JSON — usa variáveis de ambiente se fornecidas, ou valores padrão como fallback
    // Para passar credenciais: k6 run -e TEST_USER=julio.lima -e TEST_PASS=123456 tests/login.test.js
    const payload = JSON.stringify({
      username: __ENV.TEST_USER || 'julio.lima', // __ENV lê variáveis de ambiente passadas via linha de comando
      senha:    __ENV.TEST_PASS || '123456',     // fallback garante que o teste funciona sem configuração extra
    });

    // Parâmetros extras da requisição — aqui define o cabeçalho que informa ao servidor que o corpo é JSON
    const params = {
      headers: {
        'Content-Type': 'application/json', // sem este cabeçalho, o servidor pode não interpretar o corpo corretamente
      },
    };

    // Subgrupo que isola o envio da requisição e a validação da resposta HTTP
    group('send authentication request', () => {

      // Envia a requisição POST com a URL, o corpo JSON e os parâmetros definidos acima
      // O resultado (status, headers, body, timings) fica armazenado na variável "res"
      const res = http.post(url, payload, params);

      // "check" executa validações na resposta e registra quantas passaram/falharam no relatório
      check(res, {

        // Verifica se o servidor retornou o código HTTP 200 (OK)
        'status is 200': (r) => r.status === 200,

        // Verifica se o cabeçalho Content-Type da resposta indica JSON
        // Testa nas duas capitalizações possíveis porque servidores diferentes podem variar
        'response content-type is json': (r) => {
          const contentType = r.headers['Content-Type'] || r.headers['content-type'];
          return contentType && contentType.includes('application/json');
        },
      });

      // Subgrupo que isola a validação do corpo (payload) da resposta
      group('validate response payload', () => {

        // Tenta converter o corpo da resposta (string) em objeto JavaScript
        let parsed = {};
        try {
          parsed = JSON.parse(res.body); // JSON.parse transforma a string JSON em objeto acessível
        } catch (e) {
          parsed = null; // se o corpo não for JSON válido, marca como null para o check falhar de forma controlada
        }

        // Valida se o objeto convertido contém o campo "token" com valor válido
        check(parsed, {
          'response contains token': (body) => validateLoginResponsePayload(body),
        });
      });
    });

    // Pausa com duração aleatória entre 1 e 3 segundos antes da próxima iteração
    // Simula o tempo que um usuário real levaria entre uma ação e outra (think time)
    // Usar valor aleatório evita que todos os VUs façam requisições exatamente no mesmo instante
    sleep(Math.random() * 2 + 1);
  });
}
