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
    dishes/           # управление рецептами и блюдами
    fridge/           # учёт продуктов в холодильнике со сроками годности
    supplies/         # управление запасами и их историей
    tasks/            # система заданий с дедлайнами и повторением
    cleaning/         # уборка по комнатам с таймлайном выполнения
    novelties/        # новые идеи (фильмы, рестораны и т.д.) с оценками
    firstaid/         # аптечка с лекарствами и сроками годности
    couples/          # вопросы и задания для пары
    randomizer/       # рандомайзер для принятия решений
    settings/         # настройки пользователя (тема, видимость вкладок, push)
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

### 7.1. Описание таблиц

#### profiles — Профили пользователей

Автоматически создаётся при регистрации через Supabase Auth. Триггер `handle_new_user()` заполняет профиль данными из `auth.users`.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Ссылка на `auth.users`, каскадное удаление |
| email | text | Email пользователя |
| full_name | text | Отображаемое имя (берётся из `raw_user_meta_data`) |
| avatar_url | text | URL аватара |
| created_at | timestamptz | Дата создания профиля |

---

#### products — Справочник продуктов

Справочник наименований продуктов. Используется в модулях «Блюда» (ингредиенты) и «Холодильник».

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| name | text | Название продукта (not null) |
| image_url | text | URL изображения продукта |
| created_at | timestamptz | Дата добавления |

---

#### units — Единицы измерения

Общий справочник единиц измерения (граммы, штуки, литры и т.д.). Настраивается в модуле «Настройки».

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| name | text | Полное название (например, «Грамм») |
| abbreviation | text | Краткое обозначение (например, «г») |
| created_at | timestamptz | Дата добавления |

---

#### dishes — Блюда

Рецепты блюд с пошаговым описанием, временем приготовления и сложностью.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| title | text | Название блюда (not null) |
| image_url | text | URL фото блюда |
| cooking_time | integer | Время приготовления в минутах (not null) |
| difficulty | integer | Сложность от 1 до 5 (not null, CHECK) |
| recipe | text | Пошаговый рецепт (not null) |
| created_at | timestamptz | Дата создания |
| created_by | uuid (FK → profiles) | Автор блюда, `ON DELETE SET NULL` |

**Связи:** `created_by` → `profiles(id)`. Ингредиенты хранятся в отдельной таблице `dish_ingredients`.

---

#### dish_ingredients — Ингредиенты блюд

Связывает блюдо с продуктом из справочника и указывает количество.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| dish_id | uuid (FK → dishes) | Блюдо, `ON DELETE CASCADE` (not null) |
| product_id | uuid (FK → products) | Продукт из справочника, `ON DELETE CASCADE` (not null) |
| amount | text | Количество и единица (например, «200 г») (not null) |
| created_at | timestamptz | Дата добавления |

**Связи:** `dish_id` → `dishes(id)`, `product_id` → `products(id)`.

---

#### fridge — Холодильник

Записи о продуктах в холодильнике со сроками годности.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| product_id | uuid (FK → products) | Продукт из справочника, `ON DELETE CASCADE` (not null) |
| quantity | numeric | Количество (по умолчанию 1, not null) |
| unit_id | uuid (FK → units) | Единица измерения, `ON DELETE RESTRICT` (not null) |
| expiration_date | date | Срок годности (not null) |
| created_at | timestamptz | Дата добавления |
| status | — | **Вычисляемое поле на фронтенде** (`FridgeItemStatus`): `expired`, `expiring_today`, `expiring_soon`, `ok`. Определяется по `expiration_date` |

**Связи:** `product_id` → `products(id)`, `unit_id` → `units(id)`.

---

#### supplies — Запасы

Учёт запасов продуктов/товаров с порогом минимального количества.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| name | text | Название запаса (not null) |
| type | text | Категория/тип запаса (not null) |
| quantity | integer | Текущее количество (по умолчанию 1, CHECK ≥ 0) |
| min_threshold | integer | Минимальный порог (по умолчанию 1, CHECK ≥ 0) |
| created_at | timestamptz | Дата создания |
| status | — | **Вычисляемое поле на фронтенде** (`SupplyStatus`): `enough` (quantity > min_threshold), `low` (quantity ≤ min_threshold), `out` (quantity = 0) |

---

#### supply_history — История изменений запасов

Журнал всех операций пополнения/расхода по каждому запасу.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| supply_id | uuid (FK → supplies) | Запас, `ON DELETE CASCADE` (not null) |
| change | integer | Изменение количества (положительное — пополнение, отрицательное — расход) (not null) |
| note | text | Комментарий к операции |
| created_at | timestamptz | Дата операции |

**Связи:** `supply_id` → `supplies(id)`.

---

#### tasks — Задания

Общие задания с дедлайнами, повторением и назначением исполнителей.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| title | text | Заголовок задания (not null) |
| description | text | Описание |
| is_completed | boolean | Выполнено (по умолчанию false) |
| repeat_type | text | Тип повторения |
| repeat_config | jsonb | Конфигурация повторения (см. ниже) |
| next_due_at | timestamptz | Дата следующего выполнения |
| created_by | uuid (FK → profiles) | Автор задания, `ON DELETE CASCADE` |
| created_at | timestamptz | Дата создания |

**Структура `repeat_config` (JSONB):**

```
{
  "type": "daily" | "weekly" | "monthly",
  "daysOfWeek": [1, 3, 5],
  "dayOfMonth": 15
}
```

- `type` — тип повторения: `daily` (ежедневно), `weekly` (еженедельно), `monthly` (ежемесячно).
- `daysOfWeek` — массив дней недели (0=воскресенье…6=суббота), используется при `type: "weekly"`.
- `dayOfMonth` — день месяца (1–31), используется при `type: "monthly"`.

**Связи:** `created_by` → `profiles(id)`. Исполнители — в таблице `task_assignees`.

---

#### task_assignees — Исполнители заданий

Связь «многие-ко-многим» между заданиями и пользователями.

| Поле | Тип | Описание |
|------|-----|----------|
| task_id | uuid (FK → tasks, PK) | Задание, `ON DELETE CASCADE` |
| user_id | uuid (FK → profiles, PK) | Исполнитель, `ON DELETE CASCADE` |

**Связи:** составной первичный ключ `(task_id, user_id)`.

---

#### cleaning_rooms — Комнаты (уборка)

Комнаты/помещения для группировки задач уборки.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| name | text | Название комнаты (not null) |
| color | text | Цвет комнаты в HEX (по умолчанию `#8FA18B`) |
| sort_order | integer | Порядок сортировки (по умолчанию 0) |
| created_at | timestamptz | Дата создания |
| status | — | **Вычисляемое поле на фронтенде** (`CleaningTaskStatus`): агрегат статусов задач комнаты |
| taskCount | — | **Вычисляемое поле на фронтенде** — количество задач в комнате |
| completedTaskCount | — | **Вычисляемое поле на фронтенде** — количество выполненных задач |

---

#### cleaning_tasks — Задачи уборки

Конкретные задачи уборки, привязанные к комнате, с настройкой повторения.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| room_id | uuid (FK → cleaning_rooms) | Комната, `ON DELETE CASCADE` (not null) |
| title | text | Название задачи (not null) |
| repeat_type | text | Тип повторения (not null) |
| repeat_config | jsonb | Конфигурация повторения (см. ниже) |
| last_completed_at | timestamptz | Дата последнего выполнения |
| next_due_at | timestamptz | Дата следующего выполнения |
| created_at | timestamptz | Дата создания |
| status | — | **Вычисляемое поле на фронтенде** (`CleaningTaskStatus`): `completed`, `due-soon`, `due-today`, `overdue`, `overdue-critical` |

**Структура `repeat_config` (JSONB):**

```
{
  "type": "daily" | "everyNDays" | "weekly" | "specificDays" | "everyNWeeks" | "monthly",
  "interval": 3,
  "dayOfWeek": 1,
  "daysOfWeek": [1, 3, 5],
  "dayOfMonth": 15
}
```

- `type` — тип повторения: `daily` (ежедневно), `everyNDays` (каждые N дней), `weekly` (еженедельно), `specificDays` (в определённые дни недели), `everyNWeeks` (каждые N недель), `monthly` (ежемесячно).
- `interval` — интервал для `everyNDays` и `everyNWeeks`.
- `dayOfWeek` — день недели для `weekly` (0=воскресенье…6=суббота).
- `daysOfWeek` — массив дней недели для `specificDays`.
- `dayOfMonth` — день месяца для `monthly` (1–31).

**Связи:** `room_id` → `cleaning_rooms(id)`. История выполнения — в таблице `cleaning_history`.

---

#### cleaning_history — История выполнения уборки

Журнал выполненных задач уборки.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| task_id | uuid (FK → cleaning_tasks) | Задача, `ON DELETE CASCADE` (not null) |
| completed_by | uuid (FK → profiles) | Кто выполнил, `ON DELETE SET NULL` |
| completed_at | timestamptz | Дата и время выполнения |

**Связи:** `task_id` → `cleaning_tasks(id)`, `completed_by` → `profiles(id)`.

---

#### novelties — Новинки

Идеи (фильмы, рестораны, места и т.д.) со статусом: хотим попробовать, понравилось, не понравилось.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| title | text | Название (not null) |
| description | text | Описание |
| image_url | text | URL изображения |
| status | text | Статус (not null, по умолчанию `want_to_try`). Допустимые значения: `want_to_try`, `liked`, `disliked` |
| created_at | timestamptz | Дата создания |
| rating | — | **Вычисляемое поле на фронтенде** — средний рейтинг по комментариям |
| likes | — | **Вычисляемое поле на фронтенде** — количество лайков (подсчитывается по `novelty_likes`) |
| dislikes | — | **Вычисляемое поле на фронтенде** — количество дизлайков (подсчитывается по `novelty_likes`) |

---

#### novelty_likes — Лайки/дизлайки новинок

Каждый пользователь может поставить лайк или дизлайк одной новинке.

| Поле | Тип | Описание |
|------|-----|----------|
| novelty_id | uuid (FK → novelties, PK) | Новинка, `ON DELETE CASCADE` |
| user_id | uuid (FK → profiles, PK) | Пользователь, `ON DELETE CASCADE` |
| is_like | boolean | `true` — лайк, `false` — дизлайк (not null) |

**Связи:** составной первичный ключ `(novelty_id, user_id)`. Один пользователь — одна оценка на новинку.

---

#### novelty_comments — Комментарии к новинкам

Комментарии с рейтингом к новинкам.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| novelty_id | uuid (FK → novelties) | Новинка, `ON DELETE CASCADE` (not null) |
| user_id | uuid (FK → profiles) | Автор комментария, `ON DELETE CASCADE` (not null) |
| text | text | Текст комментария (not null) |
| rating | integer | Оценка от 1 до 5 (CHECK) |
| created_at | timestamptz | Дата создания |

**Связи:** `novelty_id` → `novelties(id)`, `user_id` → `profiles(id)`.

---

#### medicines — Лекарства

Препараты домашней аптечки с фото, сроком годности и описанием.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| name | text | Название лекарства (not null) |
| image_url | text | URL фото |
| expiration_date | date | Срок годности |
| description | text | Описание / дополнительная информация |
| created_at | timestamptz | Дата добавления |
| applicationLabels | — | **Связь через `medicine_to_tags`** — метки применения (голова, горло и т.д.) |
| applicationMethods | — | **Связь через `medicine_applications`** — способы применения |

---

#### medicine_tags — Метки лекарств

Справочник меток/тегов для классификации лекарств (симптомы, части тела).

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| name | text | Название метки (not null), например: `head`, `stomach`, `throat`, `ears`, `menstrual`, `nose`, `teeth`, `skin`, `other` |
| created_at | timestamptz | Дата создания |

**Допустимые значения `ApplicationLabel`:** `head` (Голова), `stomach` (Живот), `throat` (Горло), `ears` (Уши), `menstrual` (Месячные), `nose` (Насморк), `teeth` (Зубы), `skin` (Кожа), `other` (Другое).

---

#### medicine_to_tags — Связь лекарств и меток

Таблица связи «многие-ко-многим» между лекарствами и метками.

| Поле | Тип | Описание |
|------|-----|----------|
| medicine_id | uuid (FK → medicines, PK) | Лекарство, `ON DELETE CASCADE` |
| tag_id | uuid (FK → medicine_tags, PK) | Метка, `ON DELETE CASCADE` |

**Связи:** составной первичный ключ `(medicine_id, tag_id)`.

---

#### medicine_applications — Способы применения лекарств

Инструкции по применению для каждого лекарства.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| medicine_id | uuid (FK → medicines) | Лекарство, `ON DELETE CASCADE` (not null) |
| instructions | text | Инструкция по применению (not null) |
| created_at | timestamptz | Дата добавления |

**Связи:** `medicine_id` → `medicines(id)`.

---

#### couple_questions — Вопросы для пары

Банк вопросов для пары, разделённых по категориям.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| text | text | Текст вопроса (not null) |
| category | text | Категория: `romantic`, `fun`, `deep`, `future`, `memories` |
| is_active | boolean | Активен ли вопрос (по умолчанию true) |
| created_at | timestamptz | Дата создания |

**Категории вопросов:** `romantic` (Романтика), `fun` (Весёлые), `deep` (Глубокие), `future` (Будущее), `memories` (Воспоминания).

---

#### daily_question_log — Лог вопроса дня

Хранит историю показа «вопроса дня» — по одному вопросу на дату.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| question_id | uuid (FK → couple_questions) | Вопрос, `ON DELETE CASCADE` (not null) |
| shown_at | date | Дата показа (not null, по умолчанию текущая дата, UNIQUE) |

**Связи:** `question_id` → `couple_questions(id)`. Ограничение `UNIQUE (shown_at)` — не более одного вопроса на дату.

---

#### randomizer_lists — Списки рандомайзера

Списки для рандомайзера: либо набор вариантов, либо вопрос да/нет.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| name | text | Название списка (not null) |
| type | text | Тип: `list` (список вариантов) или `yes_no` (да/нет) (not null, по умолчанию `list`) |
| last_result | text | Последний выпавший результат |
| created_at | timestamptz | Дата создания |

---

#### randomizer_items — Элементы списков рандомайзера

Варианты внутри списка рандомайзера.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| list_id | uuid (FK → randomizer_lists) | Родительский список, `ON DELETE CASCADE` (not null) |
| value | text | Значение/вариант (not null) |
| created_at | timestamptz | Дата добавления |

**Связи:** `list_id` → `randomizer_lists(id)`.

---

#### user_settings — Настройки пользователя

Персональные настройки каждого пользователя: тема, видимые вкладки, push-уведомления.

| Поле | Тип | Описание |
|------|-----|----------|
| user_id | uuid (PK, FK → profiles) | Пользователь, `ON DELETE CASCADE` |
| theme | text | Тема: `light` или `dark` (по умолчанию `light`, CHECK) |
| visible_tabs | jsonb | Массив видимых вкладок (см. ниже) |
| push_enabled | boolean | Push-уведомления включены (по умолчанию true) |
| created_at | timestamptz | Дата создания настроек |
| updated_at | timestamptz | Дата последнего обновления |

**Структура `visible_tabs` (JSONB):**

Массив строк типа `VisibleTab`:

```json
["dishes", "fridge", "supplies", "tasks", "cleaning", "novelties", "firstaid", "couples", "randomizer"]
```

Допустимые значения: `dishes`, `fridge`, `supplies`, `tasks`, `cleaning`, `novelties`, `firstaid`, `couples`, `randomizer`.

---

#### push_subscriptions — Push-подписки

Web Push-подписки для отправки уведомлений через Edge Functions.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid (PK) | Уникальный идентификатор |
| user_id | uuid (FK → profiles) | Пользователь, `ON DELETE CASCADE` (not null) |
| subscription | jsonb | Данные подписки Web Push (not null, см. ниже) |
| created_at | timestamptz | Дата создания подписки |

**Структура `subscription` (JSONB):**

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BASE64_KEY",
    "auth": "BASE64_AUTH"
  }
}
```

Стандартная структура `PushSubscription` из Web Push API.

**Связи:** `user_id` → `profiles(id)`.

---

### 7.2. SQL-скрипты создания таблиц

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
```

### 7.3. Row Level Security (RLS)

Все таблицы имеют включённый Row Level Security. Политики доступа:

- **Общие таблицы** (`products`, `units`, `dishes`, `dish_ingredients`, `fridge`, `supplies`, `supply_history`, `tasks`, `task_assignees`, `cleaning_rooms`, `cleaning_tasks`, `cleaning_history`, `novelties`, `novelty_likes`, `novelty_comments`, `medicines`, `medicine_tags`, `medicine_to_tags`, `medicine_applications`, `couple_questions`, `daily_question_log`, `randomizer_lists`, `randomizer_items`) — полный доступ для всех аутентифицированных пользователей.
- **user_settings** — доступ только к своим настройкам (`auth.uid() = user_id`).
- **push_subscriptions** — доступ только к своим подпискам (`auth.uid() = user_id`).
- **profiles** — чтение доступно всем аутентифицированным, редактирование — только своего профиля (`auth.uid() = id`).

```sql
-- Включение RLS для всех таблиц
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

-- Политики: полный доступ для authenticated
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

-- Персональные политики
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
