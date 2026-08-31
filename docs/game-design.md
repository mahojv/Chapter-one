# Chapter One - Game Design Document (v0.1)

Este documento constituye la **fuente de verdad oficial** para las reglas, mecánicas y principios de diseño del sistema RPG de **Chapter One**.

> [!IMPORTANT]
> **Estado de la versión**: v0.1 (Fase de Diseño y Especificación Conceptual).  
> Este documento define las directrices que gobernarán las fases de desarrollo del sistema RPG. No debe interpretarse como código implementado en la fase actual de Foundation.

---

## 1. Concepto Central y Filosofía

**Chapter One** transforma los hábitos, conductas y esfuerzos de la vida real del usuario en progresión tangible dentro de un juego de rol (RPG) personal.

### Pilares Fundamentales:
* **Refuerzo Positivo sobre el Castigo**: El objetivo del sistema no es penalizar al usuario por tener días difíciles o fallar en una meta, sino hacer que la adopción y el mantenimiento de hábitos saludables sean más divertidos, visibles, motivadores y sostenibles a largo plazo.
* **Preservación Histórica**: La aplicación registra y conserva la historia del jugador de manera inmutable. Los esfuerzos pasados nunca desaparecen.
* **Representación Fidedigna**: La evolución del usuario se refleja mediante:
  * Experiencia acumulada (XP)
  * Niveles de progresión general (Levels)
  * Capacidades físicas y mentales generales (Attributes)
  * Habilidades específicas (Skills)
  * Conductas regulares (Habits)
  * Regularidad a lo largo del tiempo (Consistency)
  * Objetivos y retos (Quests)
  * Hitos permanentes (Achievements)
  * Recompensas y reconocimientos (Rewards)

---

## 2. El Jugador (Player)

El **Player** es el avatar y la representación del usuario dentro del ecosistema RPG.

### Componentes de Estado del Player:
* **Total XP**: Experiencia global acumulada a lo largo de toda la vida de la cuenta.
* **Level**: Nivel general de progresión derivado del XP.
* **Attributes**: Conjunto de capacidades generales evolutivas.
* **Skills**: Catálogo de habilidades específicas practicadas.
* **Habits**: Hábitos activos y su métrica de cumplimiento.
* **Quests**: Misiones diarias, semanales o épicas en curso o completadas.
* **Achievements**: Logros permanentes desbloqueados.
* **Progress History**: Registro cronológico inmutable de actividades, marcas y marcas personales.

### Visión Multidominio (Más Allá del Fitness):
El Player **no representa únicamente la condición física**. Aunque *Fitness* y entrenamiento físico constituyen el primer dominio funcional del sistema, la arquitectura del juego está diseñada para expandirse de forma nativa hacia múltiples dimensiones del desarrollo humano:
1. **Fitness**: Entrenamiento de fuerza, acondicionamiento, deportes.
2. **Health**: Descanso, hidratación, nutrición, salud mental.
3. **Learning**: Idiomas, estudio técnico, lectura académica.
4. **Hobbies**: Música, arte, escritura creativa.
5. **Productivity**: Gestión del tiempo, enfoque, finanzas personales.
6. **Personal Development**: Meditación, mindfulness, disciplina personal.

---

## 3. Experiencia (XP)

El **XP** (Experience Points) cuantifica el esfuerzo real acumulado por el usuario.

### Reglas de XP:
1. **Permanencia Total**: El XP es estrictamente permanente. Una vez ganado, jamás se resta, drena ni degrada por inactividad.
2. **Fuentes de Generación**:
   * Completar o registrar un Hábito positivo.
   * Completar una sesión de entrenamiento o sesión de práctica.
   * Superar un objetivo o récord personal.
   * Finalizar una Quest (Daily, Weekly, Epic).
   * Obtener un Achievement.
   * Alcanzar un hito clave (*Milestone*).
3. **Prevención de Spam y Validación**:
   * Registrar una acción no otorga automáticamente XP ilimitado.
   * El sistema incorporará mecanismos de validación y niveles de evidencia (ej. verificación por sensores, telemetría, límites de frecuencia diaria o validaciones contextuales) para evitar trampas, spam de botones o inflación artificial de progreso.

---

## 4. Niveles y Curva de Nivel (Levels)

El **Level** representa el rango o nivel de maestría general alcanzado por el Player dentro de Chapter One.

### Curva de Progresión (Propuesta v0.1):
$$\text{XP Requerido para Nivel } N = 100 \times N^{1.6}$$

*Nota de balanceo*: Esta fórmula es una propuesta inicial de diseño sujeta a calibración y balanceo mediante análisis de datos de usuarios en fases avanzadas.

### Beneficios por Level Up:
* Cada subida de nivel otorga **+1 Skill Point**.
* Desbloqueo progresivo de mecánicas y contenido según el nivel del Player.

#### Hitos de Desbloqueo Conceptual (Propuesta v0.1):
* **Nivel 1**: Perfil básico del Player y seguimiento de hábitos iniciales.
* **Nivel 5**: Acceso al sistema de Skills y asignación de maestría.
* **Nivel 10**: Sistema de Quests y retos periódicos.
* **Nivel 15**: Rutas de especialización (*Specializations*).
* **Nivel 20+**: Sistemas avanzados, títulos de maestría y mecánicas de prestigio.

---

## 5. Atributos (Attributes)

Los **Attributes** representan las capacidades físicas, cognitivas y formativas generales del usuario.

### Atributos Base (Propuesta Inicial):
1. **Power**: Capacidad de generar fuerza mecánica contra resistencias elevadas.
2. **Vitality**: Salud integral, capacidad de recuperación y resistencia orgánica.
3. **Endurance**: Resistencia cardiovascular y muscular sostenida en el tiempo.
4. **Agility**: Velocidad, coordinación neuromotora y capacidad de reacción.
5. **Mobility**: Rango de movimiento articular activo, elasticidad y control postural.
6. **Knowledge**: Acumulación de aprendizaje, desarrollo intelectual y estudio.
7. **Discipline**: Capacidad de mantener consistencia en los hábitos a lo largo del tiempo.

### Mecánica de Crecimiento:
* **Prohibición de Asignación Manual**: Los puntos de Atributo **nunca** se compran ni se asignan manualmente con botones.
* **Evolución por Causalidad Real**: Un atributo evoluciona como resultado directo de las actividades reales vinculadas a él:
  * Entrenar *Press de Banca* o *Sentadillas* $\rightarrow$ Aumenta **Power**.
  * Sesiones de carrera continua (*Running*) $\rightarrow$ Aumenta **Endurance**.
  * Sesiones de estiramiento y yoga $\rightarrow$ Aumenta **Mobility**.
  * Sesiones de estudio o lectura técnica $\rightarrow$ Aumenta **Knowledge**.
  * Cumplimiento consistente de hábitos diarios $\rightarrow$ Aumenta **Discipline**.

---

## 6. Habilidades (Skills)

Mientras que los Atributos son generales y abstractos, las **Skills** representan competencias concretas, medibles y practicables.

### Taxonomía Conceptual:
* **Power**:
  * *Bench Press*
  * *Squat*
  * *Deadlift*
  * *Pull-Ups*
* **Endurance**:
  * *Running*
  * *Cycling*
  * *Swimming*
* **Knowledge**:
  * *English*
  * *Programming*
  * *Mathematics*

### Estructura de Datos de una Skill:
Toda habilidad almacena conceptualmente los siguientes elementos:
* **Total XP**: Experiencia acumulada histórica en dicha habilidad (permanente).
* **Level**: Nivel alcanzado en la habilidad.
* **Current Proficiency**: Estado actual de rendimiento y competencia práctica (sujeto a actividad reciente).
* **Last Practiced**: Marca temporal de la última sesión ejecutada.
* **Historical Maximum**: Techo histórico o récord personal alcanzado por el usuario en dicha habilidad.

*Preparación para Árboles de Habilidades*: La arquitectura de datos de Skills contemplará la relación jerárquica entre nodos para habilitar futuros árboles de habilidades (*Skill Trees*).

---

## 7. Pérdida de Competencia (Skill Decay)

Cuando una habilidad deja de practicarse durante un tiempo prolongado, la capacidad física o mental real experimenta desentrenamiento. El juego refleja esta realidad mediante el **Skill Decay**.

### Reglas de Skill Decay:
1. **Afecta únicamente a la Competencia Actual (*Current Proficiency*)**: Jamás reduce el XP histórico ni borra los récords registrados en el historial del Player.
2. **Ventanas de Inactividad (Propuesta Inicial v0.1)**:
   * **0 a 7 días sin práctica**: *Sin pérdida (No decay)*. Margen seguro de descanso y supercompensación.
   * **8 a 21 días sin práctica**: *Decay ligero*. Pérdida menor en la agilidad o ritmo de ejecución.
   * **22 a 60 días sin práctica**: *Decay moderado*. Pérdida sensible de acondicionamiento o fluidez.
   * **60+ días sin práctica**: *Decay mayor*. La competencia actual desciende hacia una base mínima sin afectar el historial.

### Tasas de Desgaste Diferenciadas:
Cada habilidad posee una tasa de desentrenamiento biológica/cognitiva propia:
* **Mobility**: Tasa *alta* (la flexibilidad se deteriora con rapidez sin estímulo).
* **Running**: Tasa *media* (la capacidad aeróbica decae de forma progresiva).
* **Programming**: Tasa *baja* (el conocimiento procedimental se retiene por largo tiempo).
* **English / Idiomas**: Tasa *baja* (la base consolidada tiene alta retención).

---

## 8. Memoria Muscular y Recuperación (Recovery Bonus)

Volver a entrenar o practicar una habilidad tras un periodo de inactividad es mucho más rápido que aprenderla desde cero, emulando el fenómeno biológico de la memoria muscular y la reactivación neuronal.

### Mecánica del Recovery Bonus:
* Cuando una habilidad tiene un nivel de competencia actual (*Current Proficiency*) inferior a su máximo histórico (*Historical Maximum*), cualquier sesión de práctica otorga un multiplicador de recuperación.
* **Ejemplo Conceptual**:
  * XP base de sesión: `100 XP`
  * Recovery Bonus: `+50%`
  * XP efectivo aplicado a la competencia: `150 XP`
* **Límite de Atenuación**: El Recovery Bonus decrece progresivamente conforme la competencia actual se aproxima de nuevo al récord histórico, extinguiéndose al alcanzarlo para evitar duplicación injustificada de progreso.

---

## 9. El Descanso (Rest & Rest Days)

El descanso físico y mental es un componente indispensable del rendimiento y no debe ser penalizado.

### Principios del Descanso:
* **Días de Descanso Programados (*Rest Days*)**: No disparan el contador de Skill Decay ni interrumpen la constancia del usuario.
* **Diferenciación Conceptual**: El sistema distingue entre tres estados:
  1. **Descanso Intencional**: Pausa planificada como parte del ciclo de entrenamiento y recuperación.
  2. **Inactividad Temporal**: Ausencia de registros dentro de márgenes manejables.
  3. **Abandono Prolongado**: Periodo extendido sin interacción que requiere mecánicas especiales de bienvenida (*Comeback*).
* **Recuperación Positiva**: En fases futuras, el descanso registrado adecuadamente (sueño de calidad, días de descarga) otorgará beneficios al estado del Player.

---

## 10. Hábitos (Habits)

Un **Habit** es una conducta positiva repetible que el usuario busca integrar o mantener en su estilo de vida.

### Metadatos de un Hábito:
* **Nombre e Identificador**: Descripción clara de la acción (ej. *Beber 2L de agua*, *Entrenamiento de fuerza*, *Lectura técnica 20 min*).
* **Frecuencia**: Días objetivo por semana o cadencia definida.
* **Objetivo cuantitativo/cualitativo**: Criterio de éxito diario o semanal.
* **Dificultad**: Nivel de complejidad que modula el XP asignado.
* **Recompensa de XP**: Experiencia otorgada al cumplir el objetivo.
* **Skills Relacionadas**: Habilidades específicas que se benefician de la práctica del hábito.
* **Consistency**: Métrica de cumplimiento en la ventana temporal activa.
* **Streak**: Contador de días consecutivos cumplidos (métrica secundaria).

*Regla de Oro*: El XP se adjudica por la consecución del objetivo programado, no por la pulsación repetitiva de registros.

---

## 11. Constancia (Consistency) vs Rachas (Streaks)

Uno de los principales problemas en las aplicaciones de gamificación tradicionales es la tiranía de las rachas (*Streaks*): cuando una racha perfecta de 100 días se interrumpe por un imprevisto, el usuario siente desmotivación y con frecuencia abandona la plataforma.

### El Consistency Score como Métrica Principal:
* Chapter One prioriza el comportamiento sostenido por encima de la perfección diaria.
* El **Consistency Score** mide el porcentaje de cumplimiento en una ventana temporal continua (ej. últimos 30 días):
$$\text{Consistency Score} = \frac{\text{Días con objetivo cumplido}}{\text{Días totales evaluados}} \times 100$$
* *Ejemplo*: 25 de 30 días cumplidos $\rightarrow$ **83% de Consistencia** (Sobresaliente). Perder un día aislado solo reduce la métrica ligeramente de 100% a 97%, incentivando continuar al día siguiente.
* **Rol de las Streaks**: Se mantienen como una dinámica secundaria o de adorno estético/logro, pero nunca como el indicador determinante de la salud de la cuenta del jugador.

---

## 12. Misiones (Quests)

Las **Quests** contextualizan los esfuerzos diarios dentro de objetivos con narrativa y recompensas estructuradas.

### Tipos de Quests:
1. **Daily Quests (Misiones Diarias)**:
   * Acciones concretas de un solo día (ej. *Completar el entrenamiento del día*, *Alcanzar meta de hidratación*).
   * Recompensas: Pequeñas inyecciones de XP directo (ej. `+75 XP`).
2. **Weekly Quests (Misiones Semanales)**:
   * Objetivos acumulados que demandan regularidad (ej. *Completar 4 sesiones de entrenamiento en la semana*).
   * Recompensas: Paquetes sustanciales de XP (ej. `+300 XP`) y posibles **Skill Points**.
3. **Long-Term / Epic Quests (Misiones Épicas)**:
   * Metas a medio o largo plazo vinculadas a transformaciones físicas o formativas reales (ej. *Completar el primer mes del programa*, *Alcanzar 10 dominadas estrictas*, *Correr 10K ininterrumpidos*).
   * Recompensas: Grandes volúmenes de XP (ej. `+2000 XP`), **Achievements**, **Títulos especiales** y cosméticos de perfil.

---

## 13. Logros (Achievements)

Los **Achievements** conmemoran hitos significativos y puntos de inflexión en la trayectoria del usuario.

### Criterios de Diseño:
* No premiar acciones triviales sin mérito (evitar saturación de medallas por abrir la app).
* Reconocer constancia, superación de límites personales y capacidad de resiliencia.

### Ejemplos Iniciales:
* **First Step**: Registrar el primer entrenamiento oficial.
* **Committed**: Acumular 10 entrenamientos válidos.
* **Consistent**: Mantener un Consistency Score superior al 80% durante 30 días consecutivos en un hábito principal.
* **Breaking Limits**: Registrar un nuevo récord personal en una Skill (ej. marca máxima o distancia).
* **Comeback**: Retomar una Skill tras experimentar Skill Decay y activar exitosamente el Recovery Bonus.
* **Chapter Complete**: Concluir un bloque o hito macro de transformación física.

*Permanencia*: Los Achievements son 100% permanentes e inmutables.

---

## 14. Puntos de Habilidad (Skill Points)

Los **Skill Points** son una divisa de progresión especializada, estrictamente diferenciada del XP ordinario.

### Vías de Obtención:
* Subida de nivel general del Player (**+1 Skill Point por Level Up**).
* Finalización de Quests Semanales o Épicas mayores.
* Desbloqueo de Achievements clave o Milestones del sistema.

### Utilidad Prevista:
* Desbloqueo de nuevas disciplinas o ramas en el catálogo de Skills.
* Activación de nodos pasivos o bonificaciones especiales dentro de futuros árboles de habilidades (*Skill Trees*).

---

## 15. Sistema de Recompensas (Rewards)

Las recompensas proporcionan gratificación inmediata y a largo plazo para reforzar el bucle de motivación.

### Tipos de Recompensas Contempladas:
* **Progreso Numérico**: XP y Skill Points.
* **Desbloqueos de Sistema (Unlocks)**: Acceso a nuevas herramientas, tipos de entrenamientos o configuraciones avanzadas.
* **Títulos (Titles)**: Distintivos mostrados en el perfil del Player (ej. *"El Constante"*, *"Hierro Forjado"*, *"Aprendiz de Acero"*).
* **Insignias y Medallas (Badges)**: Representaciones visuales de hitos alcanzados.
* **Cosméticos**: Temas de interfaz, marcos de avatar y efectos visuales de celebración.
* **Funcionalidades Avanzadas**: Métricas analíticas exclusivas y herramientas de seguimiento detallado.

---

## 16. Inmutabilidad del Progreso: Política de Pérdida de XP

> [!CAUTION]
> **REGLA DE ORO DEL SISTEMA RPG**:  
> **El jugador NUNCA pierde XP histórico bajo ninguna circunstancia.**

### Elementos Estrictamente Permanentes:
* Total XP acumulado.
* Nivel alcanzado (Level).
* Logros desbloqueados (Achievements).
* Historial cronológico de entrenamientos y marcas.

### Elementos que Pueden Reducirse Temporalmente por Inactividad:
* Nivel de competencia práctica actual en una habilidad (*Skill Current Proficiency*).
* Métrica temporal de consistencia en hábitos (*Consistency Score* en la ventana móvil).
* Contador de días consecutivos (*Streak*).

*Propósito Psicológico*: Garantizar que volver a abrir Chapter One después de semanas o meses siempre se sienta como el regreso de un héroe que retoma su entrenamiento con toda su historia intacta, y nunca como un castigo que borra el trabajo de meses.

---

## 17. Separación de Conceptos: Progresión vs. Comportamiento

Para mantener una arquitectura limpia tanto en diseño como en el futuro código, el sistema establece una separación nítida entre dos capas:

### Progresión (Progression):
Representa el **estado de capacidades y nivel** alcanzado por el Player.
* XP
* Level
* Attributes
* Skills

### Comportamiento (Behavior):
Representa las **acciones del usuario en el mundo real**.
* Habits
* Consistency
* Streaks
* Quests

### Flujo Causal del Sistema:
```text
[Vida Real: Esfuerzo / Entrenamiento / Estudio]
                       │
                       ▼
               [Acción Registrada]
                       │
                       ▼
          [Progreso de Hábitos y Quests]
                       │
                       ▼
        [XP / Skill Proficiency / Attributes]
                       │
                       ▼
             [Progresión General]
                       │
                       ▼
           [Recompensas / Level Up]
```

---

## 18. Principios Fundamentales de Diseño

1. **La vida real es la única fuente legítima de progreso.**
2. **El historial del jugador jamás se destruye ni se penaliza.**
3. **El sistema debe incentivar volver tras una pausa, nunca castigar el tropiezo.**
4. **El descanso intencional forma parte del entrenamiento y no se computa como fracaso.**
5. **Las recompensas deben reforzar comportamientos positivos y sostenibles.**
6. **Diseñar las reglas para imposibilitar el spam de acciones ficticias para granjear XP.**
7. **Las Skills representan capacidades específicas y cuantificables.**
8. **Los Attributes representan capacidades globales y evolutivas.**
9. **Los Habits representan patrones de comportamiento repetibles.**
10. **El XP cuantifica el esfuerzo acumulado a lo largo del tiempo.**
11. **El Level refleja la madurez y progreso global del Player.**
12. **La constancia sostenida (Consistency) es infinitamente más valiosa que una racha perfecta (Streak).**
13. **La arquitectura del sistema debe admitir dominios formativos y personales más allá del Fitness.**
14. **Todas las fórmulas numéricas y umbrales deben calibrarse mediante datos empíricos de uso real.**
