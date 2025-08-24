import { z } from 'zod'

// Common validation schemas

// Email validation
export const EmailSchema = z.string().email('Invalid email address').max(255, 'Email too long')

// Text field validations
export const NameSchema = z.string().min(1, 'Name is required').max(255, 'Name too long').trim()
export const DescriptionSchema = z.string().max(2000, 'Description too long').nullable()
export const ShortTextSchema = z.string().max(500, 'Text too long').trim()

// UUID validation
export const UUIDSchema = z.string().uuid('Invalid ID format')

// Date validation
export const DateSchema = z.string().datetime('Invalid date format')
export const OptionalDateSchema = z.string().datetime('Invalid date format').nullable()

// Lab validation schemas
export const CreateLabSchema = z.object({
  name: NameSchema,
  description: DescriptionSchema.optional(),
  is_active: z.boolean().default(true),
})

export const UpdateLabSchema = z.object({
  name: NameSchema.optional(),
  description: DescriptionSchema.optional(),
  is_active: z.boolean().optional(),
})

// Lab member validation schemas
export const AddMemberSchema = z.object({
  email: EmailSchema,
  role: z.enum([
    'principal_investigator',
    'co_investigator', 
    'lab_manager',
    'data_analyst',
    'data_scientist',
    'regulatory_coordinator',
    'lab_assistant',
    'research_volunteer',
    'external_collaborator'
  ]),
  permissions: z.record(z.boolean()).optional(),
})

export const UpdateMemberSchema = z.object({
  role: z.enum([
    'principal_investigator',
    'co_investigator', 
    'lab_manager',
    'data_analyst',
    'data_scientist',
    'regulatory_coordinator',
    'lab_assistant',
    'research_volunteer',
    'external_collaborator'
  ]).optional(),
  permissions: z.record(z.boolean()).optional(),
  is_active: z.boolean().optional(),
})

// Calendar event validation schemas
export const CreateCalendarEventSchema = z.object({
  title: NameSchema,
  description: DescriptionSchema.optional(),
  event_type: z.enum(['MEETING', 'DEADLINE', 'TRAINING', 'CONFERENCE', 'HOLIDAY', 'PTO', 'CLINICAL_SERVICE', 'OTHER']),
  start_date: DateSchema,
  end_date: DateSchema,
  all_day: z.boolean().default(false),
  location: ShortTextSchema.nullable().optional(),
  lab_id: UUIDSchema,
  participants: z.number().int().min(0).nullable().optional(),
})

export const UpdateCalendarEventSchema = CreateCalendarEventSchema.partial().omit({ lab_id: true })

// Bulk sync schema
export const BulkCalendarSyncSchema = z.object({
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  labId: UUIDSchema,
})

// Email validation schemas
export const SendMeetingSummarySchema = z.object({
  meetingId: UUIDSchema,
  meetingTitle: NameSchema,
  meetingDate: DateSchema,
  summary: z.string().min(10, 'Summary too short').max(5000, 'Summary too long'),
  actionItems: z.array(z.string()).optional(),
  labId: UUIDSchema,
  attendeeUserIds: z.array(UUIDSchema).min(1, 'At least one attendee required'),
})

export const TestEmailSchema = z.object({
  to: EmailSchema.optional(),
  subject: ShortTextSchema.optional(),
  content: z.string().max(2000, 'Content too long').optional(),
})

// Request validation schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const SearchSchema = z.object({
  q: z.string().max(255, 'Search query too long').optional(),
  ...PaginationSchema.shape,
})

// Sanitization helpers
export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .trim()
}

export function sanitizeInput(input: string): string {
  // Basic input sanitization
  return input
    .replace(/[<>]/g, '') // Remove angle brackets to prevent basic XSS
    .trim()
}

// Validation error class
export class ValidationError extends Error {
  constructor(
    message: string, 
    public details: z.ZodError['errors'] = []
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Validation middleware helper
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = `Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        throw new ValidationError(message, error.errors)
      }
      throw error
    }
  }
}

// Query parameter validation helper
export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const data: Record<string, any> = {}
  
  for (const [key, value] of searchParams.entries()) {
    data[key] = value
  }
  
  return validateBody(schema)(data)
}