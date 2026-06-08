// Pure-JS local DynamoDB (no Java/Docker). Speaks the real DynamoDB wire
// protocol so the app's AWS SDK talks to it unchanged — the SDK picks up
// AWS_ENDPOINT_URL_DYNAMODB=http://localhost:8000 from .env.local.
import dynalite from "dynalite";

const port = Number(process.env.DYNALITE_PORT || 8000);
const server = dynalite({ createTableMs: 0, deleteTableMs: 0, updateTableMs: 0 });

server.listen(port, (err) => {
  if (err) {
    console.error("[dynalite] failed to start:", err);
    process.exit(1);
  }
  console.log(`[dynalite] in-memory DynamoDB listening on http://localhost:${port}`);
});
