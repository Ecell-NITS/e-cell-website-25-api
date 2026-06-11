import { z } from 'zod';

// ─── Helpers ──────────────────────────────────────────────────────
const wordCount = (str: string) =>
  str.trim().split(/\s+/).filter(Boolean).length;

const VALID_TEAMS = [
  'Marketing Team',
  'Design Team',
  'Videography Team',
  'Publicity Team',
  'Content Team',
  'Curation X Startup Team',
  'Event Management Team',
  'Collaboration and Outreach Team',
] as const;

// ─── Tech Draft (Step 1 — Save for Later) ─────────────────────────
export const techDraftSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  scholarId: z.string().min(1, 'Scholar ID is required'),
  whatsappNumber: z.string().regex(/^\d{10}$/, 'Invalid WhatsApp number'),
  techDomain: z.enum(['WEB', 'AI', 'UIUX']).default('WEB'),
  domainOfPriorProject: z.string().optional().default(''),
  resumeLink: z.string().url('Please enter a valid resume URL'),
  githubProfileLink: z.string().url('Please enter a valid GitHub URL'),
});

// ─── Tech Submit (Step 1 + Step 2 — Full Submission) ──────────────
export const techSubmitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  scholarId: z.string().min(1, 'Scholar ID is required'),
  whatsappNumber: z.string().regex(/^\d{10}$/, 'Invalid WhatsApp number'),
  techDomain: z.enum(['WEB', 'AI', 'UIUX']).default('WEB'),
  domainOfPriorProject: z.string().optional().default(''),
  resumeLink: z.string().url('Please enter a valid resume URL'),
  githubProfileLink: z.string().url('Please enter a valid GitHub URL'),
  taskPreviewLink: z
    .string()
    .url('Please enter a valid task preview URL')
    .optional(),
  taskGithubRepoLink: z
    .string()
    .url('Please enter a valid task repo URL')
    .optional(),
  taskSelection: z
    .enum(['PORTFOLIO', 'LANDING_PAGE', 'AUTH_SYSTEM'], {
      message: 'Please select a task option',
    })
    .optional(),
});

// ─── Other Teams (Single-Page Submission) ─────────────────────────
export const otherTeamsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  scholarId: z.string().min(1, 'Scholar ID is required'),
  branch: z.string().min(1, 'Branch is required'),
  whatsappNumber: z
    .string()
    .regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number'),
  instituteEmail: z.string().email('Please enter a valid institute email'),
  whyJoinECell: z
    .string()
    .min(1, 'This field is required')
    .refine(val => wordCount(val) <= 80, {
      message: 'Response must be within 80 words',
    }),
  teamSelection: z
    .array(z.enum(VALID_TEAMS))
    .min(1, 'Please select at least one team')
    .max(8, 'Cannot select more than 8 teams'),
  pastContributions: z
    .string()
    .optional()
    .default('')
    .refine(val => !val || wordCount(val) <= 250, {
      message: 'Past contributions must be within 250 words',
    }),
  otherClubs: z.string().optional().default(''),
});
