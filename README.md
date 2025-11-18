# Micro Community Cell Hub

大きなサロンを小さな「細胞コミュニティ」（分科会・クラス）に分けて運営するためのセルハブ。

A fullstack TypeScript application for managing micro-communities (cells) within larger communities. Split your community into focused sub-groups with dedicated hosts, track membership, monitor session activities, and gain insights into community health.

## Features

### 🏘️ Cell Management
- Create and manage community cells (sub-groups)
- Organize cells with unique keys, names, and descriptions
- Tag cells with themes for easy discovery
- Assign hosts and co-hosts to manage cells

### 👥 Membership Tracking
- Track who belongs to which cells
- Manage member roles (Member, Host, Co-host)
- Handle member join/leave lifecycle
- View membership history

### 📊 Session Recording
- Log cell activities and meetings
- Track session types (Circle, Study, Project, Other)
- Record attendance counts and session notes
- View session history and patterns

### 📈 Health Analytics
- Cell health scoring based on activity and engagement
- Member statistics and role distribution
- Session analytics (frequency, attendance, types)
- Activity trends over time

### 💻 Modern Tech Stack
- **Frontend**: Next.js 15 with React 18 and TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Development**: Docker Compose for local environment

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for local database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/micro-community-cell-hub.git
   cd micro-community-cell-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cellhub?schema=public"
   NODE_ENV="development"
   ```

4. **Start the database**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npm run db:generate
   npm run db:push
   ```

6. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests in watch mode
- `npm run test:ci` - Run tests once (CI mode)
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

## API Reference

### Cells

- `GET /api/cells` - List all cells
  - Query params: `?communityId=xxx`
- `POST /api/cells` - Create a new cell
- `GET /api/cells/[id]` - Get cell details
- `PUT /api/cells/[id]` - Update a cell
- `DELETE /api/cells/[id]` - Delete a cell

### Memberships

- `GET /api/memberships` - List memberships
  - Query params: `?cellId=xxx&memberId=xxx&active=true`
- `POST /api/memberships` - Add member to cell
- `GET /api/memberships/[id]` - Get membership details
- `PUT /api/memberships/[id]` - Update membership (role, leftAt)
- `DELETE /api/memberships/[id]` - Remove membership

### Sessions

- `GET /api/sessions` - List session records
  - Query params: `?cellId=xxx&sessionType=xxx&limit=50`
- `POST /api/sessions` - Create session record
- `GET /api/sessions/[id]` - Get session details
- `PUT /api/sessions/[id]` - Update session record
- `DELETE /api/sessions/[id]` - Delete session record

### Statistics

- `GET /api/stats/cells` - Get overall cell statistics
  - Query params: `?communityId=xxx`
- `GET /api/stats/cells/[id]` - Get detailed cell statistics

### Health

- `GET /api/health` - API health check

## Domain Model

### Cell
Represents a sub-community or focused group within the larger community.

```typescript
{
  id: string
  communityId: string
  key: string (unique, URL-friendly)
  name: string
  descriptionMarkdown?: string
  themeTagsJson?: string (JSON array)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### CellMembership
Tracks who belongs to which cells and their roles.

```typescript
{
  id: string
  cellId: string
  memberId: string
  role: 'MEMBER' | 'HOST' | 'COHOST'
  joinedAt: DateTime
  leftAt?: DateTime (null if active)
}
```

### CellSessionRecord
Records activities and meetings within cells.

```typescript
{
  id: string
  cellId: string
  ts: DateTime
  sessionType: 'CIRCLE' | 'STUDY' | 'PROJECT' | 'OTHER'
  attendanceCount: number
  notesMarkdown?: string
  metaJson?: string
}
```

## Integration Guide

### Health Analytics Integration

The Cell Hub provides health metrics that can be consumed by analytics systems:

```typescript
// Get cell health status
const response = await fetch(`/api/stats/cells/${cellId}`)
const stats = await response.json()

// Health indicators include:
// - score: 0-3 (3 = healthy, 2 = warning, 1 = inactive)
// - status: 'healthy' | 'warning' | 'inactive'
// - indicators: { isActive, hasHost, hasMembers }
```

**Health Scoring Logic:**
- `isActive`: Cell had at least one session in the last 30 days
- `hasHost`: Cell has at least one host or co-host
- `hasMembers`: Cell has at least 3 active members

Integration points:
- Monitor cell health scores across communities
- Trigger alerts when cells drop to "warning" or "inactive"
- Track health trends over time
- Recommend interventions for struggling cells

### Mentor Matching Integration

Use cell data to inform mentor-mentee matching:

```typescript
// Get member's cell involvement
const memberships = await fetch(`/api/memberships?memberId=user123&active=true`)

// Find potential mentors (hosts/cohosts in similar themed cells)
const cells = await fetch(`/api/cells?communityId=comm1`)
// Filter by theme tags to match interests
```

**Integration strategies:**
1. **Interest-based matching**: Match members based on shared cell themes
2. **Experience matching**: Connect hosts (experienced) with new members
3. **Cross-cell connections**: Introduce members from complementary cells
4. **Activity-based matching**: Pair active members with those needing engagement

### External System Integration

The Cell Hub can integrate with:
- **Identity systems**: Use external `memberId` and `communityId` references
- **Event platforms**: Sync session records from calendar/event systems
- **Communication tools**: Link cells to Discord channels, Slack workspaces
- **Learning platforms**: Connect study cells to course content

## Architecture

### Generic Design Principles

This system is intentionally generic and can be adapted for various use cases:

- **Flexible IDs**: Uses external references (`communityId`, `memberId`) to integrate with any identity system
- **JSON Fields**: Theme tags and session metadata stored as JSON for flexibility
- **Role System**: Simple three-tier role system (Member, Host, Co-host)
- **Session Types**: Four predefined types plus extensible metadata field
- **Soft Deletes**: Track when members leave (can rejoin later)

### Scalability Considerations

- Database indexes on frequently queried fields
- Efficient queries with Prisma's relation loading
- API pagination support (limit parameters)
- Stateless API design for horizontal scaling

## Testing

Run the test suite:

```bash
# Run tests in watch mode
npm run test

# Run tests once (CI)
npm run test:ci
```

Tests cover:
- Validation schema tests for all domain models
- API route integration tests (TODO)
- UI component tests (TODO)

## Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use secure `DATABASE_URL` (managed PostgreSQL)
3. Configure proper CORS settings
4. Enable rate limiting on API routes
5. Set up monitoring and logging
6. Configure backup strategy for database
7. Use connection pooling (e.g., PgBouncer)

### Recommended Infrastructure

- **Database**: Managed PostgreSQL (AWS RDS, Supabase, Railway)
- **Hosting**: Vercel, Netlify, or Railway
- **Monitoring**: Sentry for errors, Datadog for metrics
- **CDN**: Cloudflare or AWS CloudFront

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

[MIT License](LICENSE)

## Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation
- Review existing issues and discussions

---

Built with Next.js, TypeScript, and Prisma.
