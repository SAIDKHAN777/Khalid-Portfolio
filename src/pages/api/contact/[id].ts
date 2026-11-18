import type { APIRoute } from 'astro';
import { contactService } from '@/services/contact.service';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const { id } = params;
  if (!id) return apiError('Message ID required', 'MISSING_ID', 400);

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const isRead = typeof body.isRead === 'boolean' ? body.isRead : true;
  const status = body.status || (isRead ? 'READ' : 'NEW');

  try {
    const updated = await contactService.updateMessage(id, { status, isRead });
    return apiSuccess(updated);
  } catch {
    return apiError('Contact message not found', 'NOT_FOUND', 404);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const { id } = params;
  if (!id) return apiError('Message ID required', 'MISSING_ID', 400);

  try {
    await contactService.deleteMessage(id);
    return apiSuccess({ message: 'Message deleted successfully' });
  } catch {
    return apiError('Contact message not found', 'NOT_FOUND', 404);
  }
};
