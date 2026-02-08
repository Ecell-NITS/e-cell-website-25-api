import { z } from 'zod';

export const bidWiseSchema = z
  .object({
    teamName: z.string().min(2, 'Team name must be at least 2 characters'),

    teamLeaderName: z
      .string()
      .min(2, 'Leader name must be at least 2 characters'),
    teamLeaderEmail: z.string().email('Invalid leader email'),
    teamLeaderPhone: z
      .string()
      .length(10, 'Leader phone must be exactly 10 digits'),
    teamLeaderScholarId: z.string().optional(),

    collegeType: z.enum(['nit_silchar', 'other']),
    collegeName: z.string().nullable().optional(),

    department: z.string().optional(),
    year: z.string().optional(),

    teamMembers: z
      .array(
        z.object({
          name: z.string().min(2, 'Member name must be at least 2 characters'),
          phone: z.string().length(10, 'Member phone must be 10 digits'),
          email: z.string().email('Invalid member email').optional(),
        })
      )
      .min(2, 'Minimum 3 members including leader')
      .max(4, 'Maximum 5 members including leader'),
  })

  // 🔥 CONDITIONAL VALIDATION (THIS replaces your old if-statements)
  .superRefine((data, ctx) => {
    // collegeType === other → collegeName required
    if (data.collegeType === 'other' && !data.collegeName) {
      ctx.addIssue({
        path: ['collegeName'],
        message: 'College name is required for external colleges',
        code: z.ZodIssueCode.custom,
      });
    }

    // collegeType === nit_silchar → scholarId required
    if (data.collegeType === 'nit_silchar' && !data.teamLeaderScholarId) {
      ctx.addIssue({
        path: ['teamLeaderScholarId'],
        message: 'Scholar ID is required for NIT Silchar students',
        code: z.ZodIssueCode.custom,
      });
    }
  });
