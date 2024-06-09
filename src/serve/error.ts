const renderBody = (error: string, stack: string) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Error</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #14151a;
        }
    
        .error-title {
            color: #e21313;
            padding: 10px;
            margin: 0;
        }
    
        .error-stack {
            white-space: pre-wrap;
            padding: 10px;
            margin: 0;
            color: #9ca3af;
        }
    </style>
  </head>
  <body>
    <h1 class="error-title">${error}</h1>
    <pre class="error-stack">${stack}</pre>
  </body>
</html>`;

export function createErrorResponse(error: Error) {
  const body = renderBody(error.message, error.stack ?? String(error));

  return new Response(body, {
    status: 500,
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
