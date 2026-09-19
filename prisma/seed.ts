import { PrismaClient, Stage, type Currency } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PASSWORD = "password123";

async function upsertUser(
  email: string,
  name: string,
  role: "ADMIN" | "REVIEWER" | "VIEWER",
  disabled = false,
) {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const disabledAt = disabled ? new Date() : null;
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, disabledAt },
    create: { email, name, role, passwordHash, disabledAt },
  });
}

type OpportunitySeed = {
  companyName: string;
  requestedAmount: number;
  currency: Currency;
  description: string;
  submissionDate: Date;
  createdById: string;
  reviewerId?: string;
  /** Stage transitions to apply in order, starting from DRAFT. */
  stageHistory?: Stage[];
  stageActorId?: string;
  comments?: { authorId: string; body: string }[];
  archived?: boolean;
};

async function seedOpportunity(seed: OpportunitySeed) {
  const opportunity = await prisma.opportunity.create({
    data: {
      companyName: seed.companyName,
      requestedAmount: seed.requestedAmount,
      currency: seed.currency,
      description: seed.description,
      submissionDate: seed.submissionDate,
      createdById: seed.createdById,
      reviewerId: seed.reviewerId ?? null,
    },
  });

  await prisma.activity.create({
    data: { opportunityId: opportunity.id, type: "CREATED", actorId: seed.createdById },
  });

  if (seed.reviewerId) {
    await prisma.activity.create({
      data: {
        opportunityId: opportunity.id,
        type: "REVIEWER_ASSIGNED",
        actorId: seed.createdById,
        newReviewerId: seed.reviewerId,
      },
    });
  }

  let currentStage: Stage = Stage.DRAFT;
  for (const nextStage of seed.stageHistory ?? []) {
    await prisma.opportunity.update({ where: { id: opportunity.id }, data: { stage: nextStage } });
    await prisma.activity.create({
      data: {
        opportunityId: opportunity.id,
        type: "STAGE_CHANGED",
        actorId: seed.stageActorId ?? seed.createdById,
        previousStage: currentStage,
        newStage: nextStage,
      },
    });
    currentStage = nextStage;
  }

  for (const comment of seed.comments ?? []) {
    const created = await prisma.comment.create({
      data: { opportunityId: opportunity.id, authorId: comment.authorId, body: comment.body },
    });
    await prisma.activity.create({
      data: {
        opportunityId: opportunity.id,
        type: "COMMENT_ADDED",
        actorId: comment.authorId,
        commentId: created.id,
      },
    });
  }

  if (seed.archived) {
    await prisma.opportunity.update({ where: { id: opportunity.id }, data: { archivedAt: new Date() } });
    await prisma.activity.create({
      data: { opportunityId: opportunity.id, type: "ARCHIVED", actorId: seed.createdById },
    });
  }

  return opportunity;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function main() {
  console.log("Seeding users...");
  const admin = await upsertUser("admin@nexudy.test", "Alex Morgan", "ADMIN");
  const reviewer1 = await upsertUser("reviewer1@nexudy.test", "Priya Shah", "REVIEWER");
  const reviewer2 = await upsertUser("reviewer2@nexudy.test", "Marcus Webb", "REVIEWER");
  await upsertUser("viewer@nexudy.test", "Jordan Lee", "VIEWER");
  await upsertUser("former-reviewer@nexudy.test", "Sam Ellis", "REVIEWER", true);

  console.log("Clearing existing opportunity data...");
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.opportunity.deleteMany();

  console.log("Seeding opportunities...");

  await seedOpportunity({
    companyName: "Acme Robotics",
    requestedAmount: 250_000,
    currency: "USD",
    description: "Series A extension to fund a second warehouse-automation product line.",
    submissionDate: daysAgo(3),
    createdById: admin.id,
  });

  await seedOpportunity({
    companyName: "Nova Biotech",
    requestedAmount: 1_200_000,
    currency: "EUR",
    description: "Bridge financing ahead of Phase II trial results for its oncology candidate.",
    submissionDate: daysAgo(10),
    createdById: admin.id,
    reviewerId: reviewer1.id,
    stageHistory: [Stage.UNDER_REVIEW],
    stageActorId: reviewer1.id,
    comments: [
      { authorId: reviewer1.id, body: "Trial data looks promising; requesting updated cap table before proceeding." },
      { authorId: admin.id, body: "Cap table received and forwarded to the reviewer." },
    ],
  });

  await seedOpportunity({
    companyName: "Solstice Energy",
    requestedAmount: 800_000,
    currency: "GBP",
    description: "Working capital for a commercial rollout of rooftop solar leasing.",
    submissionDate: daysAgo(6),
    createdById: admin.id,
    reviewerId: reviewer2.id,
    stageHistory: [Stage.UNDER_REVIEW],
    stageActorId: reviewer2.id,
  });

  await seedOpportunity({
    companyName: "BrightPath Logistics",
    requestedAmount: 450_000,
    currency: "USD",
    description: "Fleet expansion for last-mile delivery contracts in the Midwest.",
    submissionDate: daysAgo(20),
    createdById: admin.id,
    reviewerId: reviewer1.id,
    stageHistory: [Stage.UNDER_REVIEW, Stage.APPROVED],
    stageActorId: reviewer1.id,
    comments: [{ authorId: reviewer1.id, body: "Financials check out. Recommending approval." }],
  });

  await seedOpportunity({
    companyName: "Cobalt Materials",
    requestedAmount: 600_000,
    currency: "USD",
    description: "Capital for a pilot battery-recycling facility.",
    submissionDate: daysAgo(25),
    createdById: admin.id,
    reviewerId: reviewer2.id,
    stageHistory: [Stage.UNDER_REVIEW, Stage.REJECTED],
    stageActorId: reviewer2.id,
    comments: [
      { authorId: reviewer2.id, body: "Environmental permitting timeline is too uncertain for this round." },
    ],
  });

  await seedOpportunity({
    companyName: "Meridian Health",
    requestedAmount: 300_000,
    currency: "EUR",
    description: "Seed round for a remote patient-monitoring platform.",
    submissionDate: daysAgo(1),
    createdById: admin.id,
  });

  await seedOpportunity({
    companyName: "Orbital Freight",
    requestedAmount: 950_000,
    currency: "USD",
    description: "Expansion financing for a regional freight brokerage.",
    submissionDate: daysAgo(8),
    createdById: admin.id,
    reviewerId: reviewer1.id,
    stageHistory: [Stage.UNDER_REVIEW],
    stageActorId: reviewer1.id,
  });

  await seedOpportunity({
    companyName: "Lumen Analytics",
    requestedAmount: 500_000,
    currency: "GBP",
    description: "Growth capital for a retail demand-forecasting SaaS product.",
    submissionDate: daysAgo(30),
    createdById: admin.id,
    reviewerId: reviewer2.id,
    stageHistory: [Stage.UNDER_REVIEW, Stage.APPROVED],
    stageActorId: reviewer2.id,
  });

  await seedOpportunity({
    companyName: "Terra Foods",
    requestedAmount: 275_000,
    currency: "EUR",
    description: "Working capital for expanding vertical-farming production capacity.",
    submissionDate: daysAgo(18),
    createdById: admin.id,
    reviewerId: reviewer1.id,
    stageHistory: [Stage.UNDER_REVIEW, Stage.REJECTED],
    stageActorId: reviewer1.id,
  });

  await seedOpportunity({
    companyName: "Pinecrest Capital Partners",
    requestedAmount: 2_000_000,
    currency: "GBP",
    description: "Co-investment request for a commercial real estate refinancing.",
    submissionDate: daysAgo(2),
    createdById: admin.id,
  });

  await seedOpportunity({
    companyName: "Vantage Water Systems",
    requestedAmount: 720_000,
    currency: "USD",
    description: "Capital for municipal water-treatment equipment upgrades.",
    submissionDate: daysAgo(12),
    createdById: admin.id,
    reviewerId: reviewer2.id,
    stageHistory: [Stage.UNDER_REVIEW],
    stageActorId: reviewer2.id,
    comments: [{ authorId: reviewer2.id, body: "Waiting on the municipal contract addendum before recommending a decision." }],
  });

  await seedOpportunity({
    companyName: "Hearthstone Housing",
    requestedAmount: 1_500_000,
    currency: "USD",
    description: "Construction financing for a modular affordable-housing development.",
    submissionDate: daysAgo(40),
    createdById: admin.id,
    reviewerId: reviewer1.id,
    stageHistory: [Stage.UNDER_REVIEW, Stage.APPROVED],
    stageActorId: reviewer1.id,
  });

  await seedOpportunity({
    companyName: "Circuit Grove Semiconductors",
    requestedAmount: 3_000_000,
    currency: "EUR",
    description: "Expansion capital for a specialty semiconductor test facility.",
    submissionDate: daysAgo(60),
    createdById: admin.id,
    reviewerId: reviewer2.id,
    stageHistory: [Stage.UNDER_REVIEW, Stage.APPROVED],
    stageActorId: reviewer2.id,
    comments: [{ authorId: reviewer2.id, body: "Approved last quarter; archiving now that funds have been disbursed." }],
    archived: true,
  });

  await seedOpportunity({
    companyName: "Fenwick Retail Co",
    requestedAmount: 180_000,
    currency: "GBP",
    description: "Inventory financing ahead of a seasonal retail expansion.",
    submissionDate: daysAgo(50),
    createdById: admin.id,
    reviewerId: reviewer1.id,
    stageHistory: [Stage.UNDER_REVIEW, Stage.REJECTED],
    stageActorId: reviewer1.id,
    archived: true,
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
