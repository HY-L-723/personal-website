import { authBindings } from '@/lib/auth/server';
import { forwardAuthRequest } from '@/lib/auth/transport';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return forwardAuthRequest(request, authBindings());
}

export async function GET(request: Request) {
  return forwardAuthRequest(request, authBindings());
}
