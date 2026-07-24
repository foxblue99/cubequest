-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('CASUAL', 'HEURISTIC', 'VIDEO', 'SMARTCUBE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "birthYear" INTEGER,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'NEWBIE',
    "bestSingleMs" INTEGER,
    "bestAo5Ms" INTEGER,
    "bestAo12Ms" INTEGER,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "bindCode" TEXT,
    "parentId" TEXT,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentChild" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "icon" TEXT NOT NULL DEFAULT '🧊',
    "subCategories" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "coverUrl" TEXT,
    "mainCategory" TEXT NOT NULL DEFAULT '三阶魔方',
    "category" TEXT NOT NULL,
    "level" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "videoUrl" TEXT,
    "formulaText" TEXT,
    "cubeMoves" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formula" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mainCategory" TEXT NOT NULL DEFAULT '三阶魔方',
    "category" TEXT NOT NULL,
    "caseCode" TEXT,
    "imageUrl" TEXT,
    "moves" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "level" TEXT,
    "description" TEXT,
    "commonMistakes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Formula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormulaProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_LEARNED',
    "practicedCount" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FormulaProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolveResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT '333',
    "scramble" TEXT NOT NULL,
    "timeMs" INTEGER,
    "penalty" TEXT NOT NULL DEFAULT 'NONE',
    "finalTimeMs" INTEGER,
    "crossMs" INTEGER,
    "f2lMs" INTEGER,
    "ollMs" INTEGER,
    "pllMs" INTEGER,
    "isPB" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'CASUAL',
    "flagReason" TEXT,
    "flaggedAt" TIMESTAMP(3),
    "activityId" TEXT,

    CONSTRAINT "SolveResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoVerificationLog" (
    "id" TEXT NOT NULL,
    "solveResultId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT,
    "videoUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "retained" BOOLEAN NOT NULL DEFAULT false,
    "retentionReason" TEXT,
    "reviewNote" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoVerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "posterUrl" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "scramble" TEXT,
    "requiresVideo" BOOLEAN NOT NULL DEFAULT true,
    "reviewBufferDays" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "rewardExp" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "condition" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "registerStart" TIMESTAMP(3),
    "registerEnd" TIMESTAMP(3),
    "registerUrl" TEXT,
    "officialUrl" TEXT,
    "status" TEXT NOT NULL,
    "events" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TribePost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrls" TEXT NOT NULL DEFAULT '[]',
    "videoUrl" TEXT,
    "resultRef" TEXT,
    "flames" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TribePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TribeComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TribeComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TribeFlame" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TribeFlame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldRecord" (
    "id" TEXT NOT NULL,
    "cubeType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "timeFormatted" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "holderAvatar" TEXT,
    "holderBio" TEXT,
    "videoUrl" TEXT,
    "formulaReview" TEXT,
    "nation" TEXT NOT NULL DEFAULT '🇨🇳',
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventEntry" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "results" TEXT NOT NULL DEFAULT '[]',
    "finalRank" INTEGER,
    "finalAo5" INTEGER,
    "finalBest" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER,
    "experience" TEXT,
    "goal" TEXT,
    "mainCube" TEXT,
    "trainFreq" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGrowth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "abilityScore" JSONB,
    "pbHistory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGrowth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "memoryType" TEXT NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "missions" TEXT NOT NULL,
    "aiReason" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 80,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coachMessage" TEXT,
    "completionFeedback" TEXT,

    CONSTRAINT "DailyMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCoachPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachType" TEXT NOT NULL DEFAULT 'SUPPORTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCoachPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "speed" INTEGER NOT NULL,
    "cross" INTEGER NOT NULL,
    "f2l" INTEGER NOT NULL,
    "oll" INTEGER NOT NULL,
    "pll" INTEGER NOT NULL,
    "consistency" INTEGER NOT NULL,
    "frequency" INTEGER NOT NULL,
    "growth" INTEGER NOT NULL,
    "growthScore" INTEGER NOT NULL,
    "strongestSkill" TEXT NOT NULL,
    "strongestValue" INTEGER NOT NULL,
    "weakestSkill" TEXT NOT NULL,
    "weakestValue" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "segmentCoverage" INTEGER NOT NULL,
    "solveSampleSize" INTEGER NOT NULL DEFAULT 0,
    "segmentSampleSize" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL,
    "totalSolves" INTEGER NOT NULL,
    "pbMs" INTEGER,
    "avgMs" INTEGER,
    "trend" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL DEFAULT '1.2.0',

    CONSTRAINT "SkillSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembership" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamWeeklyScore" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "TeamWeeklyScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WcaCompetitionCache" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL,
    "cityZh" TEXT NOT NULL DEFAULT '',
    "countryIso2" TEXT NOT NULL DEFAULT 'CN',
    "venue" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "registrationOpen" TIMESTAMP(3),
    "registrationClose" TIMESTAMP(3),
    "wcaUrl" TEXT NOT NULL,
    "eventIds" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WcaCompetitionCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalEventPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "city" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "externalUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocalEventPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_bindCode_key" ON "StudentProfile"("bindCode");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_userId_key" ON "ParentProfile"("userId");

-- CreateIndex
CREATE INDEX "ParentChild_parentId_idx" ON "ParentChild"("parentId");

-- CreateIndex
CREATE INDEX "CourseProgress_userId_idx" ON "CourseProgress"("userId");

-- CreateIndex
CREATE INDEX "FormulaProgress_userId_idx" ON "FormulaProgress"("userId");

-- CreateIndex
CREATE INDEX "SolveResult_userId_createdAt_idx" ON "SolveResult"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SolveResult_createdAt_idx" ON "SolveResult"("createdAt");

-- CreateIndex
CREATE INDEX "SolveResult_activityId_idx" ON "SolveResult"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoVerificationLog_solveResultId_key" ON "VideoVerificationLog"("solveResultId");

-- CreateIndex
CREATE INDEX "TaskRecord_userId_date_idx" ON "TaskRecord"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");

-- CreateIndex
CREATE INDEX "TribePost_userId_createdAt_idx" ON "TribePost"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TribeComment_postId_idx" ON "TribeComment"("postId");

-- CreateIndex
CREATE INDEX "TribeComment_userId_idx" ON "TribeComment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TribeFlame_postId_userId_key" ON "TribeFlame"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventEntry_eventId_userId_key" ON "EventEntry"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGrowth_userId_key" ON "UserGrowth"("userId");

-- CreateIndex
CREATE INDEX "AIMemory_userId_key_idx" ON "AIMemory"("userId", "key");

-- CreateIndex
CREATE INDEX "EventTracking_userId_idx" ON "EventTracking"("userId");

-- CreateIndex
CREATE INDEX "EventTracking_event_idx" ON "EventTracking"("event");

-- CreateIndex
CREATE INDEX "EventTracking_createdAt_idx" ON "EventTracking"("createdAt");

-- CreateIndex
CREATE INDEX "DailyMission_userId_idx" ON "DailyMission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMission_userId_date_key" ON "DailyMission"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserCoachPreference_userId_key" ON "UserCoachPreference"("userId");

-- CreateIndex
CREATE INDEX "SkillSnapshot_userId_date_idx" ON "SkillSnapshot"("userId", "date");

-- CreateIndex
CREATE INDEX "SkillSnapshot_userId_idx" ON "SkillSnapshot"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_userId_key" ON "TeamMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamWeeklyScore_teamId_weekKey_key" ON "TeamWeeklyScore"("teamId", "weekKey");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfile" ADD CONSTRAINT "ParentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCategory" ADD CONSTRAINT "CourseCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CourseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormulaProgress" ADD CONSTRAINT "FormulaProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolveResult" ADD CONSTRAINT "SolveResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolveResult" ADD CONSTRAINT "SolveResult_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoVerificationLog" ADD CONSTRAINT "VideoVerificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoVerificationLog" ADD CONSTRAINT "VideoVerificationLog_solveResultId_fkey" FOREIGN KEY ("solveResultId") REFERENCES "SolveResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskRecord" ADD CONSTRAINT "TaskRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TribePost" ADD CONSTRAINT "TribePost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TribeComment" ADD CONSTRAINT "TribeComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "TribePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TribeComment" ADD CONSTRAINT "TribeComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TribeFlame" ADD CONSTRAINT "TribeFlame_postId_fkey" FOREIGN KEY ("postId") REFERENCES "TribePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TribeFlame" ADD CONSTRAINT "TribeFlame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoachPreference" ADD CONSTRAINT "UserCoachPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamWeeklyScore" ADD CONSTRAINT "TeamWeeklyScore_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
