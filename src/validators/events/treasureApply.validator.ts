import { z } from 'zod';

export const treasureHuntSchema = z
  .object({
    teamName: z.string().min(1, 'Team name is required'),

    teamLeaderName: z.string().min(1, 'Team leader name is required'),
    teamLeaderEmail: z
      .string()
      .min(1, 'Email is required')
      .refine(
        v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        'Please enter a valid email address'
      ),
    teamLeaderPhone: z
      .string()
      .length(10, 'Please enter a valid 10-digit phone number'),
    teamLeaderScholarId: z.string().optional(),

    teamViceCaptainName: z.string().min(1, 'Vice captain name is required'),
    teamViceCaptainPhone: z
      .string()
      .length(10, 'Vice captain phone must be 10 digits'),
    teamViceCaptainScholarId: z.string().optional(),

    collegeType: z.enum(['nit_silchar', 'other']),
    collegeName: z.string().nullable().optional(),

    department: z.string().optional(),
    year: z.string().optional(),

    // Team members EXCLUDING leader & vice captain
    teamMembers: z
      .array(
        z.object({
          name: z.string().min(1, 'Member name is required'),
          scholarId: z.string().optional(),
        })
      )
      .min(1, 'At least 1 team member is required')
      .max(3, 'Maximum 3 team members allowed'),
  })
  .superRefine((data, ctx) => {
    /* College name rule */
    if (data.collegeType === 'other' && !data.collegeName) {
      ctx.addIssue({
        code: 'custom',
        path: ['collegeName'],
        message: 'College name is required for external colleges',
      });
    }

    /* Scholar ID rules */
    if (data.collegeType === 'nit_silchar') {
      if (!data.teamLeaderScholarId) {
        ctx.addIssue({
          code: 'custom',
          path: ['teamLeaderScholarId'],
          message: 'Scholar ID is required for NIT Silchar leader',
        });
      }

      if (!data.teamViceCaptainScholarId) {
        ctx.addIssue({
          code: 'custom',
          path: ['teamViceCaptainScholarId'],
          message: 'Scholar ID is required for NIT Silchar vice captain',
        });
      }

      data.teamMembers.forEach((member, index) => {
        if (!member.scholarId) {
          ctx.addIssue({
            code: 'custom',
            path: ['teamMembers', index, 'scholarId'],
            message: 'Scholar ID is required for NIT Silchar team members',
          });
        }
      });
    }
  });
