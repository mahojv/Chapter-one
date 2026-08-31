-- =============================================================================
-- Chapter One - Initial Domain Model Schema (Fase 3: PostgreSQL)
-- Fuente de verdad: docs/domain-model.md y docs/game-design.md
-- =============================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUM TYPES
-- -----------------------------------------------------------------------------

CREATE TYPE attribute_category AS ENUM (
    'PHYSICAL',
    'MENTAL',
    'BEHAVIORAL'
);

CREATE TYPE skill_domain AS ENUM (
    'FITNESS',
    'HEALTH',
    'LEARNING',
    'HOBBIES',
    'PRODUCTIVITY',
    'PERSONAL_DEV'
);

CREATE TYPE decay_rate AS ENUM (
    'NONE',
    'LOW',
    'MEDIUM',
    'HIGH'
);

CREATE TYPE decay_status AS ENUM (
    'ACTIVE',
    'DECAY_LIGHT',
    'DECAY_MODERATE',
    'DECAY_MAJOR'
);

CREATE TYPE habit_frequency_type AS ENUM (
    'DAILY',
    'DAYS_PER_WEEK',
    'SPECIFIC_DAYS'
);

CREATE TYPE habit_difficulty_tier AS ENUM (
    'TRIVIAL',
    'EASY',
    'MEDIUM',
    'HARD'
);

CREATE TYPE habit_log_status AS ENUM (
    'COMPLETED',
    'SKIPPED',
    'REST_DAY',
    'FAILED'
);

CREATE TYPE validation_status AS ENUM (
    'SELF_REPORTED',
    'DEVICE_VERIFIED',
    'COACH_VERIFIED'
);

CREATE TYPE quest_type AS ENUM (
    'DAILY',
    'WEEKLY',
    'EPIC_LONG_TERM'
);

CREATE TYPE quest_status AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'CLAIMED',
    'EXPIRED'
);

CREATE TYPE achievement_category AS ENUM (
    'CONSISTENCY',
    'MASTERY',
    'RESILIENCE',
    'MILESTONE'
);

CREATE TYPE reward_type AS ENUM (
    'XP',
    'SKILL_POINTS',
    'TITLE',
    'BADGE',
    'UNLOCK',
    'COSMETIC'
);

CREATE TYPE progress_event_type AS ENUM (
    'WORKOUT_COMPLETED',
    'HABIT_COMPLETED',
    'QUEST_COMPLETED',
    'ACHIEVEMENT_UNLOCKED',
    'SKILL_XP_GAINED',
    'LEVEL_UP',
    'PERSONAL_RECORD',
    'REST_DAY_LOGGED',
    'SKILL_DECAY_CALCULATED',
    'ATTRIBUTE_PROGRESS'
);

-- -----------------------------------------------------------------------------
-- 1. PLAYERS & PROGRESSION
-- -----------------------------------------------------------------------------

CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id VARCHAR(255) UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE player_progress (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    total_xp BIGINT NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    current_level INT NOT NULL DEFAULT 1 CHECK (current_level >= 1),
    unspent_skill_points INT NOT NULL DEFAULT 0 CHECK (unspent_skill_points >= 0),
    total_skill_points_earned INT NOT NULL DEFAULT 0 CHECK (total_skill_points_earned >= 0),
    last_level_up_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. ATTRIBUTES & PLAYER ATTRIBUTES
-- -----------------------------------------------------------------------------

CREATE TABLE attributes (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_key VARCHAR(100),
    category attribute_category NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE player_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    attribute_id VARCHAR(50) NOT NULL REFERENCES attributes(id) ON DELETE RESTRICT,
    current_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (current_score >= 0.00 AND current_score <= 100.00),
    historical_peak_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (historical_peak_score >= 0.00 AND historical_peak_score <= 100.00),
    last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_player_attribute UNIQUE (player_id, attribute_id)
);

-- -----------------------------------------------------------------------------
-- 3. SKILLS, PLAYER SKILLS & PROGRESS
-- -----------------------------------------------------------------------------

CREATE TABLE skills (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    primary_attribute_id VARCHAR(50) NOT NULL REFERENCES attributes(id) ON DELETE RESTRICT,
    secondary_attribute_id VARCHAR(50) REFERENCES attributes(id) ON DELETE RESTRICT,
    parent_skill_id VARCHAR(50) REFERENCES skills(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    domain skill_domain NOT NULL DEFAULT 'FITNESS',
    base_decay_rate decay_rate NOT NULL DEFAULT 'MEDIUM',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE player_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    skill_id VARCHAR(50) NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    historical_xp BIGINT NOT NULL DEFAULT 0 CHECK (historical_xp >= 0),
    current_proficiency NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (current_proficiency >= 0.00 AND current_proficiency <= 100.00),
    historical_max_proficiency NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (historical_max_proficiency >= 0.00 AND historical_max_proficiency <= 100.00),
    skill_level INT NOT NULL DEFAULT 1 CHECK (skill_level >= 1),
    last_practiced_at TIMESTAMPTZ,
    decay_status decay_status NOT NULL DEFAULT 'ACTIVE',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_player_skill UNIQUE (player_id, skill_id)
);

CREATE TABLE skill_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_skill_id UUID NOT NULL REFERENCES player_skills(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    metric_value NUMERIC(10, 2) NOT NULL CHECK (metric_value >= 0.00),
    is_personal_record BOOLEAN NOT NULL DEFAULT FALSE,
    achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_event_id UUID
);

-- -----------------------------------------------------------------------------
-- 4. REWARDS
-- -----------------------------------------------------------------------------

CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_type reward_type NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. HABITS & HABIT LOGS
-- -----------------------------------------------------------------------------

CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    linked_skill_id VARCHAR(50) REFERENCES skills(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    frequency_type habit_frequency_type NOT NULL DEFAULT 'DAILY',
    target_frequency_value INT NOT NULL DEFAULT 1 CHECK (target_frequency_value >= 1),
    target_unit VARCHAR(50) NOT NULL DEFAULT 'BOOLEAN_COMPLETION',
    difficulty_tier habit_difficulty_tier NOT NULL DEFAULT 'MEDIUM',
    base_xp_reward INT NOT NULL DEFAULT 50 CHECK (base_xp_reward >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    status habit_log_status NOT NULL DEFAULT 'COMPLETED',
    actual_value NUMERIC(10, 2) DEFAULT 1.00,
    validation_status validation_status NOT NULL DEFAULT 'SELF_REPORTED',
    xp_awarded INT NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
    progress_event_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_habit_log_date UNIQUE (habit_id, log_date)
);

-- -----------------------------------------------------------------------------
-- 6. QUESTS & QUEST PROGRESS
-- -----------------------------------------------------------------------------

CREATE TABLE quests (
    id VARCHAR(50) PRIMARY KEY,
    quest_type quest_type NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    required_domain skill_domain,
    completion_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    reward_id UUID REFERENCES rewards(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quest_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    quest_id VARCHAR(50) NOT NULL REFERENCES quests(id) ON DELETE RESTRICT,
    status quest_status NOT NULL DEFAULT 'IN_PROGRESS',
    current_progress_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    target_progress_value NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    CONSTRAINT uq_player_quest UNIQUE (player_id, quest_id, started_at)
);

-- -----------------------------------------------------------------------------
-- 7. ACHIEVEMENTS & PLAYER ACHIEVEMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE achievements (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category achievement_category NOT NULL,
    unlock_condition JSONB NOT NULL DEFAULT '{}'::jsonb,
    reward_id UUID REFERENCES rewards(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE player_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id) ON DELETE RESTRICT,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trigger_event_id UUID,
    CONSTRAINT uq_player_achievement UNIQUE (player_id, achievement_id)
);

-- -----------------------------------------------------------------------------
-- 8. PROGRESS EVENTS (AUDITABLE APPEND-ONLY LEDGER)
-- -----------------------------------------------------------------------------

CREATE TABLE progress_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    event_type progress_event_type NOT NULL,
    source_entity_type VARCHAR(50) NOT NULL,
    source_entity_id UUID NOT NULL,
    xp_delta INT NOT NULL DEFAULT 0 CHECK (xp_delta >= 0),
    skill_points_delta INT NOT NULL DEFAULT 0 CHECK (skill_points_delta >= 0),
    reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- INDEXES FOR HIGH-PERFORMANCE QUERIES
-- -----------------------------------------------------------------------------

-- Audit trail: chronological events per player
CREATE INDEX idx_progress_events_player_time ON progress_events(player_id, occurred_at DESC);

-- Habits & Consistency: 30-day sliding window lookups
CREATE INDEX idx_habit_logs_player_date ON habit_logs(player_id, log_date DESC);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, log_date DESC);

-- Player skills & Attributes
CREATE INDEX idx_player_skills_player ON player_skills(player_id);
CREATE INDEX idx_player_attributes_player ON player_attributes(player_id);

-- Quests
CREATE INDEX idx_quest_progress_player_status ON quest_progress(player_id, status);

-- Skill progress records
CREATE INDEX idx_skill_progress_skill_record ON skill_progress(player_skill_id, is_personal_record);
