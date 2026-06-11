import { cp, mkdir, writeFile, rm } from 'fs/promises';

const OUT = '.vercel/output';

await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/static`, { recursive: true });
await mkdir(`${OUT}/functions/ssr.func`, { recursive: true });

// Static client assets
await cp('dist/client', `${OUT}/static`, { recursive: true });

// SSR server bundle
await cp('dist/server', `${OUT}/functions/ssr.func`, { recursive: true });

// Vercel Node.js runtime recognizes `export function fetch` as a Web API handler.
// `export default` is treated as the legacy (req, res) signature and the return value is ignored.
await writeFile(
  `${OUT}/functions/ssr.func/index.js`,
  `import server from './server.js';\nexport function fetch(request) {\n  return server.fetch(request);\n}\n`,
);

// Node.js requires package.json with "type":"module" to parse ESM files (.js with import/export)
await writeFile(
  `${OUT}/functions/ssr.func/package.json`,
  JSON.stringify({ type: 'module' }, null, 2),
);

// Vercel function config (Node.js runtime, web-standard handler)
await writeFile(
  `${OUT}/functions/ssr.func/.vc-config.json`,
  JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.js' }, null, 2),
);

// Routing: serve hashed assets directly with long cache, everything else → SSR
await writeFile(
  `${OUT}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        {
          src: '/assets/(.*)',
          headers: { 'cache-control': 'public, max-age=31536000, immutable' },
          continue: true,
        },
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/ssr' },
      ],
    },
    null,
    2,
  ),
);

console.log('✓ .vercel/output created');
