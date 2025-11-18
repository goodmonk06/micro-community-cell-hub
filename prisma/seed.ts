import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data
  await prisma.cellSessionRecord.deleteMany()
  await prisma.cellMembership.deleteMany()
  await prisma.cell.deleteMany()

  console.log('✨ Cleaned existing data')

  // Create sample cells
  const webDevCell = await prisma.cell.create({
    data: {
      communityId: 'community-1',
      key: 'web-dev-study',
      name: 'Web Development Study Group',
      descriptionMarkdown:
        'A community for learning modern web development technologies including React, TypeScript, and Next.js.',
      themeTagsJson: JSON.stringify(['javascript', 'react', 'typescript', 'frontend']),
    },
  })

  const designCell = await prisma.cell.create({
    data: {
      communityId: 'community-1',
      key: 'ui-ux-design',
      name: 'UI/UX Design Circle',
      descriptionMarkdown:
        'Exploring design principles, user experience patterns, and creating beautiful interfaces.',
      themeTagsJson: JSON.stringify(['design', 'ui', 'ux', 'figma']),
    },
  })

  const aiMlCell = await prisma.cell.create({
    data: {
      communityId: 'community-1',
      key: 'ai-ml-research',
      name: 'AI & Machine Learning Research',
      descriptionMarkdown:
        'Deep dive into artificial intelligence, machine learning algorithms, and practical applications.',
      themeTagsJson: JSON.stringify(['ai', 'ml', 'python', 'research']),
    },
  })

  const blockchainCell = await prisma.cell.create({
    data: {
      communityId: 'community-1',
      key: 'blockchain-dev',
      name: 'Blockchain Development',
      descriptionMarkdown:
        'Learning blockchain technology, smart contracts, and decentralized applications.',
      themeTagsJson: JSON.stringify(['blockchain', 'web3', 'solidity', 'ethereum']),
    },
  })

  const devopsCell = await prisma.cell.create({
    data: {
      communityId: 'community-1',
      key: 'devops-practices',
      name: 'DevOps & Cloud Infrastructure',
      descriptionMarkdown:
        'Mastering DevOps practices, CI/CD pipelines, and cloud infrastructure management.',
      themeTagsJson: JSON.stringify(['devops', 'cloud', 'docker', 'kubernetes']),
    },
  })

  console.log('✅ Created 5 cells')

  // Create memberships for Web Dev cell
  await prisma.cellMembership.createMany({
    data: [
      { cellId: webDevCell.id, memberId: 'user-001', role: 'HOST' },
      { cellId: webDevCell.id, memberId: 'user-002', role: 'COHOST' },
      { cellId: webDevCell.id, memberId: 'user-003', role: 'MEMBER' },
      { cellId: webDevCell.id, memberId: 'user-004', role: 'MEMBER' },
      { cellId: webDevCell.id, memberId: 'user-005', role: 'MEMBER' },
      { cellId: webDevCell.id, memberId: 'user-006', role: 'MEMBER' },
    ],
  })

  // Create memberships for Design cell
  await prisma.cellMembership.createMany({
    data: [
      { cellId: designCell.id, memberId: 'user-007', role: 'HOST' },
      { cellId: designCell.id, memberId: 'user-008', role: 'MEMBER' },
      { cellId: designCell.id, memberId: 'user-009', role: 'MEMBER' },
      { cellId: designCell.id, memberId: 'user-010', role: 'MEMBER' },
    ],
  })

  // Create memberships for AI/ML cell
  await prisma.cellMembership.createMany({
    data: [
      { cellId: aiMlCell.id, memberId: 'user-011', role: 'HOST' },
      { cellId: aiMlCell.id, memberId: 'user-012', role: 'COHOST' },
      { cellId: aiMlCell.id, memberId: 'user-013', role: 'MEMBER' },
      { cellId: aiMlCell.id, memberId: 'user-014', role: 'MEMBER' },
      { cellId: aiMlCell.id, memberId: 'user-015', role: 'MEMBER' },
      { cellId: aiMlCell.id, memberId: 'user-016', role: 'MEMBER' },
      { cellId: aiMlCell.id, memberId: 'user-017', role: 'MEMBER' },
      { cellId: aiMlCell.id, memberId: 'user-018', role: 'MEMBER' },
    ],
  })

  // Create memberships for Blockchain cell
  await prisma.cellMembership.createMany({
    data: [
      { cellId: blockchainCell.id, memberId: 'user-019', role: 'HOST' },
      { cellId: blockchainCell.id, memberId: 'user-020', role: 'MEMBER' },
      { cellId: blockchainCell.id, memberId: 'user-021', role: 'MEMBER' },
    ],
  })

  // Create memberships for DevOps cell
  await prisma.cellMembership.createMany({
    data: [
      { cellId: devopsCell.id, memberId: 'user-022', role: 'HOST' },
      { cellId: devopsCell.id, memberId: 'user-023', role: 'MEMBER' },
      { cellId: devopsCell.id, memberId: 'user-024', role: 'MEMBER' },
      { cellId: devopsCell.id, memberId: 'user-025', role: 'MEMBER' },
      { cellId: devopsCell.id, memberId: 'user-026', role: 'MEMBER' },
    ],
  })

  console.log('✅ Created memberships')

  // Create session records for Web Dev cell
  const now = new Date()
  await prisma.cellSessionRecord.createMany({
    data: [
      {
        cellId: webDevCell.id,
        ts: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        sessionType: 'STUDY',
        attendanceCount: 5,
        notesMarkdown: 'Covered React hooks and state management patterns.',
      },
      {
        cellId: webDevCell.id,
        ts: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        sessionType: 'CIRCLE',
        attendanceCount: 6,
        notesMarkdown: 'Group discussion on TypeScript best practices.',
      },
      {
        cellId: webDevCell.id,
        ts: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        sessionType: 'PROJECT',
        attendanceCount: 4,
        notesMarkdown: 'Started working on a collaborative Next.js project.',
      },
    ],
  })

  // Create session records for Design cell
  await prisma.cellSessionRecord.createMany({
    data: [
      {
        cellId: designCell.id,
        ts: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        sessionType: 'CIRCLE',
        attendanceCount: 4,
        notesMarkdown: 'Design critique session for mobile app interfaces.',
      },
      {
        cellId: designCell.id,
        ts: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        sessionType: 'STUDY',
        attendanceCount: 3,
        notesMarkdown: 'Learned about color theory and accessibility.',
      },
    ],
  })

  // Create session records for AI/ML cell
  await prisma.cellSessionRecord.createMany({
    data: [
      {
        cellId: aiMlCell.id,
        ts: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        sessionType: 'STUDY',
        attendanceCount: 7,
        notesMarkdown: 'Deep learning fundamentals and neural network architectures.',
      },
      {
        cellId: aiMlCell.id,
        ts: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        sessionType: 'PROJECT',
        attendanceCount: 6,
        notesMarkdown: 'Working on NLP project with transformers.',
      },
      {
        cellId: aiMlCell.id,
        ts: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        sessionType: 'CIRCLE',
        attendanceCount: 8,
        notesMarkdown: 'Discussion on AI ethics and responsible AI development.',
      },
    ],
  })

  // Create session records for Blockchain cell
  await prisma.cellSessionRecord.createMany({
    data: [
      {
        cellId: blockchainCell.id,
        ts: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        sessionType: 'STUDY',
        attendanceCount: 3,
        notesMarkdown: 'Smart contract development with Solidity.',
      },
    ],
  })

  // Create session records for DevOps cell
  await prisma.cellSessionRecord.createMany({
    data: [
      {
        cellId: devopsCell.id,
        ts: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        sessionType: 'PROJECT',
        attendanceCount: 5,
        notesMarkdown: 'Setting up CI/CD pipeline with GitHub Actions.',
      },
      {
        cellId: devopsCell.id,
        ts: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        sessionType: 'STUDY',
        attendanceCount: 4,
        notesMarkdown: 'Kubernetes deployment strategies.',
      },
    ],
  })

  console.log('✅ Created session records')

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
