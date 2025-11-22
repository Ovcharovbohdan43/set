# Finance OS — спецификация бизнес-логики

Документ описывает **доменную модель и логику обновления данных** между экранами:

- Dashboard  
- Transactions  
- Budgets  
- Goals  
- Reminders  
- Reports  
- Planning  

Цель: чтобы backend-разработчик мог проверить, что **все агрегаты и зависимости ведут себя одинаково** вне зависимости от того, где изменяются данные.

---

## План проверки логики (WIP)

- [x] Базовые правила и транзакции — просмотрено (`src-tauri/src/services/transactions/*`); отмечены расхождения, см. журнал.
- [x] Dashboard KPI — проверено (`src-tauri/src/services/dashboard/mod.rs`); есть отклонения от требований.
- [x] Budgets — проверено (`src-tauri/src/services/budgets/sqlite.rs`); есть отклонения от требований.
- [x] Goals — проверено (`src-tauri/src/services/goals/sqlite.rs`); есть отклонения от требований.
- [x] Reminders — проверено, внесены исправления.
- [ ] Reports — не проверено.
- [ ] Planning — не проверено.
- [ ] Sync/Settings/экспорт — не проверено.

## Журнал проверок (актуальные замечания)

- Dashboard (`src-tauri/src/services/dashboard/mod.rs`):
  - Net worth: считался как сумма всех `balance_cents` → исправлено, теперь активы минус пассивы (credit как liability).
  - Cash flow: считал последние 30 дней от `now` → исправлено, теперь 30 полных дней [start, end) в локальной TZ + предыдущие 30 дней.
  - Weekly spend: строился по последним 7 датам → исправлено, теперь неделя Sunday–Saturday.
  - Budget burn: активные бюджеты фильтровались `<= end_date` и при total=0 подставлялся `max(spent,1)` → исправлено, теперь `< end_date`, без подмены total.
  - Top accounts: сортировка по балансу → исправлено, теперь по модулю баланса (крупнейшие по абсолютной величине).
- Budgets (`src-tauri/src/services/budgets/sqlite.rs`):
  - Исправлено: расчёт периода по бюджету теперь `[start_date, end_date)` (раньше включал конец); remaining не уходит в минус; прогресс clamped 0..100.
  - Осталось: бюджет привязан к одной категории, фильтрации по аккаунтам/множеству категорий нет; rollover не участвует в расчётах.
- Goals (`src-tauri/src/services/goals/sqlite.rs`):
  - `current_cents` теперь считается как сумма доходов минус расходы по goal_id (расходы уменьшают накопления).
  - `add_contribution` остаётся прямым обновлением Goals без транзакции, но теперь прогресс/статус сверяются с пересчитанным текущим балансом; авто-achieve сохраняется.
  - Прогноз и `days_remaining` считают дни от `now` до `target_date`; если дата уже прошла — `days_remaining` пустое.
- Transactions (`src-tauri/src/services/transactions/sqlite.rs`):
  - Типы: `income/expense/transfer` (нет разделения transfer_in/out); `amount_cents` должен быть >0.
  - Баланс аккаунта — сумма доходов минус расходы; трансферы не двигают средства между аккаунтами.
  - Даты нормализуются в UTC через RFC3339; week/month правила из спецификации не применяются.
- Reminders (`src-tauri/src/services/reminders/sqlite.rs`):
  - Исправлено: snooze переносит `due_at`/`next_fire_at`, статус `snoozed`, лог записывается.
  - Исправлено: dismiss добавлен, статус переводится в `dismissed`, reminder исчезает из списка due.
  - Исправлено: due-reminders теперь отбирает `scheduled` и `snoozed`.
  - Осталось: упрощённый RRULE (DAILY/WEEKLY/MONTHLY), нет обновления due при сложных правилах.

## Выполненные исправления (код)
- Dashboard: net worth (учёт пассивов), cash flow (30 полноценных дней, локальная TZ), weekly spend (Sunday–Saturday), budget burn (границы периода, без подмены total), top accounts (по модулю баланса). Файл: `src-tauri/src/services/dashboard/mod.rs`.
- Goals: корректный учёт расходов в накоплениях целей, пересчёт статуса после `add_contribution`. Файл: `src-tauri/src/services/goals/sqlite.rs`.
- Budgets: период `[start, end)`, remaining не уходит в минус, прогресс clamped 0..100. Файл: `src-tauri/src/services/budgets/sqlite.rs`.
- Reminders: snooze обновляет due/next и статус, добавлен dismiss, due выборка учитывает snoozed. Файл: `src-tauri/src/services/reminders/sqlite.rs`.

## 1. Общие правила и допущения

### 1.1. Валюта и формат сумм

- `baseCurrency` — базовая валюта профиля (например, GBP).  
- Все суммы в БД хранятся в **базовой валюте** (без форматирования).  
- Форматирование (знак валюты, разделители, красный/зелёный цвет) — задача UI.  

### 1.2. Знаки для сумм

- `Transaction.amount` — всегда **положительное** число.
- Тип транзакции определяется полем `Transaction.type`:
  - `income` — доход.
  - `expense` — расход.
  - `transfer_out` / `transfer_in` (опционально, если будут переводы).
- Во всех агрегатах знак определяется формулой, а не хранится в поле `amount`.

Примеры:

- Баланс счёта:  
  `balance = openingBalance + sum(income) - sum(expense) + ...`.
- Cash flow / Net:  
  `net = sum(income) - sum(expense)`.

### 1.3. Даты и периоды

- `createdAt` / `date` хранятся в UTC; при расчётах используется **локальная тайм-зона пользователя**.
- **Месяц** — календарный (1-е число 00:00:00 до первого числа следующего месяца, не включая).  
- **30d cash flow** — последние 30 *полных* дней **включительно**, считая от текущей даты.  
- **Week** (для Weekly spend) — неделя **Sunday–Saturday**, как в подписи на графике.

### 1.4. Типы аккаунтов

Аккаунты разделены на:

- `asset` — активы (Checking, Savings, Cash и т.п.)
- `liability` — пассивы/долги (Credit Card, Loan и т.п.)

Это важно для расчёта **Net worth**.

---

## 2. Доменная модель

### 2.1. Account

```text
Account {
  id
  name               // Checking, Savings и т.п.
  type               // 'asset' | 'liability'
  openingBalance     // стартовый баланс
  currency           // = baseCurrency (пока считаем одну валюту)
  isArchived
  createdAt, updatedAt
}
Расчёт текущего баланса счёта
text
Copy code
accountBalance(account, asOfDate?) =
  openingBalance
+ sum(Transaction.amount where type in ('income','transfer_in')   and accountId=account.id and date<=asOfDate)
- sum(Transaction.amount where type in ('expense','transfer_out') and accountId=account.id and date<=asOfDate)
Если asOfDate не задан, берём все транзакции.

2.2. Transaction
text
Copy code
Transaction {
  id
  date               // дата операции
  accountId          // FK -> Account
  type               // 'income' | 'expense' | 'transfer_out' | 'transfer_in'
  amount             // > 0
  categoryId         // FK -> Category (опционально)
  notes
  goalId             // если транзакция относится к Goal (сбережение/списание)
  budgetId           // если привязана к конкретному бюджету (иначе — по правилу категорий)
  isPlanned          // false для фактических транзакций, true если создана из Planning (опционально)
  createdAt, updatedAt
}
2.3. Category
text
Copy code
Category {
  id
  name               // Groceries, Rent / Mortgage, Entertainment ...
  type               // 'income' или 'expense'
  icon               // emoji/иконка
}
Категории используются:

в транзакциях;

в отчётах (Spending by Category);

в бюджетах (привязка бюджета к набору категорий).

2.4. Budget
text
Copy code
Budget {
  id
  name               // Main family, Food, Transport …
  amount             // целевой лимит на период
  periodType         // 'monthly' (базово), в будущем: 'weekly','custom'
  startDate          // начало бюджетного периода
  endDate            // конец бюджетного периода (не включая)
  categoryIds[]      // категории, которые входят в бюджет (envelope-подход)
  accountIds[]       // опционально: ограничение по аккаунтам
  isArchived
  createdAt, updatedAt
}
Расчёт полей на UI
Spent:
spent = sum(Transaction.amount)
где type='expense', date ∈ [startDate, endDate), категория ∈ categoryIds, аккаунт ∈ accountIds (если заданы).

Remaining:
remaining = max(amount - spent, 0).

% used:
percentUsed = clamp( spent / amount * 100, 0, 100 )
Если amount = 0 → percentUsed = 0.

Эти значения используются:

на экране Budgets;

в блоке Budget burn на Dashboard;

в графике Budget Progress на Reports.

2.5. Goal (Savings Goal)
text
Copy code
Goal {
  id
  name               // buy a car
  targetAmount       // $5000
  targetDate         // дедлайн для расчёта "days left"
  status             // 'active' | 'paused' | 'achieved' | 'abandoned'
  linkedAccountId    // счёт, на котором ведутся сбережения (опционально)
  createdAt, updatedAt
}
Деривативные поля
SavedAmount
Суммируем все транзакции, связанные с Goal:

text
Copy code
saved = sum(Transaction.amount where goalId = Goal.id and type='income')
      - sum(Transaction.amount where goalId = Goal.id and type='expense')
(если модель другая — можно считать только специальные savings транзакции, но важен принцип: Goal не хранит сумму, она считается.)

Remaining:
remaining = max(targetAmount - saved, 0).

Progress %:
progress = clamp(saved / targetAmount * 100, 0, 100).

Days left:
daysLeft = (targetDate - today).days (если targetDate есть и status='active').

Статус индексирует Goal в табах Active / Paused / Achieved / Abandoned.

2.6. Reminder
text
Copy code
Reminder {
  id
  title              // текст заголовка
  description        // дополнительные детали
  amount
  accountId          // опционально
  dueDateTime        // дата/время ближайшего срабатывания
  recurrenceRule     // 'once' | 'monthly' | 'weekly' | cron-like строка
  status             // 'scheduled' | 'snoozed' | 'dismissed'
  snoozedUntil       // если status='snoozed'
  createdAt, updatedAt
}
На экране Reminders показываются только status in ('scheduled','snoozed').

Кнопки:

Snooze — сдвигает snoozedUntil (например, +24 часа) и ставит status='snoozed'.

Dismiss — ставит status='dismissed' (больше не напоминать).

Back-end должен триггерить системные уведомления (или отдавать список “активных” напоминаний фронту).

2.7. Planning (ежемесячный план)
Планируется по месяцам.

text
Copy code
Plan {
  id
  month             // YYYY-MM, например '2025-11'
  createdAt, updatedAt
}
Четыре типа записей:

2.7.1. PlannedIncome
text
Copy code
PlannedIncome {
  id
  planId             // FK -> Plan
  sourceType         // enum: 'Salary','Bonus','Other' ...
  amount
  date               // ожидаемая дата поступления
  accountId          // счёт, куда придёт
}
2.7.2. PlannedExpense
text
Copy code
PlannedExpense {
  id
  planId
  name               // описание
  amount
  categoryId         // опционально
  recurrence         // 'once','weekly','monthly' (для этого плана)
  firstDueDate       // первая дата в рамках плана
}
2.7.3. PlannedSaving
text
Copy code
PlannedSaving {
  id
  planId
  goalId             // связанная цель (опционально)
  plannedAmount
  actualAmount       // фактические сбережения за месяц (агрегат по транзакциям)
}
actualAmount не вводится пользователем, а рассчитывается по связанным транзакциям за этот месяц.

2.7.4. PlannedDebtPayment
text
Copy code
PlannedDebtPayment {
  id
  planId
  name               // название кредита/долга
  principal
  interestRate       // годовая %
  minPayment
  currentBalance
  nextPaymentDate
}
Эти записи используются для:

верхнего графика Plan vs Actual (Income / Expense / Savings);

подсказок и автогенерации напоминаний / транзакций (в будущем).

3. Логика экранов и зависимостей
3.1. Dashboard — «Financial cockpit»
На дашборде показываются:

Net worth

30d cash flow

Budget burn

Weekly spend

Top accounts

Быстрые действия: Add transaction / Add goal

3.1.1. Net worth
text
Copy code
netWorth(asOfNow) =
  sum( accountBalance(a) for a.type='asset' )
- sum( accountBalance(a) for a.type='liability' )
Когда пересчитывать:

при создании/редактировании/удалении Transaction;

при создании/редактировании/удалении Account;

при изменении openingBalance или type аккаунта.

3.1.2. 30d cash flow
text
Copy code
periodStart = today - 30 days (inclusive)

income30d  = sum(T.amount where T.type='income'  and T.date between periodStart and today)
expense30d = sum(T.amount where T.type='expense' and T.date between periodStart and today)

cashFlow30d = income30d - expense30d
Показывается как одно число (может быть отрицательным).
Дублируется маленькой подписью ▼ -£775.00 как изменение относительно предыдущего периода 30 дней (опционально).

Пересчёт: при любых изменениях в Transaction за последние 60 дней (текущий и предыдущий период).

3.1.3. Budget burn
Состоит из:

spentTotal — суммарно потрачено по всем активным бюджетам текущего периода;

budgetTotal — сумма лимитов этих бюджетов;

прогресс-бар (spentTotal / budgetTotal);

подпись x% of tracked envelopes have been used this period.

text
Copy code
activeBudgets = Budget where today ∈ [startDate, endDate) and !isArchived

spentTotal  = sum( spent(budget) for budget in activeBudgets )
budgetTotal = sum( budget.amount   for budget in activeBudgets )

budgetBurnPercent = spentTotal / budgetTotal * 100

usedEnvelopesPercent =
   count(budget where spent(budget) > 0) / count(activeBudgets) * 100
Пересчёт:

при изменении/создании/удалении Budget;

при изменении любой Transaction, попадающей в период любого активного бюджета.

3.1.4. Weekly spend
text
Copy code
weekStart = last Sunday 00:00
weekEnd   = next Sunday 00:00 (не включая)

weeklySpend = sum(T.amount where T.type='expense' and T.date ∈ [weekStart, weekEnd))
График по дням недели:

text
Copy code
dailySpend[day] = sum(expense in this day)
Пересчёт: при изменении/создании/удалении Transaction в пределах текущей недели.

3.1.5. Top accounts
Показывается список (на скрине — 1) с наибольшим по модулю балансом (или просто по активам).

text
Copy code
accountsSorted = sortByDesc( abs(accountBalance(a)) )
topN = 3 (или 5)
Обновляется при изменении транзакций и аккаунтов.

3.2. Transactions — «Transactions workspace»
Функциональность:

список всех транзакций;

фильтр по аккаунту, категории, поиску;

добавление / редактирование / удаление;

импорт (Import sample);

визуальное различение доходов (зелёный) и расходов (красный).

3.2.1. Фильтры
Account — dropdown:

All accounts → без фильтра.

иначе where accountId = selectedAccountId.

Category — dropdown:

All categories → без фильтра.

иначе where categoryId = selectedCategoryId.

Search:

тип — текстовый.

ищет по notes, по названию категории, возможно по account name.

SQL-подобный фильтр: ILIKE '%query%'.

Результат сортируется по date desc.

3.2.2. Создание транзакции
Входные поля (предположительно):

date

accountId

amount

type (income/expense)

categoryId

notes

(goalId, budgetId — опционально)

Логика:

Валидация:

amount > 0.

date не пустая.

accountId существует.

Сохранение Transaction.

Триггер пересчёта агрегатов:

Баланс затронутого аккаунта.

Net worth.

30d cash flow (если дата в нужном диапазоне).

Weekly spend (если дата в текущей неделе).

Budget burn + Budgets (если категория/аккаунт попадает в бюджеты).

Goals (если есть goalId).

Reports (месяц транзакции).

Planning — факт (Actual в графике Plan vs Actual, если месяц совпадает с выбранным планом).

3.2.3. Редактирование транзакции
Находим старую транзакцию T_old.

Сохраняем новую T_new.

Пересчитываем все агрегаты для старой и новой дат / аккаунтов / категорий:

если изменился аккаунт — пересчитать оба.

если изменился тип/amount — все завязанные суммы.

если изменился месяц — старый месяц и новый в отчётах / планах.

3.2.4. Удаление транзакции
Аналогично редактированию, но используем только T_old для пересчёта.

3.2.5. Import sample
Импорт создаёт обычные транзакции (флаг isSample можно хранить, но бизнес-логика не отличается).

После импорта выполняется тот же пересчёт.

3.3. Budgets
Экран показывает список действующих бюджетов.

Карточка бюджета:

name

spent / amount

% used

remaining

Все эти значения считаются как в разделе 2.4.

3.3.1. Добавление/редактирование бюджета
Пользователь вводит:

name

amount

период (start/end или только месяц)

категории (envelopes)

аккаунты (опционально).

После сохранения:

Пересчитать spent по уже существующим транзакциям за период.

Обновить:

экран Budgets,

блок Budget burn на Dashboard,

раздел Budget Progress на Reports.

3.3.2. Логика распределения транзакций по бюджетам
По умолчанию:

text
Copy code
transaction → относится ко всем бюджетам, где:
  T.date ∈ [Budget.startDate, Budget.endDate),
  T.categoryId ∈ Budget.categoryIds,
  T.accountId ∈ Budget.accountIds (если список не пустой)
Если у транзакции явно указан budgetId, она учитывается только в этом бюджете.

3.4. Goals
Экран делится на вкладки Active / Paused / Achieved / Abandoned.

Карточка Goal:

title

savedAmount / targetAmount

% complete

remaining amount

days left

Все расчёты — как в 2.5.

3.4.1. Добавление/редактирование Goal
Поля:

name

targetAmount

targetDate

linkedAccountId (опционально)

После сохранения:

Goal появляется в нужной вкладке (статус active по умолчанию).

Пересчёт выполняется только при наличии транзакций с goalId.

3.4.2. Как транзакции влияют на Goal
Если транзакция отмечена как "пополнение цели" (goalId задан и type='income'), она увеличивает savedAmount.

Если транзакция с type='expense' и тем же goalId, она уменьшает savedAmount (например, расход с накопленного).

Пересчёт при изменении транзакции:

если изменился goalId или type или amount → пересчитать оба goal: старый и новый.

3.5. Reminders
Экран показывает список Reminder со статусом scheduled/snoozed.

Карточка:

title

description

amount

(account)

текст "In X hours" (разница между now и dueDateTime/snoozedUntil)

кнопки Snooze / Dismiss

3.5.1. Snooze
Логика:

text
Copy code
on Snooze(reminderId):
  reminder.status = 'snoozed'
  reminder.snoozedUntil = now + defaultSnoozeInterval (например, 24 часа)
  reminder.dueDateTime  = reminder.snoozedUntil
3.5.2. Dismiss
text
Copy code
on Dismiss(reminderId):
  reminder.status = 'dismissed'
Напоминание исчезает с экрана.

3.6. Reports & Analytics
Экран состоит из нескольких блоков:

Spending by Category (donut chart)

Income vs Expenses (bar chart)

12-Month Trend (scatter/line)

Budget Progress (bar chart)

Итоги: Total Income / Total Expenses / Net

На верхней панели — навигация по месяцам: Previous / [Month Year] / Next.

3.6.1. Параметры отчёта
currentMonth — выбранный месяц (по умолчанию — текущий).

period = [monthStart, monthEnd).

Все расчёты ниже делаются только по транзакциям с date ∈ period.

3.6.2. Spending by Category
text
Copy code
expensesByCategory[categoryId] =
  sum(T.amount where T.type='expense' and T.categoryId=categoryId and T.date∈period)
График:

каждая категория — сегмент donut.

подпись: categoryName.

цвет иконки задаётся UI.

3.6.3. Income vs Expenses
text
Copy code
incomeTotal  = sum(T.amount where T.type='income'  and T.date∈period)
expenseTotal = sum(T.amount where T.type='expense' and T.date∈period)
net          = incomeTotal - expenseTotal
Столбики:

зелёный — Income,

красный — Expenses,

жёлтый — Net.

3.6.4. 12-Month Trend
Для 12 последних месяцев, включая текущий:

text
Copy code
for each month M in last 12 months:
  incomeM  = sum(income in month M)
  expenseM = sum(expense in month M)
  netM     = incomeM - expenseM
Используется в точечном/линейном графике.

3.6.5. Budget Progress
Для каждого бюджета, чей период пересекается с выбранным месяцем, считаем:

text
Copy code
budgetTarget = Budget.amount
budgetSpent  = sum(expenses, относящихся к этому бюджету в этом месяце)
График отображает Target и Spent по каждому бюджету.

3.6.6. Итоги (Total Income / Total Expenses / Net)
Это те же значения incomeTotal, expenseTotal и net из блока Income vs Expenses — продублированы внизу.

3.7. Planning
Экран позволяет:

выбрать план по месяцу ([November 2025] dropdown);

внести планируемые Income / Expenses / Savings / Debts and loans;

видеть график Plan vs Actual по этим категориям.

3.7.1. План по месяцу
При выборе месяца:

Если Plan для этого месяца существует — загрузить его и связанные Planned*.

Если не существует — создать пустой Plan (или отображать «No planned items» до первого добавления).

3.7.2. Добавление записей
Каждый блок (Income / Expenses / Savings / Debts) имеет форму:

при клике Add создаётся соответствующая Planned* запись, привязанная к текущему Plan.

Важно: добавление записей в план не создаёт факт-транзакции автоматически (это только ожидаемые значения).

В будущем возможен функционал: «создать транзакцию из плана», но в текущей логике это не требуется.

3.7.3. График Plan vs Actual
Для выбранного месяца:

text
Copy code
planIncome  = sum(PlannedIncome.amount   where plan.month=currentMonth)
planExpense = sum(PlannedExpense.amount  where plan.month=currentMonth)
planSaving  = sum(PlannedSaving.plannedAmount where plan.month=currentMonth)

actualIncome  = sum(Transaction.amount where type='income'  and date∈month)
actualExpense = sum(Transaction.amount where type='expense' and date∈month)
actualSaving  = sum(сумма транзакций, помеченных как savings/goal, за месяц)
График отображает:

для каждой оси (Income / Expense / Savings) две колонки:

Plan

Actual

Связь с остальными экранами:

Actual значения берутся из тех же Transaction, которые используются в Reports, Dashboard и т.д.

Любое изменение транзакций за месяц должно автоматически обновлять этот график.

4. Точки обновления (event-driven взгляд)
Ниже перечислены ключевые события и то, что должно пересчитываться.

4.1. TransactionCreated / TransactionUpdated / TransactionDeleted
Пересчитываем:

Баланс затронутого аккаунта/аккаунтов.

Net worth.

30d cash flow.

Weekly spend (если дата затрагивает текущую неделю).

Budgets:

карточки конкретных бюджетов;

Budget burn.

Goals, если транзакция связана с goal или была связана до изменения.

Reports:

текущий месяц;

месяц старой/новой даты транзакции (если месяц изменился).

Planning:

Actual значения для выбранного плана месяца.

4.2. AccountCreated / AccountUpdated / AccountDeleted
Net worth.

Top accounts.

Budget burn и Budgets (если бюджет фильтруется по аккаунтам).

Все отчёты, где фигурируют связные транзакции.

4.3. BudgetCreated / BudgetUpdated / BudgetDeleted
Пересчёт spent / remaining / % used для бюджета.

Обновление Budget burn.

Обновление Budget Progress в Reports.

4.4. GoalCreated / GoalUpdated / GoalDeleted
Список и карточки Goals.

При смене статуса — перенос между вкладками.

При удалении — опционально убрать goalId из транзакций или запретить удаление, если есть связанные транзакции.

4.5. ReminderCreated / ReminderUpdated / ReminderDeleted
Обновление списка Reminders.

Обновление фоновых задач уведомлений (если реализованы).

4.6. Plan / Planned* Created / Updated / Deleted
Обновление графика Plan vs Actual (часть Plan).

Сами транзакции не затрагиваются, пока явно не реализована связь.

5. Критерии готовности (DoD) для backend
Backend считается реализованным корректно, если:

Консистентность агрегатов

После любой CRUD-операции с Transaction:

Баланс всех аккаунтов совпадает с агрегированными значениями в отчётах.

Net worth на Dashboard = сумма активов – пассивов по всем Account.

Cash flow 30d = разница между суммой доходов и расходов за 30 дней в таблице транзакций.

Weekly spend = сумма расходов за текущую неделю.

После изменения Budget:

spent по бюджету = сумма расходов по категориям/аккаунтам в его период.

Budget burn отображает сумму spent / сумму amount всех активных бюджетов и совпадает с Budgets/Reports.

Единый источник правды для транзакций

Все отчёты (Reports, Dashboard, Planning Actual) используют одни и те же данные Transaction, а не собственные кэши.

Правильная фильтрация по времени

Переключение месяца на Reports изменяет все агрегаты ровно на те значения, которые получаются SQL-запросом с фильтром по датам.

12-Month Trend охватывает именно 12 календарных месяцев.

Корректная работа Goals

SavedAmount, Remaining и % Complete совпадают с суммой транзакций, связанных с Goal.

Изменение/удаление транзакции сразу отражается в соответствующем Goal.

Reminders

Snooze → меняет статус на snoozed, переносит dueDateTime.

Dismiss → переводит в dismissed, напоминание исчезает из списка.

Planning

Суммы Plan берутся из таблиц Planned*.

Actual — из Transaction за выбранный месяц.

Изменение транзакций за месяц меняет Actual на Planning и Reports одинаково.

Масштабируемость

Все агрегаты считаются либо:

SQL-запросами с агрегатными функциями,

либо через кэш/материализованные таблицы, которые корректно инвалиируются на событиях выше.

6. Возможное API (high-level, необязательно)
(опциональный раздел для ориентира, не жёсткий контракт)

GET /dashboard → отдаёт агрегаты: netWorth, cashFlow30d, weeklySpend, budgetBurn, topAccounts.

GET /transactions + фильтры.

POST/PUT/DELETE /transactions/:id.

GET /budgets, POST/PUT/DELETE /budgets/:id.

GET /goals, POST/PUT/DELETE /goals/:id.

GET /reminders, POST/PUT/DELETE /reminders/:id, POST /reminders/:id/snooze, POST /reminders/:id/dismiss.

GET /reports?month=YYYY-MM.

GET /planning?month=YYYY-MM, POST/PUT/DELETE /planned-income, /planned-expense, /planned-saving, /planned-debt.

