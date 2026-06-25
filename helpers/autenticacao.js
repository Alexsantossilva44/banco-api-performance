import http from 'k6/http';

// BASE_URL centraliza a URL base da API — nunca hardcode URLs no corpo do teste
// Para trocar de ambiente sem alterar o código:
// k6 run tests/login.test.js -e BASE_URL=http://localhost:3000
export const baseURL = __ENV.BASE_URL || 'http://localhost:3000';

// SCENARIO seleciona qual perfil de carga executar via linha de comando
//   Smoke (validação rápida):  k6 run -e SCENARIO=smoke tests/login.test.js
//   Load  (carga real):        k6 run -e SCENARIO=load  tests/login.test.js
export const SCENARIO = __ENV.SCENARIO || 'load';
export const postLogin = JSON.parse(open('../fixtures/postLogin.json'));

export function obterToken() {
  const url = `${baseURL}/login`;

  const payload = JSON.stringify(postLogin);

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  return res.json('token');
}
