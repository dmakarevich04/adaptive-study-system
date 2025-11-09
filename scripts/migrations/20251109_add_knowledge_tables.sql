-- Migration: add questionType, topicId, UserAnswer, UserModuleKnowledge, UserCourseKnowledge

BEGIN;

-- add columns to Question
ALTER TABLE IF EXISTS public."Question"
    ADD COLUMN IF NOT EXISTS "questionType" text NOT NULL DEFAULT 'test';

ALTER TABLE IF EXISTS public."Question"
    ADD COLUMN IF NOT EXISTS "topicId" bigint;

ALTER TABLE IF EXISTS public."Question"
    ADD FOREIGN KEY ("topicId")
    REFERENCES public."Topic" (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

-- create UserAnswer
CREATE TABLE IF NOT EXISTS public."UserAnswer"
(
    id bigint NOT NULL,
    "userId" bigint NOT NULL,
    "testResultId" bigint NOT NULL,
    "questionId" bigint NOT NULL,
    "isCorrect" boolean NOT NULL,
    "timeSpentInMinutes" bigint,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public."UserAnswer"
    ADD FOREIGN KEY ("userId")
    REFERENCES public."User" (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

ALTER TABLE IF EXISTS public."UserAnswer"
    ADD FOREIGN KEY ("testResultId")
    REFERENCES public."TestResult" (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

ALTER TABLE IF EXISTS public."UserAnswer"
    ADD FOREIGN KEY ("questionId")
    REFERENCES public."Question" (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

-- create UserModuleKnowledge
CREATE TABLE IF NOT EXISTS public."UserModuleKnowledge"
(
    id bigint NOT NULL,
    "userId" bigint NOT NULL,
    "moduleId" bigint NOT NULL,
    knowledge double precision NOT NULL DEFAULT 0.0,
    "lastUpdated" date,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public."UserModuleKnowledge"
    ADD FOREIGN KEY ("userId")
    REFERENCES public."User" (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

ALTER TABLE IF EXISTS public."UserModuleKnowledge"
    ADD FOREIGN KEY ("moduleId")
    REFERENCES public."Module" (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

-- create UserCourseKnowledge
CREATE TABLE IF NOT EXISTS public."UserCourseKnowledge"
(
    id bigint NOT NULL,
    "userId" bigint NOT NULL,
    "courseId" bigint NOT NULL,
    knowledge double precision NOT NULL DEFAULT 0.0,
    "lastUpdated" date,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public."UserCourseKnowledge"
    ADD FOREIGN KEY ("userId")
    REFERENCES public."User" (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

ALTER TABLE IF EXISTS public."UserCourseKnowledge"
    ADD FOREIGN KEY ("courseId")
    REFERENCES public."Course" (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

COMMIT;
