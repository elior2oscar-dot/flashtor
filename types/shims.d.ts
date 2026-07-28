declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(url: string, key: string): any;
}

declare namespace Deno {
  namespace env {
    function get(name: string): string | undefined;
  }

  function serve(
    handler: (request: Request) => Response | Promise<Response>
  ): void;
}
