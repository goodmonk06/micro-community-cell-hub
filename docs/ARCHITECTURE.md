# Architecture Documentation

## Overview

The Micro Community Cell Hub is built as a modular, event-driven system designed to be a foundational building block in larger community ecosystems. This document describes the architectural decisions, patterns, and structure.

## Architecture Principles

1. **Modularity**: Clear separation between layers (domain, application, infrastructure)
2. **Extensibility**: Plugin-based adapters for external integrations
3. **Event-Driven**: Domain events enable loose coupling and integration
4. **Type Safety**: Comprehensive TypeScript types throughout
5. **Testability**: Dependency injection and adapter pattern for easy testing
6. **Scalability**: Stateless API design, efficient database queries

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Next.js    │  │   REST API   │  │   GraphQL    │  │
│  │     Pages    │  │    Routes    │  │  (Future)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Health    │  │Recommendation│  │    Event     │  │
│  │   Service    │  │   Service    │  │    Bus       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                     Domain Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     Cell     │  │  Membership  │  │   Session    │  │
│  │    Models    │  │    Models    │  │   Records    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Prisma     │  │   Adapters   │  │   Metrics    │  │
│  │     ORM      │  │   Registry   │  │   & Logging  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                  External Systems                        │
│  ┌─────┐  ┌────────┐  ┌────┐  ┌────────┐  ┌─────────┐ │
│  │ DB  │  │ Notify │  │ AI │  │Calendar│  │ Metrics │ │
│  └─────┘  └────────┘  └────┘  └────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
micro-community-cell-hub/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── cells/         # Cell CRUD endpoints
│   │   ├── memberships/   # Membership management
│   │   ├── sessions/      # Session tracking
│   │   ├── stats/         # Analytics endpoints
│   │   └── health/        # Health check
│   ├── cells/             # Cell UI pages
│   └── ...
├── lib/                   # Shared library code
│   ├── adapters/          # External integration adapters
│   │   ├── notification-adapter.ts
│   │   ├── ai-adapter.ts
│   │   ├── profile-adapter.ts
│   │   ├── metrics-adapter.ts
│   │   └── calendar-adapter.ts
│   ├── events/            # Domain event system
│   │   ├── cell-events.ts
│   │   ├── membership-events.ts
│   │   ├── session-events.ts
│   │   └── health-events.ts
│   ├── services/          # Business logic services
│   │   ├── health-service.ts
│   │   └── recommendation-service.ts
│   ├── validations/       # Zod schemas
│   ├── errors.ts          # Error handling
│   ├── logger.ts          # Logging utility
│   ├── metrics.ts         # Metrics collection
│   ├── api-handler.ts     # API middleware
│   └── prisma.ts          # Prisma client
├── components/            # React components
├── prisma/                # Database schema & migrations
│   ├── schema.prisma
│   └── seed.ts
├── docs/                  # Documentation
└── __tests__/             # Tests
```

## Key Patterns

### 1. Adapter Pattern

External integrations are abstracted behind adapter interfaces:

```typescript
interface INotificationAdapter {
  send(recipient, payload, channel): Promise<Result>
}

// Register implementations
adapters.register('notification', new EmailNotificationAdapter())
```

**Benefits:**
- Easy to swap implementations
- Mockable for testing
- No hard dependencies on external services

### 2. Event-Driven Architecture

Domain events enable loose coupling:

```typescript
// Emit event
await eventBus.emit(cellCreated({ cellId, name, ... }))

// Subscribe to events
eventBus.on('cell.created', async (event) => {
  // Send notification, update analytics, etc.
})
```

**Benefits:**
- Decoupled systems
- Easy to add new reactions
- Audit trail of all actions

### 3. Service Layer

Business logic is encapsulated in services:

```typescript
class HealthService {
  async calculateCellHealth(cellId): Promise<HealthMetrics> {
    // Complex health calculation logic
  }
}
```

**Benefits:**
- Reusable across API routes and background jobs
- Testable in isolation
- Clear business logic location

### 4. Centralized Error Handling

API errors are normalized and formatted consistently:

```typescript
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req, context) => {
    try {
      return await handler(req, context)
    } catch (error) {
      const appError = normalizeError(error)
      return NextResponse.json(formatErrorResponse(appError), {
        status: appError.statusCode,
      })
    }
  }
}
```

## Database Design

### Core Entities

1. **Cell**: Sub-community with configuration, topics, and health metrics
2. **CellMembership**: Links members to cells with roles
3. **CellSessionRecord**: Tracks activities and meetings
4. **CellConfiguration**: Per-cell settings
5. **CellTopic**: Structured topics within cells
6. **MemberProfile**: Extended member information
7. **CellActivity**: Granular activity tracking
8. **CellTemplate**: Reusable cell templates
9. **CellHealthSnapshot**: Historical health metrics
10. **CellRelation**: Inter-cell relationships
11. **MemberRelation**: Member-to-member relationships

### Key Design Decisions

**Soft Deletes**: `leftAt` field allows tracking membership history
**External IDs**: `memberId` and `communityId` reference external systems
**JSON Fields**: Flexible metadata storage (themeTagsJson, metadataJson)
**Indexes**: Strategic indexes on frequently queried fields
**Cascading Deletes**: Automatic cleanup of related records

## Scalability Considerations

### Database Optimization

- **Connection Pooling**: Use PgBouncer in production
- **Query Optimization**: Prisma's query optimization with selective includes
- **Indexes**: Composite indexes on common query patterns
- **Pagination**: Limit results with offset/cursor pagination

### Caching Strategy

- **Redis Integration**: Session data, frequently accessed cells
- **Edge Caching**: Static cell pages via CDN
- **Application Cache**: In-memory caching for read-heavy data

### Horizontal Scaling

- **Stateless API**: No server-side sessions
- **Event Bus**: Can be replaced with Redis Pub/Sub or Kafka
- **Background Jobs**: Move intensive operations to queue workers

## Security

### Input Validation

All API inputs validated with Zod schemas:

```typescript
const createCellSchema = z.object({
  communityId: z.string().min(1),
  key: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
})
```

### SQL Injection Prevention

Prisma ORM provides parameterized queries automatically.

### Rate Limiting

TODO: Implement rate limiting middleware

### Authentication & Authorization

Currently uses external `memberId` - integrate with your auth system:
- Add authentication middleware
- Verify member ownership
- Check role-based permissions

## Monitoring & Observability

### Logging

Structured logging with context:

```typescript
logger.info('Cell created', { cellId, communityId })
logger.error('Failed to create cell', error, { input })
```

### Metrics

Key metrics tracked:
- `cell_health_score`
- `cell_member_count`
- `api_request_duration_ms`
- `api_request_total`
- `api_request_error`

Export to Prometheus, Datadog, etc. via MetricsAdapter.

### Error Tracking

Integrate Sentry or similar for error tracking in production.

## Testing Strategy

### Unit Tests

- Validation schemas
- Service layer logic
- Utility functions

### Integration Tests

- API endpoints
- Database operations
- Event system

### Test Data

- Factories for creating test entities
- Mock adapters for external services
- Isolated test database

## Deployment Architecture

### Recommended Stack

**Application**:
- Platform: Vercel, Railway, or AWS ECS
- Node.js runtime with Next.js

**Database**:
- Managed PostgreSQL (AWS RDS, Supabase, PlanetScale)
- Connection pooling via PgBouncer

**Caching**:
- Redis (AWS ElastiCache, Upstash)

**Monitoring**:
- Logs: CloudWatch, DataDog
- Metrics: Prometheus + Grafana
- Errors: Sentry

### Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: production/development
- `REDIS_URL`: Redis connection (optional)

Optional:
- `SENTRY_DSN`: Error tracking
- `AI_API_KEY`: AI adapter integration
- `SENDGRID_API_KEY`: Email notifications

## Extension Points

### Adding New Adapters

1. Define interface in `lib/adapters/`
2. Implement concrete adapter
3. Register in adapter registry
4. Use via `adapters.get('type')`

### Adding New Events

1. Define event type in `lib/events/`
2. Create helper function
3. Emit in appropriate service/API
4. Subscribe in event handlers

### Adding New Services

1. Create service class in `lib/services/`
2. Inject dependencies (Prisma, adapters)
3. Export singleton instance
4. Use in API routes

## Future Enhancements

1. **GraphQL API**: Flexible queries for complex UIs
2. **Real-time Updates**: WebSocket support for live health monitoring
3. **Advanced Analytics**: Predictive models, cohort analysis
4. **Federation**: Multi-tenant support with data isolation
5. **Mobile App**: React Native client
6. **CLI Tools**: Administrative command-line utilities

## Performance Benchmarks

Target performance (with optimizations):
- API response time: < 100ms (p95)
- Database queries: < 50ms (p95)
- Health calculation: < 200ms per cell
- Recommendation generation: < 500ms

## Changelog

See CHANGELOG.md for version history and breaking changes.
