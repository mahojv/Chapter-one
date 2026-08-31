-- =============================================================================
-- Chapter One - Initial Seeds (Attributes & Skills)
-- Fuente de verdad: docs/game-design.md y docs/domain-model.md
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ATTRIBUTES
-- -----------------------------------------------------------------------------

INSERT INTO attributes (id, code, name, description, icon_key, category)
VALUES
    ('ATTR_POWER', 'POWER', 'Power', 'Capacidad de generar fuerza mecánica contra resistencias elevadas.', 'dumbbell', 'PHYSICAL'),
    ('ATTR_VITALITY', 'VITALITY', 'Vitality', 'Salud integral, capacidad de recuperación y resistencia orgánica.', 'heart', 'PHYSICAL'),
    ('ATTR_ENDURANCE', 'ENDURANCE', 'Endurance', 'Resistencia cardiovascular y muscular sostenida en el tiempo.', 'lungs', 'PHYSICAL'),
    ('ATTR_AGILITY', 'AGILITY', 'Agility', 'Velocidad, coordinación neuromotora y capacidad de reacción.', 'zap', 'PHYSICAL'),
    ('ATTR_MOBILITY', 'MOBILITY', 'Mobility', 'Rango de movimiento articular activo, elasticidad y control postural.', 'move', 'PHYSICAL'),
    ('ATTR_KNOWLEDGE', 'KNOWLEDGE', 'Knowledge', 'Acumulación de aprendizaje, desarrollo intelectual y estudio.', 'book-open', 'MENTAL'),
    ('ATTR_DISCIPLINE', 'DISCIPLINE', 'Discipline', 'Capacidad de mantener consistencia en los hábitos a lo largo del tiempo.', 'shield-check', 'BEHAVIORAL')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_key = EXCLUDED.icon_key,
    category = EXCLUDED.category;

-- -----------------------------------------------------------------------------
-- 2. SKILLS
-- -----------------------------------------------------------------------------

INSERT INTO skills (id, code, primary_attribute_id, name, domain, base_decay_rate, is_active)
VALUES
    -- Power skills
    ('SKILL_BENCH_PRESS', 'BENCH_PRESS', 'ATTR_POWER', 'Bench Press', 'FITNESS', 'MEDIUM', TRUE),
    ('SKILL_SQUAT', 'SQUAT', 'ATTR_POWER', 'Squat', 'FITNESS', 'MEDIUM', TRUE),
    ('SKILL_DEADLIFT', 'DEADLIFT', 'ATTR_POWER', 'Deadlift', 'FITNESS', 'MEDIUM', TRUE),
    ('SKILL_PULL_UPS', 'PULL_UPS', 'ATTR_POWER', 'Pull Ups', 'FITNESS', 'MEDIUM', TRUE),

    -- Endurance skills
    ('SKILL_RUNNING', 'RUNNING', 'ATTR_ENDURANCE', 'Running', 'FITNESS', 'MEDIUM', TRUE),
    ('SKILL_CYCLING', 'CYCLING', 'ATTR_ENDURANCE', 'Cycling', 'FITNESS', 'MEDIUM', TRUE),
    ('SKILL_SWIMMING', 'SWIMMING', 'ATTR_ENDURANCE', 'Swimming', 'FITNESS', 'MEDIUM', TRUE),

    -- Knowledge skills
    ('SKILL_ENGLISH', 'ENGLISH', 'ATTR_KNOWLEDGE', 'English', 'LEARNING', 'LOW', TRUE),
    ('SKILL_PROGRAMMING', 'PROGRAMMING', 'ATTR_KNOWLEDGE', 'Programming', 'LEARNING', 'LOW', TRUE),
    ('SKILL_MATHEMATICS', 'MATHEMATICS', 'ATTR_KNOWLEDGE', 'Mathematics', 'LEARNING', 'LOW', TRUE)
ON CONFLICT (id) DO UPDATE SET
    primary_attribute_id = EXCLUDED.primary_attribute_id,
    name = EXCLUDED.name,
    domain = EXCLUDED.domain,
    base_decay_rate = EXCLUDED.base_decay_rate,
    is_active = EXCLUDED.is_active;
