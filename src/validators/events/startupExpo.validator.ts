import { z } from 'zod';

export const startupExpoSchema = z
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

    businessDescription: z.string().min(10, 'Business description is required'),

    driveLink: z
      .string()
      .optional()
      .refine(v => !v || /^https?:\/\/.+/.test(v), 'Please enter a valid URL'),

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
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.collegeType === 'other' && !data.collegeName) {
      ctx.addIssue({
        code: 'custom',
        path: ['collegeName'],
        message: 'College name is required for external colleges',
      });
    }

    if (data.collegeType === 'nit_silchar' && !data.teamLeaderScholarId) {
      ctx.addIssue({
        code: 'custom',
        path: ['teamLeaderScholarId'],
        message: 'Scholar ID is required for NIT Silchar students',
      });
    }

    if (data.collegeType === 'nit_silchar' && data.teamMembers) {
      data.teamMembers.forEach((member, index) => {
        if (!member.scholarId) {
          ctx.addIssue({
            code: 'custom',
            path: ['teamMembers', index, 'scholarId'],
            message: 'Scholar ID is required for all NIT Silchar team members',
          });
        }
      });
    }
  });
