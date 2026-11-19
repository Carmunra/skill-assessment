# Demonstração do desafio 2 (backend)

[Assistir ao vídeo do CRUD](backend-crud-demo.mp4)

O vídeo apresenta, em sequência, a saída de uma execução real de `backend/src/scripts/smoke-test.js` contra a API Node.js e um PostgreSQL local. O teste autentica o administrador, cria um aluno temporário, consulta, atualiza, altera o status e exclui o registro. Também confere validação de ID, email duplicado e resposta 404 após a exclusão.

Para repetir: configure e inicie o banco e a API conforme o README principal. Depois, no diretório `backend`, defina `TEST_PASSWORD` com a senha do administrador de demonstração e execute `node src/scripts/smoke-test.js`. Se a API não estiver em `http://localhost:5007/api/v1`, defina também `TEST_BASE_URL`.
