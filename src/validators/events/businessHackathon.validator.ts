import { z } from 'zod';

export const businessHackathonSchema = z
  .object({
    teamName: z.string().min(1, 'Team name is required'),
    teamLeaderName: z.string().min(1, 'Team leader name is required'),
    teamLeaderEmail: z.string().email('Please enter a valid email address'),
    teamLeaderPhone: z
      .string()
      .length(10, 'Please enter a valid 10-digit phone number'),

    teamLeaderScholarId: z.string().optional(),

    collegeType: z.enum(['nit_silchar', 'other']),
    collegeName: z.string().nullable().optional(),

    department: z.string().optional(),
    year: z.string().optional(),

    teamMembers: z
      .array(
        z.object({
          name: z.string().min(1, 'Member name is required'),
          phone: z.string().length(10, 'Member phone must be 10 digits'),
          scholarId: z.string().optional(),
        })
      )
      .min(2, 'Team must have at least 3 members including leader')
      .max(4, 'Team can have at most 5 members including leader'),
  })
  .superRefine((data, ctx) => {
    if (data.collegeType === 'other' && !data.collegeName) {
      ctx.addIssue({
        path: ['collegeName'],
        message: 'College name is required for external colleges',
        code: z.ZodIssueCode.custom,
      });
    }

    if (data.collegeType === 'nit_silchar' && !data.teamLeaderScholarId) {
      ctx.addIssue({
        path: ['teamLeaderScholarId'],
        message: 'Scholar ID is required for NIT Silchar students',
        code: z.ZodIssueCode.custom,
      });
    }

    if (data.collegeType === 'nit_silchar') {
      data.teamMembers.forEach((member, index) => {
        if (!member.scholarId) {
          ctx.addIssue({
            path: ['teamMembers', index, 'scholarId'],
            message: 'Scholar ID is required for all NIT Silchar team members',
            code: z.ZodIssueCode.custom,
          });
        }
      });
    }
  });
