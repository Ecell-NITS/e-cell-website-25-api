import { z } from 'zod';

/* createBlog */
// export const createBlogSchema = z.object({
//   email: z.string().email(),
//   subject: z.string().min(1),
//   text: z.string().min(1),
// });

export const createBlogSchema = z.object({
  title: z.string().min(1),
  writerEmail: z.string().email('Invalid email'),
  subject: z.string().min(3, 'Subject is too short'),
  text: z.string().min(10, 'Text is too short'),
});

/* createApiBlog */
export const createApiBlogSchema = z.object({
  blogId: z.string(),
  authoruniqueid: z.string().min(1),
  title: z.string().min(1),
  tag: z.string().min(1),
  intro: z.string().min(1),
  content: z.string().min(1),
  topicpic: z.string().url(),
  writername: z.string().min(1),
  writerintro: z.string().min(1),
  writerpic: z.string().url(),
  writeremail: z.string().email(),
});
