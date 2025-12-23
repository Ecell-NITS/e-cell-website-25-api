import { z } from 'zod';

/* createApiComment */
export const createCommentSchema = z.object({
  commentAuthor: z.string().min(1),
  commentPic: z.string().url(),
  text: z.string().min(1),
  userId: z.string().min(1),
});
