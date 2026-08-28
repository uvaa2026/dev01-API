import { z } from 'zod'

// Mirrors the fields collected by the React app's Register.jsx / Login.jsx
// (see uvaa-webapp/src/pages/Register.jsx and src/data/careerStages.js).
// Keeping the enum values identical between frontend and backend matters —
// if you add a vertical or career stage, update both.

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(200),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organisation: z.string().trim().min(1, 'Organisation name is required').max(200),
  vertical: z.enum(['IT_TECH', 'EDUCATION'], {
    errorMap: () => ({ message: 'Select your professional context' }),
  }),
  careerStage: z.enum(['EC', 'MC', 'SP', 'LS'], {
    errorMap: () => ({ message: 'Select your career stage' }),
  }),
  experience: z.enum(['lt1', '1-3', '3-5', '5-8', '8-12', '12plus'], {
    errorMap: () => ({ message: 'Select your years of experience' }),
  }),
  department: z.string().trim().max(200).optional().or(z.literal('')),
  consent: z.object({
    assessment: z.literal(true, {
      errorMap: () => ({ message: 'Consent to processing your assessment responses is required' }),
    }),
    research: z.boolean().optional().default(false),
    shareWithHrAdmin: z.boolean().optional().default(false),
  }),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
})

export const verifySchema = z.object({
  token: z.string().min(1, 'Missing verification token'),
})

// The 15 Guna Profiler vignette ids (UVAA_TPE_ScoringMaster_V6). Duplicated
// from uvaa-webapp/src/data/gunaVignettes.js rather than shared — keep both
// lists identical if a vignette is ever added, removed, or renamed.
export const GUNA_VIGNETTE_IDS = [
  'before-you-commit',
  'now-or-later',
  'when-the-motivation-goes',
  'not-urgent-today',
  'about-to-respond',
  'you-have-it-now',
  'harder-than-expected',
  'it-went-wrong',
  'something-disrupts-it',
  'unexpected-time',
  'it-may-not-work',
  'two-things-in-one-day',
  'you-reached-it',
  'it-turned',
  'it-rises',
]

// A submission must answer every vignette exactly once, each with a valid
// option key — no partial submissions, no unknown vignette ids, no
// duplicates. Order doesn't matter; the set has to match exactly.
export const gunaSubmissionSchema = z.object({
  answers: z
    .array(
      z.object({
        vignetteId: z.enum(GUNA_VIGNETTE_IDS),
        optionKey: z.enum(['A', 'B', 'C']),
      }),
    )
    .length(GUNA_VIGNETTE_IDS.length, `All ${GUNA_VIGNETTE_IDS.length} questions must be answered`)
    .superRefine((answers, ctx) => {
      const seen = new Set()
      for (const a of answers) {
        if (seen.has(a.vignetteId)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate answer for ${a.vignetteId}` })
        }
        seen.add(a.vignetteId)
      }
      for (const id of GUNA_VIGNETTE_IDS) {
        if (!seen.has(id)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Missing answer for ${id}` })
        }
      }
    }),
})

// Turns a ZodError into { field: message } the frontend can render next to
// the relevant input, rather than a flat list.
export function formatZodError(error) {
  const fieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    if (!fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return fieldErrors
}
