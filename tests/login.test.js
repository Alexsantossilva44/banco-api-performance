// ─────────────────────────────────────────────────────────────────────────────
// IMPORTAÇÕES
// ─────────────────────────────────────────────────────────────────────────────

// Módulo HTTP do k6 — responsável por enviar todas as requisições à API
import http from 'k6/http';
import { baseURL } from '../helpers/autenticacao.js';
import { postLogin, SCENARIO } from '../helpers/autenticacao.js';

// check  → valida se a resposta atende a um critério e registra o resultado no relatório
// group  → agrupa ações com um nome para facilitar a leitura do relatório final
// sleep  → pausa a execução, simulando o tempo que um usuário real leva entre ações
import { check, group, sleep } from 'k6';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DE AMBIENTE
// ─────────────────────────────────────────────────────────────────────────────

//const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// SCENARIO seleciona qual perfil de carga executar via linha de comando
//   Smoke (validação rápida):  k6 run -e SCENARIO=smoke tests/login.test.js
//   Load  (carga real):        k6 run -e SCENARIO=load  tests/login.test.js
//const SCENARIO = __ENV.SCENARIO || 'load';
//const postLogin = JSON.parse(open('../fixtures/postLogin.json'));

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO DE CENÁRIOS
// ─────────────────────────────────────────────────────────────────────────────

// Cada cenário tem um propósito diferente — um QA Senior nunca usa só um perfil
const scenarios = {
  // SMOKE: 1 VU por 30 segundos — confirma que o teste e a API funcionam antes de aplicar carga real
  // Use sempre antes de qualquer load test em ambiente novo ou após uma mudança de código
  smoke: {
    executor: 'constant-vus', // mantém um número fixo de VUs durante toda a duração
    vus: 1,
    duration: '30s',
    tags: { scenario: 'smoke' }, // tag propagada para todas as métricas deste cenário (aparece no Grafana/k6 Cloud)
  },

  // LOAD: carga progressiva com ramp-up, sustentação e ramp-down — simula um dia de uso real
  // Permite observar como a API se comporta à medida que usuários chegam e saem
  load: {
    executor: 'ramping-vus', // varia o número de VUs ao longo do tempo conforme os stages
    startVUs: 0, // começa sem nenhum usuário virtual ativo
    stages: [
      { duration: '30s', target: 10 }, // ramp-up: aumenta gradualmente de 0 para 10 VUs em 30 segundos
      { duration: '1m', target: 10 }, // sustentado: mantém 10 VUs simultâneos por 1 minuto
      { duration: '15s', target: 0 }, // ramp-down: reduz para 0 VUs em 15 segundos (encerramento suave)
    ],
    tags: { scenario: 'load' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// OPÇÕES DO TESTE
// ─────────────────────────────────────────────────────────────────────────────

// O objeto "options" é reconhecido automaticamente pelo k6 para configurar o teste
export const options = {
  // Ativa apenas o cenário escolhido — evita rodar smoke e load ao mesmo tempo por engano
  scenarios: {
    [SCENARIO]: scenarios[SCENARIO],
  },

  // THRESHOLDS: critérios de aprovação/reprovação
  // Se qualquer threshold for violado, o k6 encerra com código de saída 1 (falha) — ideal para CI/CD
  thresholds: {
    http_req_failed: ['rate<0.01'], // no máximo 1% de falhas (erros de rede ou respostas 4xx/5xx não esperadas)
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% das respostas em menos de 500ms; 99% em menos de 1000ms
    http_req_waiting: ['p(95)<400'], // TTFB — tempo até o servidor começar a responder; p(95) abaixo de 400ms
    http_req_connecting: ['p(95)<100'], // handshake TCP — tempo de abertura de conexão; p(95) abaixo de 100ms
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SETUP — executado UMA VEZ antes de todos os VUs iniciarem
// ─────────────────────────────────────────────────────────────────────────────

// Use setup() para verificar pré-condições: API disponível, dados de teste existentes, etc.
// O valor retornado é passado automaticamente para a função principal e para teardown()
export function setup() {
  // Verifica se a API está de pé antes de iniciar a carga — evita disparar centenas de VUs contra um servidor caído
  // Adapte o endpoint para o que a sua API oferece (ex: /health, /status, /ping)
  const res = http.get(`${baseURL}/login`, {
    tags: { type: 'healthcheck' },
    responseCallback: http.expectedStatuses(200, 404, 405),
  });

  // Se a API não responder com um status conhecido (200 ou 404 já provam que está no ar),
  // lança um erro que interrompe o teste imediatamente com uma mensagem clara
  if (res.status === 0) {
    throw new Error(
      `API inacessível — nenhuma resposta recebida de ${baseURL}. Verifique se o servidor está rodando.`,
    );
  }

  console.log(
    `[SETUP] API acessível (status ${res.status}). Iniciando cenário: "${SCENARIO}"`,
  );

  // Retorna os dados que serão passados para cada iteração da função principal e para teardown()
  return { baseUrl: baseURL, scenario: SCENARIO };
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÕES AUXILIARES
// ─────────────────────────────────────────────────────────────────────────────

// Valida o payload de uma resposta de LOGIN BEM-SUCEDIDO
// Checagens em camadas: corpo existe → é objeto → tem campo token → é string → não está vazio → é JWT válido
function validateLoginResponsePayload(parsedBody) {
  if (!parsedBody || typeof parsedBody !== 'object') return false; // corpo ausente ou tipo inesperado
  if (typeof parsedBody.token !== 'string') return false; // campo token inexistente ou tipo errado
  if (parsedBody.token.length === 0) return false; // token vazio não é útil
  // Formato JWT: três partes separadas por ponto — "header.payload.signature"
  // Um token com formato diferente pode indicar que a API mudou o contrato de resposta
  if (parsedBody.token.split('.').length !== 3) return false;
  return true;
}

// Valida o payload de uma resposta de ERRO (ex: credenciais inválidas)
// A API deve sempre retornar uma mensagem explicativa — boa prática de design de API
function validateErrorResponse(parsedBody) {
  if (!parsedBody || typeof parsedBody !== 'object') return false;
  // A API retorna { "error": "..." } — campo "message" é fallback para outras implementações
  const msg = parsedBody.error ?? parsedBody.message;
  return typeof msg === 'string' && msg.length > 0;
}

// Tenta converter o corpo da resposta (string) em objeto JavaScript
// Retorna null em caso de falha, evitando que uma exceção quebre o teste inteiro
function parseBody(res) {
  try {
    return JSON.parse(res.body);
  } catch (e) {
    // Registra no console do k6 para facilitar diagnóstico — aparece no output do terminal
    console.error(
      `[PARSE ERROR] Corpo não é JSON válido. Status: ${res.status} | Body: ${res.body}`,
    );
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL — executada repetidamente por cada VU durante o cenário ativo
// ─────────────────────────────────────────────────────────────────────────────

// "data" recebe o objeto retornado por setup() — disponível em todas as iterações
export default function (data) {
  // Parâmetros base compartilhados entre todas as requisições desta iteração
  // Tags identificam cada requisição nas métricas — essenciais para filtrar no Grafana ou k6 Cloud
  const baseParams = {
    headers: { 'Content-Type': 'application/json' }, // informa ao servidor que o corpo é JSON
    tags: {
      endpoint: 'login', // nome do endpoint testado
      env: __ENV.ENV || 'local', // ambiente: local | staging | production
      scenario: SCENARIO, // qual cenário está rodando: smoke | load
    },
  };

  // ── CENÁRIO POSITIVO (Happy Path) ────────────────────────────────────────
  // Testa o fluxo com credenciais VÁLIDAS — o servidor deve aceitar e retornar um token JWT
  group('login flow — valid credentials', () => {
    const payload = JSON.stringify(postLogin);

    group('send authentication request', () => {
      const res = http.post(`${data.baseUrl}/login`, payload, baseParams);

      // Log de diagnóstico — registra detalhes quando algo inesperado acontece
      // Fundamental para debugar falhas durante uma execução de carga
      if (res.status !== 200) {
        console.error(
          `[FALHA] Credenciais válidas rejeitadas. Status: ${res.status} | Body: ${res.body}`,
        );
      }

      check(res, {
        'valid login — status is 200': (r) => r.status === 200,
        'valid login — content-type is json': (r) => {
          // Verifica nas duas capitalizações possíveis — servidores diferentes variam
          const ct = r.headers['Content-Type'] || r.headers['content-type'];
          return ct && ct.includes('application/json');
        },
      });

      group('validate response payload', () => {
        const parsed = parseBody(res);

        check(parsed, {
          // Valida que o token existe, é string não vazia e tem formato JWT (3 partes separadas por ponto)
          'valid login — response contains valid JWT token': (body) =>
            validateLoginResponsePayload(body),
        });
      });
    });
  });

  // ── CENÁRIO NEGATIVO ────────────────────────────────────────────────────
  // Testa o comportamento com credenciais INVÁLIDAS — um QA Senior sempre valida o que NÃO deve funcionar
  // A API deve rejeitar com 401 (Unauthorized) e retornar uma mensagem de erro clara
  group('login flow — invalid credentials', () => {
    const invalidPayload = JSON.stringify({
      username: 'usuario.invalido', // usuário inexistente no sistema
      senha: 'senhaErrada999', // senha incorreta
    });

    // IMPORTANTE: informa ao k6 que 401 é um status ESPERADO para esta requisição específica
    // Sem isso, o k6 contabilizaria o 401 como falha no threshold http_req_failed,
    // distorcendo a métrica de confiabilidade do endpoint
    const invalidParams = {
      ...baseParams,
      responseCallback: http.expectedStatuses(401),
    };

    group('send authentication request', () => {
      const res = http.post(
        `${data.baseUrl}/login`,
        invalidPayload,
        invalidParams,
      );

      // Log de diagnóstico para o cenário negativo — 401 é esperado, qualquer outro é suspeito
      if (res.status !== 401) {
        console.warn(
          `[AVISO] Credenciais inválidas retornaram status inesperado: ${res.status} | Body: ${res.body}`,
        );
      }

      check(res, {
        // A API DEVE retornar 401 — se retornar 200, há um bug crítico de segurança
        'invalid login — status is 401': (r) => r.status === 401,
      });

      group('validate error response payload', () => {
        const parsed = parseBody(res);

        check(parsed, {
          // A resposta de erro deve conter uma mensagem explicativa (ex: "Credenciais inválidas")
          // APIs que retornam corpo vazio em erros dificultam o diagnóstico em produção
          'invalid login — response contains error message': (body) =>
            validateErrorResponse(body),
        });
      });
    });
  });

  // Think time aleatório entre 1 e 3 segundos antes da próxima iteração
  // Simula o tempo que um usuário real leva entre uma ação e outra (think time)
  // Valor aleatório evita que todos os VUs disparem requisições exatamente no mesmo instante (thundering herd)
  sleep(Math.random() * 2 + 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEARDOWN — executado UMA VEZ após todos os VUs finalizarem
// ─────────────────────────────────────────────────────────────────────────────

// Use teardown() para limpeza de dados criados no setup(), notificações ou registro de resultados
// "data" recebe o mesmo objeto retornado por setup()
export function teardown(data) {
  console.log(
    `[TEARDOWN] Teste finalizado — cenário: "${data.scenario}" | base: ${data.baseUrl}`,
  );
}
