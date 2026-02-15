import { z } from 'zod';

const teamMemberSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  phone: z.string().length(10, 'Phone must be 10 digits'),
  scholarId: z.string().optional(),
});

export const adovationSchema = z
  .object({
    teamName: z.string().min(2),
    teamLeaderName: z.string().min(2),
    teamLeaderEmail: z.string().email(),
    teamLeaderPhone: z.string().length(10),
    teamLeaderScholarId: z.string().optional(),

    collegeType: z.enum(['nit_silchar', 'other']),
    collegeName: z.string().nullable().optional(),

    department: z.string().optional(),
    year: z.string().optional(),

    teamMembers: z.array(teamMemberSchema).min(2).max(5),
  })
  .superRefine((data, ctx) => {
    if (data.collegeType === 'other' && !data.collegeName) {
      ctx.addIssue({
        path: ['collegeName'],
        message: 'College name is required',
        code: z.ZodIssueCode.custom,
      });
    }

    if (data.collegeType === 'nit_silchar') {
      if (!data.teamLeaderScholarId) {
        ctx.addIssue({
          path: ['teamLeaderScholarId'],
          message: 'Scholar ID required for NIT Silchar',
          code: z.ZodIssueCode.custom,
        });
      }

      data.teamMembers.forEach((m, i) => {
        if (!m.scholarId) {
          ctx.addIssue({
            path: ['teamMembers', i, 'scholarId'],
            message: 'Scholar ID required for NIT Silchar members',
            code: z.ZodIssueCode.custom,
          });
        }
      });
    }
  });
