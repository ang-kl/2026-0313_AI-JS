// Tiny compatibility shim: adds a tagged-template `.sql` method to a plain `pg`
// Client, matching @vercel/postgres's `client.sql` call shape
// (`` client.sql`SELECT ... WHERE x=${y}` ``) so call sites written against
// @vercel/postgres keep working unchanged against plain `pg`. Same substitution
// api/ssoc.js and api/ssic.js already hand-write for their own `db.sql` wrapper -
// this just makes it reusable for the files that called @vercel/postgres's
// built-in `client.sql` directly (api/anatomy.js, api/ssic.js's acraDbLookup).
export function attachSqlTag(client) {
  client.sql = (strings, ...values) => {
    const text = strings.reduce((acc, part, i) => `${acc}${part}${i < values.length ? `$${i + 1}` : ""}`, "");
    return client.query(text, values);
  };
  return client;
}
