# Home — семейное приложение

## 1. Общее описание

**Home** — PWA-приложение для семьи (два взрослых пользователя) на Angular + PrimeNG + Tailwind + Supabase.
Модули: блюда, холодильник, запасы, задания, уборка, новинки, аптечка, вопросы для пары, рандомайзер, настройки.

Интерфейс — только русский. Стиль Material, палитра:

| Токен | Значение | Использование |
|---|---|---|
| Primary | `#C26D55` | кнопки, акценты |
| Primary dark / light | `#A85A44` / `#D4856F` | hover, второстепенные акценты |
| Secondary | `#8FA18B` | индикаторы, вторичные действия |
| Background | `#F9F6F0` | фон приложения |
| Text | `#2D2D2D` | основной текст |

Токены объявлены в `src/styles.scss` (`@theme`), доступны как Tailwind-утилиты: `bg-primary`, `text-secondary`, `bg-background`.
Hex-коды в шаблонах и SCSS запрещены (кроме preset-файла палитры и колонки `cleaning_rooms.color`).

Макеты в Figma: https://www.figma.com/design/Fl6Wchdabo8Ns6RTQrJk7W/Семейное-приложение

## 2. Технологии

| Слой | Технология |
|---|---|
| Фронтенд | Angular 22 (standalone, signals-first), TypeScript 6 strict |
| UI | PrimeNG 21, тема — preset `FamilyHearthPreset` (`@primeuix/themes`), иконки `primeicons` |
| Стили | Tailwind CSS 4 (`@theme` в `src/styles.scss`, без `tailwind.config.js`) |
| Бэкенд | Supabase: Postgres, Auth, Storage, Edge Functions |
| Состояние | Angular signals; RxJS — только для HTTP/realtime-потоков |
| Тесты | vitest (`npm test`) |
| PWA | `@angular/service-worker`, `ngsw-config.json`, `public/manifest.webmanifest` |

## 3. Пользователи и авторизация

### 3.1. Модель доступа

- Ровно **два фиксированных пользователя**. Ролей нет, права равные.
- Регистрации из UI **нет**: оба аккаунта создаются вручную в Supabase Dashboard (Authentication → Users), `Enable sign-ups` выключен.
- Вход — email + пароль.
- Восстановление пароля — через Supabase Dashboard, отдельного экрана нет.
- Приглашения, команды, «владелец данных» не используются: все пользовательские таблицы общие (см. §8.6).

### 3.2. Экран логина

- Роут `/login` — единственный без `authGuard`.
- Поля: email, пароль. Кнопка неактивна, пока форма невалидна или идёт отправка; ошибка входа — тост с русским текстом (без деталей Supabase).
- После успешного входа — редирект на `returnUrl` из query-параметра, если он есть; иначе — на первый **видимый** пользователю таб из `user_settings.visible_tabs`.
- Хардкод `router.navigate(['/supplies'])` после логина запрещён.

### 3.3. Сессия и guard

- `AuthService` держит `session`, `currentUser`, `isAuthenticated`, `loading` как сигналы, восстанавливает сессию через `getSession()` и слушает `onAuthStateChange`.
- `authGuard` проверяет наличие сессии; при её отсутствии — редирект на `/login` с `returnUrl`.
- Профиль (`profiles.full_name`, `profiles.avatar_url`) показывается в sidebar/header.
- Автообновление токена делает `supabase-js`; ручной refresh не пишем.

## 4. Архитектура фронтенда

```
src/app/
  app.ts | app.html | app.config.ts | app.routes.ts
  assets/family-hearth-preset.ts      # палитра PrimeNG (единственное место с hex)
  core/
    auth/                             # AuthService
    environments/                     # environment.ts + environment.template.ts
    guards/                           # authGuard
    interceptors/                     # пока пусто
    services/                         # SupabaseService, ThemeService
  shared/
    components/                       # image-uploader, confirm-dialog, empty-state, skeleton-list
    directives/  pipes/  utils/       # utils: repeat, status, date
  layout/
    sidebar/ bottom-nav/ header/
  features/
    login/ dishes/ fridge/ supplies/ tasks/ cleaning/
    novelties/ firstaid/ couples/ randomizer/ settings/
  styles.scss                         # @theme-токены Tailwind v4
```

Структура feature-модуля (обязательна для нового кода):

```
features/<module>/
  data/<entity>.service.ts   data/<entity>.mapper.ts
  models/<entity>.model.ts
  components/<part>/         # части экрана
  <module>.component.ts + .html
  <module>.routes.ts
  index.ts                   # public API модуля
```

Правила структуры — в `AGENTS.md` §3 и §10.

## 5. Правила вычислений

Раздел обязателен к точному исполнению: любая «своя» трактовка — баг. Все формулы живут в `shared/utils`
(`repeat.util.ts`, `status.util.ts`, `date.util.ts`) и покрыты unit-тестами; дублировать расчёт в модулях запрещено.

### 5.1. Дата и часовой пояс

- В БД: `timestamptz` (UTC) для моментов времени, `date` (`YYYY-MM-DD`) для календарных дат. В TS-моделях — строки ISO.
- Все сравнения «сегодня / завтра / через N дней» считаются **в локальном часовом поясе устройства** по календарным суткам, а не по разнице миллисекунд.
- «Сегодня» = локальная дата; `date`-значения сравниваются как строки `YYYY-MM-DD` без конвертации в UTC (иначе срок годности «съезжает» на день).
- Разница в днях: `dayDiff(a, b)` = целое число календарных суток (округление к ближайшему полуночному смещению, не `Math.floor` от миллисекунд).
- При старте приложения и при возврате вкладки из фона активные экраны пересчитывают статусы (`visibilitychange` + сигнал текущей даты).

### 5.2. Статусы холодильника (`FridgeItemStatus`)

Исходные данные: `expiration_date` (`date`), `today` (локальная дата). Пусть `d = dayDiff(expiration_date, today)`.
`d > 0` — срок ещё не истёк, `d < 0` — просрочено.

| Условие | Статус | Цвет | Текст-дубль (для a11y) |
|---|---|---|---|
| `d < 0` | `expired` | красный (`text-red-*`) | «Просрочено» |
| `d = 0` или `d = 1` | `expiring_today` | оранжевый | «Истекает сегодня» / «Истекает завтра» |
| `d = 2` или `d = 3` | `expiring_soon` | жёлтый | «Истекает через N дн.» |
| `d ≥ 4` | `ok` | нейтральный/зелёный | «Срок в порядке» |

Фильтр по статусу — множественный выбор по этим четырём значениям; сортировка по умолчанию — по `expiration_date` возрастанию.

### 5.3. Статусы запасов (`SupplyStatus`)

| Условие | Статус |
|---|---|
| `quantity = 0` | `out` («Закончилось») |
| `0 < quantity ≤ min_threshold` | `low` («Мало») |
| `quantity > min_threshold` | `enough` («Достаточно») |

Проверка `out` выполняется **первой** (при `min_threshold = 0` и `quantity = 0` статус всё равно `out`).
Индикация «мало» дублируется текстом, не только цветом.

### 5.4. Единый алгоритм повторения (для `cleaning_tasks` и `tasks`)

Тип повтора — `RepeatConfig` (JSONB, см. §8.2). Функция `nextOccurrence(prev: Date, config: RepeatConfig): Date`
возвращает **строго следующее** вхождение после `prev`:

| `type` | Правило |
|---|---|
| `daily` | `prev + 1 день` |
| `everyNDays` | `prev + N дней` (`interval ≥ 1`) |
| `weekly` | следующий день с `dayOfWeek` (0=вс … 6=сб), строго после `prev` |
| `specificDays` | ближайший день из `daysOfWeek`, строго после `prev` |
| `everyNWeeks` | `prev + N×7 дней`, день недели сохраняется |
| `monthly` | следующий месяц, число = `dayOfMonth`; если в месяце меньше дней — последний день месяца (31 → 28/29/30) |

Правила:
- Время суток (`часы:минуты`) у `next_due_at` **сохраняется** от предыдущего значения; при создании задачи — берётся текущее время пользователя.
- Отсчёт идёт от **предыдущего `next_due_at`**, а не от `now`. Если полученное значение ≤ `now` (задачу выполняли с опозданием), повторяем расчёт, пока не получим значение в будущем (защита от «догоняющих» серий для `daily`).
- Часовой пояс — локальный пояс пользователя (§5.1).
- Дедлайн «на сегодня» = `dayDiff(next_due_at, today) = 0`.

### 5.5. Статусы задач уборки (`CleaningTaskStatus`)

Пусть `start = начало текущего цикла` = `next_due_at − длина текущего интервала` (для `daily` — 1 день, `everyNDays` — N дней, `weekly` — 7 дней, `monthly` — предыдущий месяц по правилу §5.4; для задач без повтора — `−∞`).
`delta = dayDiff(next_due_at, today)`.

Проверки по порядку:

1. **`completed`** — `last_completed_at` не `null` и `last_completed_at ≥ start` (задача выполнена в текущем цикле). Цвет — зелёный.
2. **`overdue-critical`** — `delta ≤ −2`. Цвет — красный.
3. **`overdue`** — `delta = −1`. Цвет — оранжевый.
4. **`due-today`** — `delta = 0`. Цвет — жёлтый.
5. **`due-soon`** — `delta ≥ 1`. Цвет — светло-зелёный.

Таймлайн карточки — три метки (`−1 день`, `дедлайн`, `+1 день`) и заливка по статусу из таблицы выше;
метка «за день до дедлайна» соответствует `delta = 1`, «день после» — `delta = −1`.

Подпись в карточке: для `completed` — «Выполнено {дата}», иначе — «До {дата}» / «Просрочено на N дн.».

### 5.6. Агрегаты комнаты уборки

- `taskCount` — число задач комнаты.
- `completedTaskCount` — число задач со статусом `completed`.
- `status` комнаты — **самый «плохой»** статус среди её задач по приоритету:
  `overdue-critical` > `overdue` > `due-today` > `due-soon` > `completed`.
- Комната без задач — `completed` и счётчики `0/0`; круглый индикатор показывает серый цвет и текст «Нет задач».
- Порядок комнат — по `sort_order` возрастанию, затем по `name`.

### 5.7. Задания (`tasks`)

- **Разовое задание** (`repeat_type is null`): дедлайн — `deadline_at` (необязателен). Выполнение ставит `is_completed = true`, `last_completed_at = now()`; задание уходит в таб «Выполненные». Отмена выполнения возвращает его в «Активные».
- **Повторяющееся задание** (`repeat_type is not null`): `is_completed` **не используется** (всегда `false`), `deadline_at` игнорируется. Выполнение пишет `last_completed_at = now()` и пересчитывает `next_due_at` по §5.4. Задание всегда остаётся в табе «Активные».
- Статус отображения повторяющегося задания считается по §5.5 (та же формула, что для уборки), но цвета — нейтральные; просроченные поднимаются вверх.
- Сортировка «Активные»: сначала просроченные (`delta < 0`), затем по `next_due_at`/`deadline_at` возрастанию, затем без дедлайна — по `created_at`.
- Назначение исполнителей — `task_assignees` (многие-ко-многим, как минимум один исполнитель обязателен при сохранении).

### 5.8. Новинки

- `likes` / `dislikes` — количество строк `novelty_likes` с `is_like = true` / `false`.
- Каждый пользователь имеет **одну** оценку на новинку (PK `(novelty_id, user_id)`): повторный клик по тому же значению удаляет оценку, клик по противоположному — меняет её (upsert).
- `rating` — среднее арифметическое `novelty_comments.rating` (только строки с непустым `rating`), округление до 1 знака. Если оценок нет — `null`, в UI «Нет оценок», звёзды не показываем.
- Пользователь может оставить несколько комментариев; среднее считается по всем.
- Статус (`want_to_try` / `liked` / `disliked`) меняется **только вручную** любым пользователем; автоматических переходов по лайкам нет.
- Табы списка = статус; сортировка внутри таба — по `created_at` убыванию.

### 5.9. Вопрос дня

- Один вопрос на календарную дату (локальную), общий для обоих пользователей: `daily_question_log` с `UNIQUE (shown_at)`.
- Выбор вопроса — только через RPC `get_daily_question(p_local_date date)` (§8.5): атомарный выбор случайного активного вопроса, который не показывался последние 30 дней; если таких нет — из всех активных; если банк пуст — возвращает `null` и UI показывает пустое состояние «Добавьте вопросы».
- Повторное открытие экрана в тот же день возвращает тот же вопрос (из лога), а не новый.

### 5.10. Рандомайзер

- `type = 'yes_no'`: результат — `'Да'` или `'Нет'`, элементы не нужны.
- `type = 'list'`: равновероятный выбор среди `randomizer_items`; пустой список — кнопка заблокирована.
- Случайность — на клиенте (`crypto.getRandomValues`), без серверной рулетки.
- Результат записывается в `randomizer_lists.last_result` (общий для обоих, чтобы партнёр видел итог); история не хранится.
- `last_result` сохраняется только после завершения анимации выбора.

## 6. Общие требования к UI/UX

### 6.1. Навигация

- **Десктоп (`md`+):** боковое меню (`layout/sidebar`), контент с отступом `ml-64`.
- **Мобильный/планшет:** нижний таб-бар (`layout/bottom-nav`), контент с `pb-20`.
- В настройках пользователь скрывает любые вкладки, кроме **Настроек** (Настройки видны всегда).
- Редактирование видимых вкладок — модальное окно со списком чекбоксов; минимум одна вкладка должна быть включена (кроме Настроек, если пользователь скрыл все остальные).
- Пункт навигации показывается, только если таб есть в `visible_tabs` пользователя.

### 6.2. Тема

- Светлая / тёмная / системная (`ThemeMode = 'light' | 'dark' | 'system'`).
- Источник правды — `user_settings.theme`; `localStorage` — только кэш для мгновенной отрисовки при старте (до ответа БД).
- Применение — класс `app-dark` на `<html>` (`darkModeSelector` в PrimeNG-конфиге). Только через `ThemeService`.
- `system` — следование `prefers-color-scheme`, при смене системной темы приложение переключается на лету.

### 6.3. Фото

- Загрузка с устройства или ввод URL; компонент — `shared/components/image-uploader`.
- По умолчанию файл кладётся в Supabase Storage, bucket `photos`, путь `<entity>/<uuid>.<ext>`; в БД храним публичный URL строкой.
- Ограничения: только `image/*`, ≤ 5 МБ, сжатие по длинной стороне до 1600 px через canvas.
- Конфигурация бакета/базового URL — в `environment.ts` (поле `storage`), чтобы можно было переехать на внешний CDN без правок компонентов.

### 6.4. Объём данных и фильтрация

- Пользователей два, данных мало: списки грузим **целиком** и фильтруем/сортируем на клиенте.
- Серверная пагинация — только для истории (`supply_history`, `cleaning_history`): `order by created_at desc limit 100`.
- Полнотекстовый поиск и серверные фильтры не строим.

### 6.5. Push-уведомления (кратко)

Типы: дедлайн уборки/задания, новое назначение задания, приближение срока годности продуктов. Управление — в настройках
(общий тумблер + отдельные тумблеры по типам). Механика, контракт и расписание — в §10.

## 7. Модули приложения

### 7.1. Блюда

**Список:** поиск по названию, фильтр по сложности (1–5, множественный), сортировка: «можно приготовить» → по времени → по сложности; кнопка добавления; карточки (фото, название, время, сложность).

**Деталь:** название, фото, время, сложность, ингредиенты с отметкой наличия в холодильнике, пошаговый рецепт, кнопки «Редактировать»/«Удалить» (через `ConfirmDialog`).

**Правило наличия ингредиентов (важно):** сравнение идёт по `dish_ingredients.product_id` ↔ `fridge.product_id` —
ингредиент считается «в наличии», если в холодильнике есть хотя бы одна непросроченная запись этого продукта (количество **не** сравниваем:
единицы измерения могут не совпадать). Дополнительно показываем «заканчивается», если остаток по этому продукту даёт статус `expiring_soon`/`expired`.
Сортировка «можно приготовить» — сначала блюда, у которых все ингредиенты в наличии, затем по доле имеющихся (убывание).

**Сущности:** `dishes`, `dish_ingredients`, `products`.

### 7.2. Холодильник

**Список:** карточки (фото, название, количество с единицей, срок годности), цветовая индикация по §5.2, поиск и множественный фильтр по статусу, кнопка добавления. Сортировка по умолчанию — по сроку годности.

**Форма:** выбор продукта из справочника `products` с возможностью создать новый на лету (`name` уникален, поиск регистронезависимый), количество (`p-inputnumber`, дробное) + единица из `units`, обязательный срок годности (`p-datepicker`), фото.

**Удаление продукта из справочника** каскадно удаляет записи холодильника — предупреждать в `ConfirmDialog`.
**Удаление единицы измерения** запрещено, если она используется (`ON DELETE RESTRICT`) — обрабатывать ошибку БД и показывать «Единица используется в холодильнике».

**Сущности:** `fridge`, `products`, `units`.

### 7.3. Запасы

**Список:** карточки (название, тип, количество, индикатор «мало» по §5.3), фильтр по типу, добавление/редактирование/удаление.

**Деталь:** данные запаса, история операций (`supply_history`, последние 100), быстрые кнопки «+1» / «−1».
Любая операция — через RPC `adjust_supply` (§8.5), чтобы количество и запись истории менялись атомарно; уход в минус запрещён (БД-констрейнт `quantity >= 0` + понятная ошибка).

**Сущности:** `supplies`, `supply_history`.

### 7.4. Задания

**Список:** табы «Активные» / «Выполненные», карточки (заголовок, описание, дедлайн/`next_due_at`, исполнители, кнопка «Выполнено»), правило поведения — §5.7.

**Форма:** заголовок, описание, дедлайн (необязательный, только для разового задания), повторение по единому `RepeatConfig` (§5.4 — те же шесть типов, что в уборке), назначение одного или нескольких исполнителей.

**Сущности:** `tasks`, `task_assignees`.

### 7.5. Уборка

**Список комнат:** карточки в порядке `sort_order` (название, цвет, круглый индикатор статуса), кнопка добавления комнаты.

**Экран комнаты:** список задач уборки; у каждой — название, частота, таймлайн из трёх меток с заливкой по статусу (§5.5). Тап по задаче — деталь: редактирование, история выполнения (последние 100), удаление.

**Частота повторения:** ежедневно, каждые N дней, еженедельно в определённый день недели, в определённые дни недели, каждые N недель, ежемесячно в определённую дату (см. §5.4).

**Отметка выполнения** — любой из двух пользователей, через RPC `complete_cleaning_task` (§8.5): запись в историю + пересчёт `last_completed_at`/`next_due_at` одной транзакцией. Кнопка блокируется до ответа, двойной тап не создаёт две записи истории.

**Сущности:** `cleaning_rooms`, `cleaning_tasks`, `cleaning_history`.

### 7.6. Новинки

**Список:** табы по статусу (`want_to_try` / `liked` / `disliked`), карточки (фото, название, описание, лайки/дизлайки, рейтинг).

**Деталь:** фото, описание, кнопки лайк/дизлайк (по §5.8), рейтинг звёздами, комментарии с оценкой 1–5, смена статуса (перевод между табами) — вручную.

**Сущности:** `novelties`, `novelty_likes`, `novelty_comments`.
Агрегаты `likes`/`dislikes`/`rating` — считать одним запросом (view `novelty_stats` или вложенный `select`), без N+1.

### 7.7. Аптечка

**Список:** карточки (название, фото, метки применения, срок годности), индикация просроченного (по §5.2), фильтр по меткам (множественный), поиск по названию.

**Деталь:** название, фото, срок годности, метки, способы применения (список инструкций), описание.

**Метки:** справочник `medicine_tags` хранит `slug` (уникальный, латиница: `head`, `stomach`, `throat`, `ears`, `menstrual`, `nose`, `teeth`, `skin`, `other`) и русскую подпись `name` («Голова», «Живот», …). В UI показываем `name`, в коде сравниваем по `slug`. Список меток расширяемый (добавление из формы лекарства).

**Сущности:** `medicines`, `medicine_tags`, `medicine_to_tags`, `medicine_applications`.

### 7.8. Вопросы для пары

**Экран:** блок «Вопрос дня» (§5.9), ниже — выбор категории и список вопросов, добавление своих вопросов, деактивация (`is_active = false`) вместо удаления.

**Категории:** `romantic`, `fun`, `deep`, `future`, `memories` (хранится slug, подписи — русские, в коде/README).
Источник — ручное добавление и seed-набор (§8.4); внешнее API — не реализуем (см. §13).

**Сущности:** `couple_questions`, `daily_question_log`.

### 7.9. Рандомайзер

**Экран:** список созданных рандомайзеров, кнопка создания; типы — «список вариантов» и «да/нет»; правила — §5.10.
Экран детали: редактирование вариантов, кнопка запуска, отображение `last_result`.

**Сущности:** `randomizer_lists`, `randomizer_items`.

### 7.10. Настройки

**Экран:** тема (§6.2), видимые вкладки (§6.1), push-уведомления (общий тумблер + типы, §10.1), справочник единиц измерения (общий для обоих, только для доверенных значений), выход из аккаунта.

Удаление единицы измерения, которая используется в `fridge.unit_id`, запрещено (`ON DELETE RESTRICT`) — показываем ошибку, а не «тихое» удаление.

**Сущности:** `user_settings`, `units`, `push_subscriptions`.

## 8. Схема базы данных (Supabase)

### 8.1. Правила схемы

- Snapshot-истина — этот раздел. Любое изменение схемы оформляется миграцией в `supabase/migrations/` и правкой этого раздела **в том же коммите** (`AGENTS.md` §4.6).
- Имена таблиц и колонок — `snake_case`, множественное число для таблиц-сущностей. PK — `uuid default gen_random_uuid()`.
- У всех изменяемых пользователем сущностей есть `created_at`; у редактируемых — также `updated_at` (обновляется триггером `set_updated_at()`).
- Вычисляемые значения (`status`, `taskCount`, `rating`, `likes`, `dislikes`) **в БД не хранятся** — считаются на клиенте по §5.
- Внешние ключи: дочерние записи контента — `ON DELETE CASCADE`; ссылки на справочники, без которых запись бессмысленна (`fridge.unit_id`), — `ON DELETE RESTRICT`; `created_by`/`completed_by` — `ON DELETE SET NULL`.
- JSONB-поля типизированы (`RepeatConfig`, `VisibleTab[]`, `PushSubscription`).

### 8.2. Таблицы

#### profiles — профили пользователей

Создаётся автоматически триггером `handle_new_user()` при появлении записи в `auth.users`.

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | = `auth.users.id`, `ON DELETE CASCADE` |
| email | text | Email |
| full_name | text | Отображаемое имя (из `raw_user_meta_data`, fallback — email) |
| avatar_url | text | URL аватара |
| created_at | timestamptz | Дата создания |

#### products — справочник продуктов

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| name | text, UNIQUE | Название (not null) |
| image_url | text | URL изображения |
| created_at / updated_at | timestamptz | Метки времени |

Используется в `dish_ingredients` и `fridge`. Создание «на лету» из формы — через upsert по `name`.

#### units — единицы измерения

Общий справочник (граммы, штуки, литры…), редактируется в настройках.

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| name | text, UNIQUE | Полное название («Грамм») |
| abbreviation | text | Краткое обозначение («г») |
| created_at | timestamptz | Дата добавления |

#### dishes — блюда

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| title | text | Название (not null) |
| image_url | text | URL фото |
| cooking_time | integer | Время в минутах (not null) |
| difficulty | integer | 1–5 (not null, CHECK) |
| recipe | text | Пошаговый рецепт (not null) |
| created_by | uuid (FK → profiles) | Автор, `ON DELETE SET NULL` |
| created_at / updated_at | timestamptz | Метки времени |

#### dish_ingredients — ингредиенты блюд

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| dish_id | uuid (FK → dishes) | Блюдо, `ON DELETE CASCADE` (not null) |
| product_id | uuid (FK → products) | Продукт, `ON DELETE CASCADE` (not null) |
| quantity_value | numeric | Количество (nullable) |
| unit_id | uuid (FK → units) | Единица измерения (nullable), `ON DELETE RESTRICT` |
| note | text | Текстовая заметка: «по вкусу», «для подачи» |
| created_at | timestamptz | Дата добавления |

Правило: если `quantity_value` и `unit_id` заданы — количество структурированное (используется в UI и будущих расчётах); `note` — только текст.
Свободнотекстовое поле `amount` из первой версии схемы **удаляется** миграцией 001 (значение переносится в `note`).

#### fridge — холодильник

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| product_id | uuid (FK → products) | Продукт, `ON DELETE CASCADE` (not null) |
| quantity | numeric | Количество (not null, default 1, CHECK `> 0`) |
| unit_id | uuid (FK → units) | Единица измерения, `ON DELETE RESTRICT` (not null) |
| expiration_date | date | Срок годности (not null) |
| created_at / updated_at | timestamptz | Метки времени |
| status | — | Вычисляется по §5.2, в БД отсутствует |

Поле называется **`quantity`** (не `quantity_value`).

#### supplies — запасы

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| name | text | Название (not null) |
| type | text | Категория (not null) |
| quantity | integer | Текущее количество (default 1, CHECK `>= 0`) |
| min_threshold | integer | Порог «мало» (default 1, CHECK `>= 0`) |
| created_at / updated_at | timestamptz | Метки времени |
| status | — | Вычисляется по §5.3 |

#### supply_history — история запасов

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| supply_id | uuid (FK → supplies) | Запас, `ON DELETE CASCADE` (not null) |
| change | integer | Изменение (`+` пополнение, `−` расход), not null |
| note | text | Комментарий |
| created_at | timestamptz | Дата операции |

Записи создаются только RPC `adjust_supply` (§8.5).

#### tasks — задания

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| title | text | Заголовок (not null) |
| description | text | Описание |
| deadline_at | timestamptz | Дедлайн разового задания (nullable) |
| is_completed | boolean | Выполнено — только для разовых (default false) |
| repeat_type | text | Тип повтора (`daily`/`everyNDays`/`weekly`/`specificDays`/`everyNWeeks`/`monthly`), `null` — разовое |
| repeat_config | jsonb | `RepeatConfig` (§ниже) |
| next_due_at | timestamptz | Дата следующего выполнения (для повторяющихся) |
| last_completed_at | timestamptz | Дата последнего выполнения |
| created_by | uuid (FK → profiles) | Автор, `ON DELETE SET NULL` |
| created_at / updated_at | timestamptz | Метки времени |

`repeat_type` — денормализация `repeat_config.type` для индексов и фильтров; заполняется **из** `repeat_config` при записи,
истина — `repeat_config.type`. Поведение повторяющихся заданий — §5.7.

#### task_assignees — исполнители задания

| Поле | Тип | Описание |
|---|---|---|
| task_id | uuid (FK → tasks, PK) | Задание, `ON DELETE CASCADE` |
| user_id | uuid (FK → profiles, PK) | Исполнитель, `ON DELETE CASCADE` |

Составной PK `(task_id, user_id)`.

#### cleaning_rooms — комнаты

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| name | text | Название (not null) |
| color | text | HEX-цвет комнаты (default `#8FA18B`) |
| sort_order | integer | Порядок (default 0) |
| created_at / updated_at | timestamptz | Метки времени |
| status / taskCount / completedTaskCount | — | Вычисляются по §5.6 |

#### cleaning_tasks — задачи уборки

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| room_id | uuid (FK → cleaning_rooms) | Комната, `ON DELETE CASCADE` (not null) |
| title | text | Название (not null) |
| repeat_type | text | Тип повтора (not null) |
| repeat_config | jsonb | `RepeatConfig` |
| last_completed_at | timestamptz | Дата последнего выполнения |
| next_due_at | timestamptz | Дата следующего выполнения |
| created_at / updated_at | timestamptz | Метки времени |
| status | — | Вычисляется по §5.5 |

#### cleaning_history — история уборки

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| task_id | uuid (FK → cleaning_tasks) | Задача, `ON DELETE CASCADE` (not null) |
| completed_by | uuid (FK → profiles) | Кто выполнил, `ON DELETE SET NULL` |
| completed_at | timestamptz | Дата и время выполнения |

#### RepeatConfig (JSONB, общий для `tasks` и `cleaning_tasks`)

```json
{
  "type": "daily | everyNDays | weekly | specificDays | everyNWeeks | monthly",
  "interval": 3,
  "dayOfWeek": 1,
  "daysOfWeek": [1, 3, 5],
  "dayOfMonth": 15
}
```

- `type` — обязателен.
- `interval` — только для `everyNDays` / `everyNWeeks`, `≥ 1`.
- `dayOfWeek` — только для `weekly`, `0 = воскресенье … 6 = суббота`.
- `daysOfWeek` — только для `specificDays`, непустой массив, без повторов.
- `dayOfMonth` — только для `monthly`, `1–31`.

Алгоритм расчёта — §5.4. Лишние поля для выбранного типа не сохраняем.

#### novelties — новинки

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| title | text | Название (not null) |
| description | text | Описание |
| image_url | text | URL изображения |
| status | text | `want_to_try` / `liked` / `disliked` (not null, default `want_to_try`, CHECK) |
| created_at / updated_at | timestamptz | Метки времени |
| rating / likes / dislikes | — | Вычисляются по §5.8 |

#### novelty_likes — оценки новинок

| Поле | Тип | Описание |
|---|---|---|
| novelty_id | uuid (FK → novelties, PK) | Новинка, `ON DELETE CASCADE` |
| user_id | uuid (FK → profiles, PK) | Пользователь, `ON DELETE CASCADE` |
| is_like | boolean | `true` — лайк, `false` — дизлайк (not null) |

Одна оценка на пользователя (PK `(novelty_id, user_id)`).

#### novelty_comments — комментарии к новинкам

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| novelty_id | uuid (FK → novelties) | Новинка, `ON DELETE CASCADE` (not null) |
| user_id | uuid (FK → profiles) | Автор, `ON DELETE CASCADE` (not null) |
| text | text | Текст (not null) |
| rating | integer | Оценка 1–5 (nullable, CHECK) |
| created_at | timestamptz | Дата создания |

#### medicines — лекарства

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| name | text | Название (not null) |
| image_url | text | URL фото |
| expiration_date | date | Срок годности (nullable — «бессрочно») |
| description | text | Описание |
| created_at / updated_at | timestamptz | Метки времени |

#### medicine_tags — метки применения

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| slug | text, UNIQUE | Латинский код: `head`, `stomach`, `throat`, `ears`, `menstrual`, `nose`, `teeth`, `skin`, `other` |
| name | text | Русская подпись: «Голова», «Живот», «Горло», «Уши», «Месячные», «Насморк», «Зубы», «Кожа», «Другое» |
| created_at | timestamptz | Дата создания |

#### medicine_to_tags — связь лекарств и меток

| Поле | Тип | Описание |
|---|---|---|
| medicine_id | uuid (FK → medicines, PK) | Лекарство, `ON DELETE CASCADE` |
| tag_id | uuid (FK → medicine_tags, PK) | Метка, `ON DELETE CASCADE` |

PK `(medicine_id, tag_id)`.

#### medicine_applications — способы применения

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| medicine_id | uuid (FK → medicines) | Лекарство, `ON DELETE CASCADE` (not null) |
| instructions | text | Инструкция (not null) |
| sort_order | integer | Порядок вывода (default 0) |
| created_at | timestamptz | Дата добавления |

#### couple_questions — вопросы для пары

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| text | text | Текст вопроса (not null) |
| category | text | `romantic` / `fun` / `deep` / `future` / `memories` (CHECK) |
| is_active | boolean | Показывать в ротации (default true) |
| created_at | timestamptz | Дата создания |

#### daily_question_log — лог вопроса дня

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| question_id | uuid (FK → couple_questions) | Вопрос, `ON DELETE CASCADE` (not null) |
| shown_at | date, UNIQUE | Дата показа (not null, default `current_date`) |

Не более одного вопроса на дату; правило выбора — §5.9.

#### randomizer_lists — списки рандомайзера

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| name | text | Название (not null) |
| type | text | `list` / `yes_no` (not null, default `list`, CHECK) |
| last_result | text | Последний выпавший результат (общий для обоих) |
| created_at / updated_at | timestamptz | Метки времени |

#### randomizer_items — варианты списка

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| list_id | uuid (FK → randomizer_lists) | Список, `ON DELETE CASCADE` (not null) |
| value | text | Вариант (not null) |
| created_at | timestamptz | Дата добавления |

#### user_settings — настройки пользователя

| Поле | Тип | Описание |
|---|---|---|
| user_id | uuid (PK, FK → profiles) | Пользователь, `ON DELETE CASCADE` |
| theme | text | `light` / `dark` / `system` (not null, default `system`, CHECK) |
| visible_tabs | jsonb | Массив `VisibleTab` (not null, default — все табы) |
| push_enabled | boolean | Общий тумблер push (default false) |
| push_task_deadline | boolean | Дедлайны заданий и уборки (default true) |
| push_task_assigned | boolean | Новое назначение задания (default true) |
| push_fridge_expiry | boolean | Приближение срока годности (default true) |
| created_at / updated_at | timestamptz | Метки времени |

Строка создаётся триггером `create_user_settings()` сразу после создания профиля — тогда `visible_tabs` всегда заполнен
и приложение не показывает пустое меню.

`VisibleTab` = `dishes | fridge | supplies | tasks | cleaning | novelties | firstaid | couples | randomizer`
(«Настройки» и «Вход» в списке отсутствуют — они не скрываются).

#### push_subscriptions — push-подписки

| Поле | Тип | Описание |
|---|---|---|
| id | uuid (PK) | Идентификатор |
| user_id | uuid (FK → profiles) | Пользователь, `ON DELETE CASCADE` (not null) |
| endpoint | text, UNIQUE | Endpoint подписки (not null) |
| subscription | jsonb | Объект `PushSubscription` (endpoint + keys), not null |
| user_agent | text | Браузер/устройство (для отладки) |
| last_seen_at | timestamptz | Последнее успешное использование |
| created_at | timestamptz | Дата создания |

`endpoint` уникален: повторная подписка с того же устройства — upsert по `endpoint`, а не новая строка.

### 8.3. Сводный DDL (целевая схема)

Для новой базы. Существующая база доводится миграцией 001 (§8.7).

```sql
-- ============ утилиты ============
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============ профили ============
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger as $$
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

create or replace function public.create_user_settings() returns trigger as $$
begin
  insert into public.user_settings (user_id, visible_tabs)
  values (
    new.id,
    '["dishes","fridge","supplies","tasks","cleaning","novelties","firstaid","couples","randomizer"]'::jsonb
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.create_user_settings();

-- ============ справочники ============
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  abbreviation text not null,
  created_at timestamptz not null default now()
);

-- ============ блюда ============
create table if not exists public.dishes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image_url text,
  cooking_time integer not null,
  difficulty integer not null check (difficulty between 1 and 5),
  recipe text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dish_ingredients (
  id uuid default gen_random_uuid() primary key,
  dish_id uuid references public.dishes(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity_value numeric,
  unit_id uuid references public.units(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);

-- ============ холодильник ============
create table if not exists public.fridge (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity numeric not null default 1 check (quantity > 0),
  unit_id uuid references public.units(id) on delete restrict not null,
  expiration_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ запасы ============
create table if not exists public.supplies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null,
  quantity integer not null default 1 check (quantity >= 0),
  min_threshold integer not null default 1 check (min_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supply_history (
  id uuid default gen_random_uuid() primary key,
  supply_id uuid references public.supplies(id) on delete cascade not null,
  change integer not null,
  note text,
  created_at timestamptz not null default now()
);

-- ============ задания ============
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  deadline_at timestamptz,
  is_completed boolean not null default false,
  repeat_type text,
  repeat_config jsonb default '{}'::jsonb,
  next_due_at timestamptz,
  last_completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_assignees (
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  primary key (task_id, user_id)
);

-- ============ уборка ============
create table if not exists public.cleaning_rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color text not null default '#8FA18B',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cleaning_tasks (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.cleaning_rooms(id) on delete cascade not null,
  title text not null,
  repeat_type text not null,
  repeat_config jsonb default '{}'::jsonb,
  last_completed_at timestamptz,
  next_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cleaning_history (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.cleaning_tasks(id) on delete cascade not null,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz not null default now()
);

-- ============ новинки ============
create table if not exists public.novelties (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  status text not null default 'want_to_try' check (status in ('want_to_try', 'liked', 'disliked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.novelty_likes (
  novelty_id uuid references public.novelties(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  is_like boolean not null,
  primary key (novelty_id, user_id)
);

create table if not exists public.novelty_comments (
  id uuid default gen_random_uuid() primary key,
  novelty_id uuid references public.novelties(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  rating integer check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

-- ============ аптечка ============
create table if not exists public.medicines (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  image_url text,
  expiration_date date,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medicine_tags (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.medicine_to_tags (
  medicine_id uuid references public.medicines(id) on delete cascade not null,
  tag_id uuid references public.medicine_tags(id) on delete cascade not null,
  primary key (medicine_id, tag_id)
);

create table if not exists public.medicine_applications (
  id uuid default gen_random_uuid() primary key,
  medicine_id uuid references public.medicines(id) on delete cascade not null,
  instructions text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============ вопросы для пары ============
create table if not exists public.couple_questions (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  category text check (category in ('romantic', 'fun', 'deep', 'future', 'memories')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_question_log (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references public.couple_questions(id) on delete cascade not null,
  shown_at date not null default current_date,
  unique (shown_at)
);

-- ============ рандомайзер ============
create table if not exists public.randomizer_lists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null default 'list' check (type in ('list', 'yes_no')),
  last_result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.randomizer_items (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.randomizer_lists(id) on delete cascade not null,
  value text not null,
  created_at timestamptz not null default now()
);

-- ============ настройки и push ============
create table if not exists public.user_settings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  visible_tabs jsonb not null default
    '["dishes","fridge","supplies","tasks","cleaning","novelties","firstaid","couples","randomizer"]'::jsonb,
  push_enabled boolean not null default false,
  push_task_deadline boolean not null default true,
  push_task_assigned boolean not null default true,
  push_fridge_expiry boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null unique,
  subscription jsonb not null,
  user_agent text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============ триггеры updated_at ============
create trigger set_updated_at before update on public.products          for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.dishes            for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.fridge            for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.supplies          for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.tasks             for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.cleaning_rooms    for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.cleaning_tasks    for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.novelties         for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.medicines         for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.randomizer_lists  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.user_settings     for each row execute procedure public.set_updated_at();
```

### 8.4. Seed-данные

Наполняются миграцией идемпотентно (`on conflict do nothing`). Без них приложение стартует с пустыми справочниками
и неработоспособными формами.

| Таблица | Что кладём |
|---|---|
| `units` | Грамм (г), Килограмм (кг), Миллилитр (мл), Литр (л), Штука (шт), Упаковка (уп), Пачка (пач) |
| `medicine_tags` | 9 меток из §8.2 (`slug` + русское `name`) |
| `couple_questions` | Стартовый набор из §8.2 категорий (romantic, fun, deep, future, memories) — кладётся отдельным seed-файлом `supabase/seed/couple_questions.sql` (минимум 5 вопросов на категорию) |
| `products`, `dishes`, `cleaning_rooms` | Не сидим: это пользовательский контент |

```sql
insert into public.units (name, abbreviation) values
  ('Грамм', 'г'), ('Килограмм', 'кг'), ('Миллилитр', 'мл'), ('Литр', 'л'),
  ('Штука', 'шт'), ('Упаковка', 'уп'), ('Пачка', 'пач')
on conflict (name) do nothing;

insert into public.medicine_tags (slug, name) values
  ('head', 'Голова'), ('stomach', 'Живот'), ('throat', 'Горло'), ('ears', 'Уши'),
  ('menstrual', 'Месячные'), ('nose', 'Насморк'), ('teeth', 'Зубы'), ('skin', 'Кожа'), ('other', 'Другое')
on conflict (slug) do nothing;
```

### 8.5. RPC и view

Атомарные операции выполняются на сервере; клиент вызывает `supabase.rpc(...)`, никакого SQL в TS.

| Функция | Контракт |
|---|---|
| `complete_cleaning_task(p_task_id uuid)` | `security invoker`. Читает задачу, пишет строку в `cleaning_history` (`completed_by = auth.uid()`), ставит `last_completed_at = now()` и `next_due_at = nextOccurrence(prev_next_due_at, repeat_config)` (расчёт §5.4 дублируется в SQL-функции; значения должны совпадать с клиентской утилитой). Возвращает новый `next_due_at` |
| `complete_task(p_task_id uuid)` | Аналог для заданий: для повторяющегося — `last_completed_at` + `next_due_at`; для разового — `is_completed = true`, `last_completed_at = now()` |
| `reopen_task(p_task_id uuid)` | Отменяет выполнение разового задания (`is_completed = false`) |
| `adjust_supply(p_supply_id uuid, p_change integer, p_note text default null)` | Меняет `supplies.quantity` и пишет `supply_history` в одной транзакции; при уходе в минус — `raise exception 'insufficient quantity'` |
| `get_daily_question(p_date date default current_date)` | Атомарный выбор вопроса дня по §5.9 (`insert ... on conflict (shown_at) do update ... returning`), возвращает `(question_id, text, category)` |

`view public.novelty_stats` — агрегаты новинок одним запросом. Считаем скалярными подзапросами: соединять
`novelty_likes` и `novelty_comments` одним `join` нельзя — это даёт декартово произведение и завышенные суммы.

```sql
create or replace view public.novelty_stats as
select n.id as novelty_id,
       (select count(*) from public.novelty_likes l
          where l.novelty_id = n.id and l.is_like) as likes,
       (select count(*) from public.novelty_likes l
          where l.novelty_id = n.id and not l.is_like) as dislikes,
       (select round(avg(c.rating), 1) from public.novelty_comments c
          where c.novelty_id = n.id and c.rating is not null) as rating
from public.novelties n;
```

### 8.6. RLS — принятое решение

Приложение семейное (двое равноправных пользователей). Осознанно принято:

- **Пользовательские таблицы** (`products`, `units`, `dishes`, `dish_ingredients`, `fridge`, `supplies`, `supply_history`,
  `tasks`, `task_assignees`, `cleaning_rooms`, `cleaning_tasks`, `cleaning_history`, `novelties`, `novelty_likes`,
  `novelty_comments`, `medicines`, `medicine_tags`, `medicine_to_tags`, `medicine_applications`, `couple_questions`,
  `daily_question_log`, `randomizer_lists`, `randomizer_items`) — полный доступ любому `authenticated`.
- **`user_settings`, `push_subscriptions`** — только свои строки (`auth.uid() = user_id`).
- **`profiles`** — чтение всем залогиненным, изменение только своей строки.
- `profiles` не имеет политику `insert`/`delete`: строки создаёт триггер `security definer`, удаление идёт каскадом из `auth.users`.

Ужесточать политики и добавлять owner-колонки без отдельного решения нельзя — это сломает сценарии «оба всё видят и правят».

```sql
alter table public.profiles           enable row level security;
-- ... (RLS включается для всех таблиц из §8.2)

do $$
declare t text;
begin
  for t in select unnest(array[
    'products','units','dishes','dish_ingredients','fridge','supplies','supply_history',
    'tasks','task_assignees','cleaning_rooms','cleaning_tasks','cleaning_history',
    'novelties','novelty_likes','novelty_comments','medicines','medicine_tags',
    'medicine_to_tags','medicine_applications','couple_questions','daily_question_log',
    'randomizer_lists','randomizer_items'])
  loop
    execute format(
      'create policy "Полный доступ" on public.%I for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

create policy "Свои настройки" on public.user_settings
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Свои push-подписки" on public.push_subscriptions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Профили доступны всем залогиненным" on public.profiles
  for select to authenticated using (true);

create policy "Редактировать свой профиль" on public.profiles
  for update to authenticated using (auth.uid() = id);
```

### 8.7. Миграция 001 — приведение существующей базы к целевой схеме

Применяется один раз в SQL Editor; файл — `supabase/migrations/20250101000000_initial_alignment.sql`
(идентификатор миграции выбирается по фактической дате применения).

```sql
-- 1. Справочники: уникальность имён
alter table public.products add constraint products_name_key unique (name);
alter table public.units    add constraint units_name_key unique (name);

-- 2. Ингредиенты: структурированное количество
alter table public.dish_ingredients
  add column if not exists quantity_value numeric,
  add column if not exists unit_id uuid references public.units(id) on delete restrict,
  add column if not exists note text;

update public.dish_ingredients set note = amount where note is null;
alter table public.dish_ingredients alter column amount drop not null;
alter table public.dish_ingredients drop column amount;

-- 3. Холодильник: updated_at и положительное количество
alter table public.fridge add column if not exists updated_at timestamptz not null default now();
alter table public.fridge add constraint fridge_quantity_positive check (quantity > 0);

-- 4. Задания: дедлайн и факт выполнения
alter table public.tasks
  add column if not exists deadline_at timestamptz,
  add column if not exists last_completed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();
update public.tasks set repeat_type = repeat_config->>'type' where repeat_type is null and repeat_config ? 'type';

-- 5. Аптечка: slug метки
alter table public.medicine_tags add column if not exists slug text;
update public.medicine_tags set slug = lower(name) where slug is null;
alter table public.medicine_tags alter column slug set not null;
alter table public.medicine_tags add constraint medicine_tags_slug_key unique (slug);
alter table public.medicine_applications add column if not exists sort_order integer not null default 0;

-- 6. Вопросы: валидация категории
alter table public.couple_questions
  add constraint couple_questions_category_check
  check (category in ('romantic', 'fun', 'deep', 'future', 'memories'));

-- 7. Настройки: системная тема, push-флаги, дефолтные вкладки
alter table public.user_settings drop constraint if exists user_settings_theme_check;
alter table public.user_settings
  add constraint user_settings_theme_check check (theme in ('light', 'dark', 'system'));
alter table public.user_settings
  add column if not exists push_task_deadline boolean not null default true,
  add column if not exists push_task_assigned boolean not null default true,
  add column if not exists push_fridge_expiry boolean not null default true;
update public.user_settings set visible_tabs =
  '["dishes","fridge","supplies","tasks","cleaning","novelties","firstaid","couples","randomizer"]'::jsonb
  where visible_tabs = '[]'::jsonb;
alter table public.user_settings alter column visible_tabs set default
  '["dishes","fridge","supplies","tasks","cleaning","novelties","firstaid","couples","randomizer"]'::jsonb;

-- 8. Push-подписки: уникальный endpoint
alter table public.push_subscriptions
  add column if not exists endpoint text,
  add column if not exists user_agent text,
  add column if not exists last_seen_at timestamptz;
update public.push_subscriptions set endpoint = subscription->>'endpoint' where endpoint is null;
alter table public.push_subscriptions alter column endpoint set not null;
alter table public.push_subscriptions add constraint push_subscriptions_endpoint_key unique (endpoint);

-- 9. updated_at для остальных таблиц + триггеры
alter table public.supplies       add column if not exists updated_at timestamptz not null default now();
alter table public.cleaning_rooms add column if not exists updated_at timestamptz not null default now();
alter table public.cleaning_tasks add column if not exists updated_at timestamptz not null default now();
alter table public.novelties      add column if not exists updated_at timestamptz not null default now();
alter table public.medicines      add column if not exists updated_at timestamptz not null default now();
alter table public.randomizer_lists add column if not exists updated_at timestamptz not null default now();
alter table public.dishes         add column if not exists updated_at timestamptz not null default now();
```

Порядок применения: миграция 001 → §8.4 seed → §8.5 RPC → §8.6 RLS. После применения — обновить этот раздел, если фактическая схема
отличается от описанной.

## 9. PWA и офлайн

- `ngsw-config.json`: `assetGroups` — app shell (prefetch) и статика (lazy); `dataGroups` для Supabase — **не кэшируем**
  (данные всегда свежие; офлайн-режим только показывает последнее отрисованное состояние).
- Регистрация service worker — `provideServiceWorker` в `app.config.ts`, `registrationStrategy: 'registerWhenStable:30000'`.
- Обновление версии: при событии `SwUpdate.versionUpdates` показываем тост «Доступна новая версия — Обновить», по нажатию — `activateUpdate()` + перезагрузка. Автоматической перезагрузки без согласия нет.
- Офлайн (`navigator.onLine === false`): баннер «Нет подключения» в layout, мутации запрещены с тостом «Действие недоступно без сети».
- `public/manifest.webmanifest` — `name`, `short_name`, `theme_color` `#C26D55`, `background_color` `#F9F6F0`, `display: standalone`, иконки 72–512 px (уже лежат в `public/icons/`).
- Бюджеты сборки: `initial` warning 500 kB / error 1 MB, `anyComponentStyle` 4/8 kB — не превышать.

## 10. Push-уведомления

### 10.1. Модель настроек

| Флаг `user_settings` | Что включает |
|---|---|
| `push_enabled` | общий тумблер; при `false` остальные флаги не действуют |
| `push_task_deadline` | уведомление в день дедлайна (уборка и задания) |
| `push_task_assigned` | «Вам назначили задание» |
| `push_fridge_expiry` | «Продукт истекает сегодня/завтра» (агрегированно, одним сообщением) |

Подписка создаётся только после явного включения `push_enabled` и разрешения браузера; при выключении — удаляем строку из `push_subscriptions`.

### 10.2. Расписание

- `pg_cron` (Supabase Cron) вызывает Edge Function `dispatch-notifications` каждые 15 минут.
- Что делает `dispatch-notifications`: выбирает задачи, у которых `dayDiff(next_due_at, today) = 0` (уборка) и
  `dayDiff(deadline_at, today) = 0 AND is_completed = false` (разовые задания), а также продукты с `dayDiff(expiration_date, today) ∈ {0, 1}`;
  группирует получателей по флагам §10.1 и вызывает `send-push`.
- Момент отправки — не более одного уведомления одного типа на пользователя в сутки: ключ дедупликации `(user_id, type, local_date)`
  хранится в таблице `push_log` (создаётся вместе с первым включением push; миграция 002).
- Мгновенные события («назначили задание») — триггер на `task_assignees` вызывает `send-push` через `pg_net`, без ожидания расписания.

### 10.3. Контракт Edge Function `send-push`

```
POST /functions/v1/send-push
Authorization: Bearer <service_role JWT>          # только сервер/Edge, не клиент
Content-Type: application/json

{
  "userIds": ["uuid", "uuid"],
  "type": "task_deadline" | "task_assigned" | "fridge_expiry",
  "title": "Пора убрать кухню",
  "body": "Задача «Протереть столы» ждёт вас сегодня",
  "url": "/cleaning",            // внутренний роут приложения
  "tag": "cleaning-<taskId>"     // для схлопывания дублей в ОС
}

→ 200 { "sent": 2, "failed": 0, "removed": 1 }
```

- Функция проверяет флаги §10.1 для каждого получателя, читает `push_subscriptions`, отправляет через `web-push`.
- Ответы `404`/`410` от push-сервиса ⇒ подписка удаляется, счётчик `removed` инкрементируется.
- Успешная отправка обновляет `last_seen_at`.
- Клиент получает push через `service worker`; обработчик `notificationclick` открывает `url` (или фокусирует вкладку).

### 10.4. Секреты

- `VAPID_PUBLIC_KEY` — отдаётся клиенту (в `environment.ts`, поле `vapidPublicKey`).
- `VAPID_PRIVATE_KEY`, `service_role`/`SUPABASE_SERVICE_ROLE_KEY` — только в Supabase Secrets/vault.
- Триггер `pg_net` использует `vault.decrypted_secrets`, ключи не хардкодятся в SQL.

## 11. Адаптивность

- **Mobile (< 640 px):** нижний таб-бар, карточки в одну колонку, формы на весь экран, `pb-20` под таб-бар.
- **Tablet (640–1024 px):** карточки в 2 колонки, боковое меню скрыто, если экран уже `md`, иначе — показано.
- **Desktop (≥ 1024 px):** боковое меню (`ml-64`), карточки в 2–3 колонки, модальные окна для форм.
- Минимальная проверяемая ширина — 360 px; тач-таргеты ≥ 44×44 px.

## 12. Этапы реализации

1. **Готово (код в репозитории):** каркас Angular + PrimeNG preset + Tailwind, layout (sidebar/bottom-nav), auth + guard + логин,
   модули `dishes`, `fridge`, `supplies`, `tasks`, `cleaning`, `novelties`, `firstaid`, `couples`, `randomizer`, `settings` (в разной степени полноты).
2. **Схема и данные:** миграция 001 (§8.7), seed справочников (§8.4), RPC (§8.5), RLS (§8.6).
3. **Доведение модулей до спецификации:** расчётные утилиты §5 + тесты, пустые состояния/скелетоны/ошибки, `ConfirmDialog`, `ImageUploader`.
4. **Настройки и тема:** тема из БД (`user_settings.theme` + `system`), видимые вкладки, справочник единиц, выход.
5. **PWA и offline:** §9 (кэш ассетов, тост обновления, офлайн-баннер).
6. **Push:** §10 (функция `send-push`, `dispatch-notifications`, `push_log`, cron, настройки).
7. **Полировка:** a11y, адаптивность 360/1280, бюджеты сборки, тесты на расчётную логику.

## 13. Открытые вопросы

- Внешнее API для вопросов пары — не интегрируем; при появлении источника добавить миграцию импорта и `source` в `couple_questions`.
- Перенос фото на внешний CDN — конфиг уже вынесен в `environment.ts`, отдельной задачи нет.
- Голосовой ввод заданий/продуктов — вне текущего объёма.
- Статистика выполнения заданий и уборки — после стабилизации `*_history` (потребуется агрегирующий view).
- Таймзона «семьи»: сейчас — локальный пояс устройства; при расхождении поясов у пользователей перейти на явную настройку `timezone` в `user_settings`.
