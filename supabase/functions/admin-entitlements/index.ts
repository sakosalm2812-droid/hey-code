import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createOwnerHandler } from './ownerService.js';

Deno.serve(createOwnerHandler({ createClient, env: (name: string) => Deno.env.get(name) }));
