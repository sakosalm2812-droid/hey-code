export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'HEY API',
    version: '1.0.0',
    description: 'API documentation for HEY - Your AI Assistant Like Jarvis',
    contact: {
      name: 'HEY Team',
      email: 'api@hey.ai',
      url: 'https://hey.ai',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'https://hey.ai/api',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3000/api',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'NextAuth.js session token or API key',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'API key with Bearer prefix: Bearer hey_live_...',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          details: { type: 'object' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string', nullable: true },
          image: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          emailVerified: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Chat: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string' },
          model: { type: 'string', enum: ['GPT_4O', 'GPT_4O_MINI', 'GPT_4_TURBO', 'CLAUDE_3_OPUS', 'CLAUDE_3_SONNET', 'CLAUDE_3_HAIKU'] },
          systemPrompt: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          chatId: { type: 'string' },
          userId: { type: 'string' },
          role: { type: 'string', enum: ['user', 'assistant', 'system'] },
          content: { type: 'string' },
          tokens: { type: 'integer' },
          model: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Usage: {
        type: 'object',
        properties: {
          plan: { type: 'string', enum: ['FREE', 'PRO', 'TEAM', 'ENTERPRISE'] },
          limits: {
            type: 'object',
            properties: {
              messages: { type: 'integer' },
              tokens: { type: 'integer' },
              apiCalls: { type: 'integer' },
              voiceMinutes: { type: 'integer' },
              uploads: { type: 'integer' },
              images: { type: 'integer' },
            },
          },
          today: {
            type: 'object',
            properties: {
              messages: { type: 'integer' },
              tokens: { type: 'integer' },
              apiCalls: { type: 'integer' },
            },
          },
          rateLimit: {
            type: 'object',
            properties: {
              allowed: { type: 'boolean' },
              remaining: { type: 'integer' },
              resetAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'PAUSED'] },
          plan: { type: 'string', enum: ['FREE', 'PRO', 'TEAM', 'ENTERPRISE'] },
          cancelAtPeriodEnd: { type: 'boolean' },
          stripeCurrentPeriodEnd: { type: 'string', format: 'date-time', nullable: true },
          trialEnd: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Team: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string', nullable: true },
          plan: { type: 'string' },
          ownerId: { type: 'string' },
          owner: { $ref: '#/components/schemas/User' },
          _count: {
            type: 'object',
            properties: {
              members: { type: 'integer' },
            },
          },
        },
      },
      TeamMember: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          role: { type: 'string', enum: ['OWNER', 'ADMIN', 'MEMBER'] },
          joinedAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      TeamInvitation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['ADMIN', 'MEMBER'] },
          expiresAt: { type: 'string', format: 'date-time' },
          acceptedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ChatRequest: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: {
            type: 'array',
            items: {
              type: 'object',
              required: ['role', 'content'],
              properties: {
                role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                content: { type: 'string' },
              },
            },
          },
          chatId: { type: 'string', nullable: true },
          model: { type: 'string', enum: ['GPT_4O', 'GPT_4O_MINI', 'GPT_4_TURBO', 'CLAUDE_3_OPUS', 'CLAUDE_3_SONNET', 'CLAUDE_3_HAIKU'] },
          systemPrompt: { type: 'string', nullable: true },
        },
      },
      ChatResponse: {
        type: 'object',
        properties: {
          chunk: { type: 'string' },
          done: { type: 'boolean' },
          chatId: { type: 'string' },
          tokens: { type: 'integer' },
        },
      },
      ImageGenerateRequest: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', maxLength: 4000 },
          size: { type: 'string', enum: ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'], default: '1024x1024' },
          quality: { type: 'string', enum: ['standard', 'hd'], default: 'standard' },
          style: { type: 'string', enum: ['vivid', 'natural'], default: 'vivid' },
        },
      },
      ImageGenerateResponse: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          revised_prompt: { type: 'string' },
        },
      },
      CreateTeamRequest: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          slug: { type: 'string', minLength: 2, maxLength: 50, pattern: '^[a-z0-9-]+$' },
          description: { type: 'string', maxLength: 500 },
        },
      },
      InviteMemberRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' },
        },
      },
      UpdateMemberRoleRequest: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['ADMIN', 'MEMBER'] },
        },
      },
      ContactRequest: {
        type: 'object',
        required: ['type', 'email', 'subject', 'message'],
        properties: {
          type: { type: 'string', enum: ['general', 'bug', 'feature', 'billing', 'security'] },
          email: { type: 'string', format: 'email' },
          subject: { type: 'string', minLength: 5, maxLength: 100 },
          message: { type: 'string', minLength: 20, maxLength: 5000 },
        },
      },
    },
  },
  security: [
    { bearerAuth: [] },
    { apiKey: [] },
  ],
  paths: {
    '/auth/signin': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in with credentials',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Signed in successfully' },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 50 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Account created, verification email sent' },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/chat': {
      post: {
        tags: ['Chat'],
        summary: 'Send chat message (streaming SSE)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatRequest' } } },
        },
        responses: {
          '200': {
            description: 'Server-sent events stream',
            content: {
              'text/event-stream': {
                schema: { $ref: '#/components/schemas/ChatResponse' },
              },
            },
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Model not available for plan', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '429': { description: 'Rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/usage': {
      get: {
        tags: ['Usage'],
        summary: 'Get current usage and limits',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Usage data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usage' } } } },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/stripe/checkout': {
      post: {
        tags: ['Billing'],
        summary: 'Create Stripe checkout session',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['priceId'],
                properties: { priceId: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Checkout URL', content: { 'application/json': { schema: { type: 'object', properties: { url: { type: 'string' } } } } } },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/stripe/portal': {
      post: {
        tags: ['Billing'],
        summary: 'Create Stripe billing portal session',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Portal URL', content: { 'application/json': { schema: { type: 'object', properties: { url: { type: 'string' } } } } } },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/images/generate': {
      post: {
        tags: ['Images'],
        summary: 'Generate image with DALL-E 3',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ImageGenerateRequest' } } },
        },
        responses: {
          '200': { description: 'Generated image', content: { 'application/json': { schema: { $ref: '#/components/schemas/ImageGenerateResponse' } } } },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Requires Pro plan or higher' },
        },
      },
    },
    '/voice': {
      post: {
        tags: ['Voice'],
        summary: 'Transcribe audio with Whisper',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['audio'],
                properties: { audio: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Transcription', content: { 'application/json': { schema: { type: 'object', properties: { text: { type: 'string' } } } } } },
          '401': { description: 'Unauthorized' },
          '413': { description: 'File too large (max 25MB)' },
        },
      },
    },
    '/upload': {
      post: {
        tags: ['Files'],
        summary: 'Upload file',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: { file: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'File uploaded', content: { 'application/json': { schema: { type: 'object', properties: { url: { type: 'string' }, fileName: { type: 'string' }, fileSize: { type: 'integer' }, fileType: { type: 'string' } } } } } },
          '401': { description: 'Unauthorized' },
          '413': { description: 'File too large (max 10MB)' },
          '415': { description: 'Unsupported file type' },
        },
      },
    },
    '/team': {
      get: {
        tags: ['Teams'],
        summary: 'List user teams',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'List of teams', content: { 'application/json': { schema: { type: 'object', properties: { teams: { type: 'array', items: { $ref: '#/components/schemas/Team' } } } } } } },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Teams'],
        summary: 'Create new team',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTeamRequest' } } },
        },
        responses: {
          '200': { description: 'Team created', content: { 'application/json': { schema: { type: 'object', properties: { team: { $ref: '#/components/schemas/Team' } } } } } },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Requires Team or Enterprise plan' },
        },
      },
    },
    '/team/members': {
      get: {
        tags: ['Teams'],
        summary: 'List team members',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'teamId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'List of members', content: { 'application/json': { schema: { type: 'object', properties: { members: { type: 'array', items: { $ref: '#/components/schemas/TeamMember' } } } } } } },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Not a team member' },
        },
      },
      patch: {
        tags: ['Teams'],
        summary: 'Update member role',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'teamId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'memberId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateMemberRoleRequest' } } },
        },
        responses: {
          '200': { description: 'Role updated' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Only owners can change roles' },
        },
      },
      delete: {
        tags: ['Teams'],
        summary: 'Remove team member',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'teamId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'memberId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Member removed' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/team/invitations': {
      get: {
        tags: ['Teams'],
        summary: 'List team invitations',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'teamId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'List of invitations', content: { 'application/json': { schema: { type: 'object', properties: { invitations: { type: 'array', items: { $ref: '#/components/schemas/TeamInvitation' } } } } } } },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Not authorized' },
        },
      },
      post: {
        tags: ['Teams'],
        summary: 'Invite team member',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'teamId', in: 'query', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/InviteMemberRequest' } } },
        },
        responses: {
          '200': { description: 'Invitation sent', content: { 'application/json': { schema: { type: 'object', properties: { invitation: { $ref: '#/components/schemas/TeamInvitation' } } } } } },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Not authorized' },
        },
      },
    },
    '/contact': {
      post: {
        tags: ['Support'],
        summary: 'Submit contact form',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ContactRequest' } } },
        },
        responses: {
          '200': { description: 'Message sent' },
          '400': { description: 'Validation error' },
        },
      },
    },
  },
};