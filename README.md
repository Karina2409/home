# Home — семейное приложение

## 1. Общее описание

**Home** — это PWA-приложение для семьи (два взрослых пользователя) на базе Angular, PrimeNG, Tailwind и Supabase. Приложение объединяет бытовые модули: блюда, холодильник, запасы, задания, уборку, новинки, аптечку, вопросы для пары и рандомайзер.

Интерфейс — только русский. Дизайн в стиле Material, цветовая схема:

- Primary: `#C26D55`
- Secondary: `#8FA18B`
- Tertiary / фон: `#F9F6F0`
- Neutral (текст): `#2D2D2D`

Макеты в Figma: https://www.figma.com/design/Fl6Wchdabo8Ns6RTQrJk7W/Семейное-приложение

## 2. Технологии

- **Angular v22** — фреймворк
- **PrimeNG** — UI-компоненты
- **Tailwind CSS** — кастомная стилизация
- **Supabase** — БД (Postgres), Auth, Realtime, Storage (опционально), Edge Functions (для push)
- **PWA** — installable web app, service worker, push-уведомления

## 3. Целевая аудитория

Два взрослых пользователя. Ролей нет, все пользователи равноправны. Пользователи фиксированные, приглашения по ссылке не нужны.

## 4. Архитектура фронтенда

```
src/app/
  core/               # авторизация, API-клиенты, guards, интерсепторы, интерфейсы, environments
  shared/             # переиспользуемые компоненты, директивы, пайпы, утилиты
  features/           # модули приложения
    dishes/
    fridge/
    supplies/
    tasks/
    cleaning/
    novelties/
    firstaid/
    couples/
    randomizer/
    settings/
  layout/             # shell, навигация, header, bottom-bar
```

Каждый feature-модуль содержит:

- `data/` — сервисы работы с Supabase
- `models/` — TypeScript-интерфейсы
- `components/` — страницы и переиспользуемые UI-компоненты
- `pipes/` — модули-specific пайпы

## 5. Общие требования к UI/UX

### 5.1. Навигация

- **Десктоп**: боковое меню слева.
- **Планшет/мобиль**: нижняя навигационная панель + верхний заголовок.
- В настройках пользователь может скрыть любые вкладки, кроме **Настроек**.
- Редактирование видимых вкладок происходит в модальном окне: список всех вкладок с чекбоксами. Минимум одна вкладка должна быть включена.

### 5.2. Тема

- Поддержка светлой и тёмной темы.
- Выбор темы — в персональных настройках каждого пользователя.
- Используется CSS-переменная PrimeNG + Tailwind для переключения.

### 5.3. Push-уведомления

- Push-уведомления отправляются:
  - В день дедлайна по задаче уборки.
  - При назначении нового задания (опционально, настраивается).
  - При приближении срока годности продуктов (опционально, настраивается).
- Реализуются через Supabase Edge Functions + Web Push API.

### 5.4. Фото

- Фото можно загрузить с устройства или вставить URL.
- Загруженные фото сохраняются в **Supabase Storage** по умолчанию. В БД хранится только публичный URL.
- Должна быть возможность заменить конфигурацию хранилища (например, на внешний CDN) через `environment.ts`.

## 6. Модули приложения

### 6.1. Блюда

**Экран списка:**

- Поиск по названию.
- Фильтр по сложности (1–5 звёзд, множественный выбор).
- Сортировка:
  - по наличию ингредиентов в холодильнике (сначала те, которые можно приготовить);
  - по времени приготовления;
  - по сложности.
- Кнопка добавления блюда.
- Карточки блюд с фото, названием, временем приготовления и сложностью.

**Экран детали блюда:**

- Название, фото, время приготовления, сложность.
- Список ингредиентов с указанием наличия в холодильнике.
- Пошаговый рецепт.
- Кнопки редактирования и удаления.

**Сущности:**

- `dishes` — уже существует.
- `dish_ingredients` — уже существует.
- `products` — справочник продуктов.

### 6.2. Холодильник

**Экран списка:**

- Карточки продуктов с фото, названием, количеством и сроком годности.
- Визуальная индикация:
  - просрочено — красный;
  - истекает сегодня/завтра — оранжевый;
  - истекает в течение 3 дней — жёлтый;
  - всё в порядке — зелёный/нейтральный.
- Поиск и фильтр по статусу срока годности.
- Кнопка добавления продукта.

**Экран добавления/редактирования:**

- Выбор продукта из справочника `products` или создание нового.
- Количество: число + единица измерения из справочника `units` (можно менять в настройках - глобально для всех пользователей).
- Срок годности (обязательное поле).
- Фото (загрузка или URL).

**Сущности:**

- `fridge` — уже существует, требует добавления `unit_id` и `quantity_value`.
- `products` — уже существует.
- `units` — новый справочник единиц измерения.

### 6.3. Запасы

**Экран списка:**

- Карточки запасов с названием, типом, количеством и индикацией «мало» (количество ≤ min_threshold).
- Фильтр по типу.
- Кнопки добавления, редактирования, удаления.

**Экран детали:**

- Информация о запасе.
- История расхода/пополнения.
- Быстрые кнопки «+1» / «−1».

**Сущности:**

- `supplies` — уже существует.
- `supply_history` — новая таблица истории изменений.

### 6.4. Задания

**Экран списка:**

- Табы: «Активные» / «Выполненные».
- Карточки задания с заголовком, описанием, дедлайном, назначенными людьми.
- Кнопка отметки выполнения.

**Экран добавления/редактирования:**

- Заголовок, описание.
- Дедлайн (необязательный) с возможностью повторения (правила как в уборке).
- Назначение на одного или нескольких пользователей.

**Сущности:**

- `tasks` — уже существует, требует добавления полей повторения.
- `task_assignees` — новая таблица связи многие-ко-многим.

### 6.5. Уборка

**Экран списка:**

- Карточки комнат в заданном порядке.
- У каждой комнаты: название, цвет, круглый индикатор статуса (среднее по задачам).
- Кнопка добавления комнаты.

**Экран комнаты:**

- Список задач уборки для комнаты.
- У каждой задачи:
  - название;
  - частота повторения;
  - таймлайн с тремя метками: за день до дедлайна, дедлайн, день после дедлайна;
  - цвет заполнения таймлайна в зависимости от статуса:
    - выполнено — зелёный;
    - за день до дедлайна — светло-зелёный;
    - в день дедлайна — жёлтый;
    - через день после — оранжевый;
    - больше 1 дня после — красный.
- При нажатии на задачу — детали, редактирование, история выполнения.
- Любой пользователь может отметить задачу выполненной.

**Частота повторения:**

- Ежедневно.
- Каждые N дней.
- Еженедельно в определённый день недели.
- В определённые дни недели (например, пн, ср, пт).
- Каждые N недель.
- Ежемесячно в определённую дату.

**Сущности:**

- `cleaning_rooms` — комнаты.
- `cleaning_tasks` — задачи уборки с правилами повторения.
- `cleaning_history` — история выполнения задач.

### 6.6. Новинки

**Экран списка:**

- Табы: «Хотим попробовать» / «Понравилось» / «Не понравилось».
- Карточки новинки с фото, названием, описанием, общим лайком/дизлайком и рейтингом.

**Экран детали:**

- Название, описание, фото.
- Кнопки лайк/дизлайк (общие для двоих, каждый может поставить лайкили дизлайк).
- Рейтинг в звёздах.
- Комментарии с оценкой.
- Перевод статуса между табами.

**Сущности:**

- `novelties`.
- `novelty_comments`.
- `novelty_likes`.

### 6.7. Аптечка

**Экран списка:**

- Карточки лекарств с названием, фото, метками применения и сроком годности.
- Индикация просроченного срока годности.
- Фильтр по меткам (место боли / симптом).
- Поиск.

**Экран детали:**

- Название, фото, срок годности.
- Метки (например, «голова», «живот», «горло», «уши», «месячные», «насморк»).
- Способы применения.
- Описание / дополнительная информация.

**Сущности:**

- `medicines`.
- `medicine_tags`.
- `medicine_applications`.

### 6.8. Вопросы и задания для пары

**Экран:**

- Блок «Вопрос дня» — случайный вопрос.
- Ниже — список/категории вопросов для выбора.
- Возможность добавлять свои вопросы.
- Источник: ручное добавление или внешнее API (если будет найдено).

**Сущности:**

- `couple_questions`.
- `daily_question_log`.

### 6.9. Рандомайзер

**Экран:**

- Список созданных рандомайзеров.
- Типы:
  - список вариантов — выпадает один;
  - вопрос да/нет — выпадает «Да» или «Нет».
- История не сохраняется, но для каждого списка хранится последний выпавший результат.

**Сущности:**

- `randomizer_lists`.
- `randomizer_items`.

### 6.10. Настройки

**Экран:**

- Выбор темы (светлая / тёмная).
- Настройка видимых вкладок.
- Управление push-уведомлениями.
- Справочник единиц измерения (общий для всех).
- Выход из аккаунта.

**Сущности:**

- `user_settings`.
- `units`.
- `push_subscriptions`.

## 7. Схема базы данных (Supabase)

### 7.1. Существующие таблицы

Таблицы `profiles`, `products`, `dishes`, `dish_ingredients`, `fridge`, `supplies`, `tasks` и связанные триггеры/политики RLS остаются без изменений в части поведения. Ниже — полный набор таблиц с новыми и изменёнными полями.

```sql
-- ==========================================
-- 1. ПРОФИЛИ
-- ==========================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 2. СПРАВОЧНИК ПРОДУКТОВ
-- ==========================================
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 3. ЕДИНИЦЫ ИЗМЕРЕНИЯ
-- ==========================================
create table public.units (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  abbreviation text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 4. БЛЮДА
-- ==========================================
create table public.dishes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image_url text,
  cooking_time integer not null,
  difficulty integer not null check (difficulty between 1 and 5),
  recipe text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles(id) on delete set null
);

-- ==========================================
-- 5. ИНГРЕДИЕНТЫ БЛЮД
-- ==========================================
create table public.dish_ingredients (
  id uuid default gen_random_uuid() primary key,
  dish_id uuid references public.dishes(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  amount text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 6. ХОЛОДИЛЬНИК
-- ==========================================
create table public.fridge (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity numeric not null default 1,
  unit_id uuid references public.units(id) on delete restrict not null,
  expiration_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 7. ЗАПАСЫ
-- ==========================================
create table public.supplies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null,
  quantity integer default 1 check (quantity >= 0),
  min_threshold integer default 1 check (min_threshold >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.supply_history (
  id uuid default gen_random_uuid() primary key,
  supply_id uuid references public.supplies(id) on delete cascade not null,
  change integer not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 8. ЗАДАНИЯ
-- ==========================================
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  is_completed boolean default false,
  repeat_type text,
  repeat_config jsonb default '{}'::jsonb,
  next_due_at timestamp with time zone,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.task_assignees (
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  primary key (task_id, user_id)
);

-- ==========================================
-- 9. УБОРКА
-- ==========================================
create table public.cleaning_rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color text not null default '#8FA18B',
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.cleaning_tasks (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.cleaning_rooms(id) on delete cascade not null,
  title text not null,
  repeat_type text not null,
  repeat_config jsonb default '{}'::jsonb,
  last_completed_at timestamp with time zone,
  next_due_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.cleaning_history (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.cleaning_tasks(id) on delete cascade not null,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 10. НОВИНКИ
-- ==========================================
create table public.novelties (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  status text not null default 'want_to_try' check (status in ('want_to_try', 'liked', 'disliked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.novelty_likes (
  novelty_id uuid references public.novelties(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  is_like boolean not null,
  primary key (novelty_id, user_id)
);

create table public.novelty_comments (
  id uuid default gen_random_uuid() primary key,
  novelty_id uuid references public.novelties(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  rating integer check (rating between 1 and 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 11. АПТЕЧКА
-- ==========================================
create table public.medicines (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  image_url text,
  expiration_date date,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.medicine_tags (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.medicine_to_tags (
  medicine_id uuid references public.medicines(id) on delete cascade not null,
  tag_id uuid references public.medicine_tags(id) on delete cascade not null,
  primary key (medicine_id, tag_id)
);

create table public.medicine_applications (
  id uuid default gen_random_uuid() primary key,
  medicine_id uuid references public.medicines(id) on delete cascade not null,
  instructions text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 12. ВОПРОСЫ ДЛЯ ПАРЫ
-- ==========================================
create table public.couple_questions (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  category text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.daily_question_log (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references public.couple_questions(id) on delete cascade not null,
  shown_at date not null default current_date,
  unique (shown_at)
);

-- ==========================================
-- 13. РАНДОМАЙЗЕР
-- ==========================================
create table public.randomizer_lists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null default 'list' check (type in ('list', 'yes_no')),
  last_result text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.randomizer_items (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.randomizer_lists(id) on delete cascade not null,
  value text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 14. НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ
-- ==========================================
create table public.user_settings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  visible_tabs jsonb default '[]'::jsonb,
  push_enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 15. PUSH-ПОДПИСКИ
-- ==========================================
create table public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subscription jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 16. RLS
-- ==========================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.units enable row level security;
alter table public.dishes enable row level security;
alter table public.dish_ingredients enable row level security;
alter table public.fridge enable row level security;
alter table public.supplies enable row level security;
alter table public.supply_history enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.cleaning_rooms enable row level security;
alter table public.cleaning_tasks enable row level security;
alter table public.cleaning_history enable row level security;
alter table public.novelties enable row level security;
alter table public.novelty_likes enable row level security;
alter table public.novelty_comments enable row level security;
alter table public.medicines enable row level security;
alter table public.medicine_tags enable row level security;
alter table public.medicine_to_tags enable row level security;
alter table public.medicine_applications enable row level security;
alter table public.couple_questions enable row level security;
alter table public.daily_question_log enable row level security;
alter table public.randomizer_lists enable row level security;
alter table public.randomizer_items enable row level security;
alter table public.user_settings enable row level security;
alter table public.push_subscriptions enable row level security;

-- Примеры политик (полный доступ для authenticated)
create policy "Полный доступ" on public.products for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.units for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.dishes for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.dish_ingredients for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.fridge for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.supplies for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.supply_history for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.tasks for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.task_assignees for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.cleaning_rooms for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.cleaning_tasks for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.cleaning_history for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.novelties for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.novelty_likes for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.novelty_comments for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.medicines for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.medicine_tags for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.medicine_to_tags for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.medicine_applications for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.couple_questions for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.daily_question_log for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.randomizer_lists for all to authenticated using (true) with check (true);
create policy "Полный доступ" on public.randomizer_items for all to authenticated using (true) with check (true);

create policy "Свои настройки" on public.user_settings
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Свои push-подписки" on public.push_subscriptions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Профили доступны всем залогиненным" on public.profiles
  for select to authenticated using (true);
create policy "Редактировать свой профиль" on public.profiles
  for update to authenticated using (auth.uid() = id);
```

## 8. Требования к адаптивности

- **Mobile (< 640 px)**: нижний таб-бар, карточки в одну колонку, полноэкранные формы.
- **Tablet (640–1024 px)**: боковое меню или нижний бар в зависимости от ориентации, карточки в 2 колонки.
- **Desktop (> 1024 px)**: боковое меню, карточки в 2–3 колонки, модальные окна для форм.

## 9. Этапы реализации

### Этап 1 — Фундамент

- Настройка проекта Angular + PrimeNG + Tailwind.
- Подключение Supabase Auth и профилей.
- Базовый layout, навигация, настройки темы.
- Справочник единиц измерения.

### Этап 2 — Базовые модули

- Блюда (с поиском, фильтром, сортировкой по наличию ингредиентов).
- Холодильник (с индикацией срока годности).
- Запасы (с историей).
- Задания (с дедлайнами и повторением).

### Этап 3 — Дополнительные модули

- Уборка.
- Новинки.
- Аптечка.
- Вопросы для пары.
- Рандомайзер.

### Этап 4 — PWA и push

- Service worker, манифест, иконки.
- Push-подписки и Edge Functions.

### Этап 5 — Полировка

- Тестирование на разных устройствах.
- Оптимизация производительности.
- Доработка UX по обратной связи.

## 10. Открытые вопросы / будущие идеи

- Интеграция внешнего API для вопросов парам.
- Перенос фото во внешнее хранилище.
- Голосовой ввод задач и продуктов.
- Статистика выполнения заданий и уборки.
