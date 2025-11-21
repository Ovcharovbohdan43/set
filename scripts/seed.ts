import { PrismaClient } from '@prisma/client';
import pino from 'pino';

const logger = pino({
  name: 'db-seed',
  level: process.env.LOG_LEVEL ?? 'info'
});

const prisma = new PrismaClient();

const ACCOUNT_TYPES = {
  checking: 'checking',
  savings: 'savings'
} as const;

const TRANSACTION_TYPES = {
  income: 'income',
  expense: 'expense',
  transfer: 'transfer'
} as const;

const BUDGET_PERIODS = {
  monthly: 'monthly'
} as const;

const BUDGET_TYPES = {
  envelope: 'envelope'
} as const;

const GOAL_STATUSES = {
  active: 'active'
} as const;

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

async function upsertUser() {
  const userId = 'seed-user';
  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {
      default_currency: 'USD',
      locale: 'en-US'
    },
    create: {
      id: userId,
      display_name: 'Seed User',
      default_currency: 'USD',
      locale: 'en-US'
    }
  });
  return user;
}

async function upsertAccounts(userId: string) {
  const accounts = [
    {
      id: 'acct-checking',
      name: 'Main Checking',
      type: ACCOUNT_TYPES.checking
    },
    {
      id: 'acct-savings',
      name: 'Emergency Savings',
      type: ACCOUNT_TYPES.savings
    }
  ];

  for (const account of accounts) {
    await prisma.account.upsert({
      where: { id: account.id },
      update: {
        user_id: userId,
        name: account.name,
        type: account.type,
        currency: 'USD'
      },
      create: {
        id: account.id,
        user_id: userId,
        name: account.name,
        type: account.type,
        currency: 'USD'
      }
    });
  }
}

async function upsertCategories(userId: string) {
  const categories = [
    { id: 'cat-income', name: 'Salary', type: TRANSACTION_TYPES.income },
    { id: 'cat-groceries', name: 'Groceries', type: TRANSACTION_TYPES.expense },
    { id: 'cat-rent', name: 'Rent', type: TRANSACTION_TYPES.expense },
    { id: 'cat-transfer', name: 'Transfers', type: TRANSACTION_TYPES.transfer }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {
        user_id: userId,
        name: category.name,
        type: category.type
      },
      create: {
        id: category.id,
        user_id: userId,
        name: category.name,
        type: category.type
      }
    });
  }
}

async function seedBudgets(userId: string) {
  const { start, end } = getCurrentMonthRange();
  const budgets = [
    {
      id: 'budget-groceries',
      name: 'Groceries - Monthly',
      period: BUDGET_PERIODS.monthly,
      type: BUDGET_TYPES.envelope,
      category_id: 'cat-groceries',
      amount_cents: 60000,
      rollover: true,
      alert_threshold: 0.8
    },
    {
      id: 'budget-rent',
      name: 'Rent - Monthly',
      period: BUDGET_PERIODS.monthly,
      type: BUDGET_TYPES.envelope,
      category_id: 'cat-rent',
      amount_cents: 120000,
      rollover: false,
      alert_threshold: 0.9
    },
    {
      id: 'budget-overall',
      name: 'Overall Monthly Budget',
      period: BUDGET_PERIODS.monthly,
      type: 'overall' as const,
      category_id: null,
      amount_cents: 300000,
      rollover: false,
      alert_threshold: 0.85
    }
  ];

  for (const budget of budgets) {
    await prisma.budget.upsert({
      where: { id: budget.id },
      update: {
        user_id: userId,
        name: budget.name,
        period: budget.period,
        type: budget.type,
        category_id: budget.category_id,
        amount_cents: budget.amount_cents,
        start_date: start,
        end_date: end,
        rollover: budget.rollover,
        alert_threshold: budget.alert_threshold
      },
      create: {
        id: budget.id,
        user_id: userId,
        name: budget.name,
        period: budget.period,
        type: budget.type,
        category_id: budget.category_id,
        amount_cents: budget.amount_cents,
        start_date: start,
        end_date: end,
        rollover: budget.rollover,
        alert_threshold: budget.alert_threshold
      }
    });
  }
}

async function seedGoals(userId: string) {
  const goals = [
    {
      id: 'goal-emergency-fund',
      name: 'Emergency Fund',
      target_cents: 500000,
      current_cents: 100000,
      status: GOAL_STATUSES.active,
      priority: 2,
      target_date: null
    },
    {
      id: 'goal-vacation',
      name: 'Vacation Fund',
      target_cents: 200000,
      current_cents: 50000,
      status: GOAL_STATUSES.active,
      priority: 1,
      target_date: new Date(Date.UTC(2025, 6, 1)) // July 2025
    },
    {
      id: 'goal-car',
      name: 'New Car Down Payment',
      target_cents: 1000000,
      current_cents: 250000,
      status: GOAL_STATUSES.active,
      priority: 3,
      target_date: new Date(Date.UTC(2025, 11, 31)) // December 2025
    }
  ];

  for (const goal of goals) {
    await prisma.goal.upsert({
      where: { id: goal.id },
      update: {
        user_id: userId,
        name: goal.name,
        target_cents: goal.target_cents,
        current_cents: goal.current_cents,
        status: goal.status,
        priority: goal.priority,
        target_date: goal.target_date
      },
      create: {
        id: goal.id,
        user_id: userId,
        name: goal.name,
        target_cents: goal.target_cents,
        current_cents: goal.current_cents,
        status: goal.status,
        priority: goal.priority,
        target_date: goal.target_date
      }
    });
  }
}

async function seedSampleTransaction(userId: string) {
  await prisma.transaction.upsert({
    where: { id: 'tx-sample' },
    update: {},
    create: {
      id: 'tx-sample',
      user_id: userId,
      account_id: 'acct-checking',
      category_id: 'cat-groceries',
      type: TRANSACTION_TYPES.expense,
      amount_cents: 8200,
      currency: 'USD',
      occurred_on: new Date(),
      notes: 'Sample seeded purchase',
      tags: 'seed,groceries'
    }
  });
}

async function main() {
  const user = await upsertUser();
  await upsertAccounts(user.id);
  await upsertCategories(user.id);
  await Promise.all([seedBudgets(user.id), seedGoals(user.id), seedReminders(user.id)]);

  await seedSampleTransaction(user.id);

  logger.info({ userId: user.id }, 'Seed data ready');
}

main()
  .catch((error) => {
    logger.error({ err: error }, 'Seed script failed');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
