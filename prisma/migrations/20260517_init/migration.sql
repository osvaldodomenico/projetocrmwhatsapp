Loaded Prisma config from prisma.config.ts.

-- CreateTable
CREATE TABLE `grupowhats_users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `password` VARCHAR(255) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'agent',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `grupowhats_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_accounts` (
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`provider`, `providerAccountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_sessions` (
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `grupowhats_sessions_sessionToken_key`(`sessionToken`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_verification_tokens` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    PRIMARY KEY (`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_contacts` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `normalizedPhone` VARCHAR(191) NOT NULL,
    `church` VARCHAR(191) NULL,
    `groupName` VARCHAR(191) NULL,
    `neighborhood` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `avatar` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL DEFAULT 'manual',
    `status` ENUM('ACTIVE', 'INACTIVE', 'FOLLOW_UP', 'NO_RESPONSE', 'INVALID_NUMBER', 'DO_NOT_CONTACT', 'CONVERTED', 'LOST') NOT NULL DEFAULT 'ACTIVE',
    `temperature` ENUM('COLD', 'WARM', 'HOT') NOT NULL DEFAULT 'COLD',
    `score` INTEGER NOT NULL DEFAULT 0,
    `lastContactAt` DATETIME(3) NULL,
    `nextFollowupAt` DATETIME(3) NULL,
    `optOut` BOOLEAN NOT NULL DEFAULT false,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `grupowhats_contacts_normalizedPhone_key`(`normalizedPhone`),
    INDEX `grupowhats_contacts_normalizedPhone_idx`(`normalizedPhone`),
    INDEX `grupowhats_contacts_status_idx`(`status`),
    INDEX `grupowhats_contacts_temperature_idx`(`temperature`),
    INDEX `grupowhats_contacts_church_idx`(`church`),
    INDEX `grupowhats_contacts_groupName_idx`(`groupName`),
    INDEX `grupowhats_contacts_neighborhood_idx`(`neighborhood`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_tags` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#6366f1',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `grupowhats_tags_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_contact_tags` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `grupowhats_contact_tags_contactId_tagId_key`(`contactId`, `tagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_interactions` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `type` ENUM('WHATSAPP', 'CALL', 'VISIT', 'NOTE', 'SYSTEM') NOT NULL DEFAULT 'NOTE',
    `message` TEXT NOT NULL,
    `summary` TEXT NULL,
    `sentiment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `grupowhats_interactions_contactId_idx`(`contactId`),
    INDEX `grupowhats_interactions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_follow_ups` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `assignedTo` VARCHAR(191) NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('PENDING', 'DONE', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `grupowhats_follow_ups_contactId_idx`(`contactId`),
    INDEX `grupowhats_follow_ups_status_idx`(`status`),
    INDEX `grupowhats_follow_ups_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_campaigns` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `messageTemplate` TEXT NOT NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'FINISHED', 'CANCELED') NOT NULL DEFAULT 'DRAFT',
    `scheduledAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `minDelay` INTEGER NOT NULL DEFAULT 20,
    `maxDelay` INTEGER NOT NULL DEFAULT 90,
    `dailyLimit` INTEGER NOT NULL DEFAULT 200,
    `sessionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `grupowhats_campaigns_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_campaign_contacts` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'DELIVERED', 'READ', 'REPLIED', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `sentAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `repliedAt` DATETIME(3) NULL,
    `errorMsg` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `grupowhats_campaign_contacts_campaignId_status_idx`(`campaignId`, `status`),
    UNIQUE INDEX `grupowhats_campaign_contacts_campaignId_contactId_key`(`campaignId`, `contactId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_whatsapp_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'QR_CODE', 'ERROR') NOT NULL DEFAULT 'DISCONNECTED',
    `qrCode` TEXT NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `grupowhats_whatsapp_sessions_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_whatsapp_messages` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `campaignId` VARCHAR(191) NULL,
    `direction` ENUM('INBOUND', 'OUTBOUND') NOT NULL,
    `messageType` ENUM('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'LOCATION', 'STICKER') NOT NULL DEFAULT 'TEXT',
    `body` TEXT NULL,
    `mediaUrl` VARCHAR(191) NULL,
    `externalId` VARCHAR(191) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `failedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `grupowhats_whatsapp_messages_contactId_idx`(`contactId`),
    INDEX `grupowhats_whatsapp_messages_sessionId_idx`(`sessionId`),
    INDEX `grupowhats_whatsapp_messages_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `oldData` JSON NULL,
    `newData` JSON NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `grupowhats_audit_logs_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `grupowhats_audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupowhats_import_logs` (
    `id` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `totalRows` INTEGER NOT NULL,
    `imported` INTEGER NOT NULL DEFAULT 0,
    `updated` INTEGER NOT NULL DEFAULT 0,
    `skipped` INTEGER NOT NULL DEFAULT 0,
    `errors` INTEGER NOT NULL DEFAULT 0,
    `errorDetails` JSON NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `grupowhats_accounts` ADD CONSTRAINT `grupowhats_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `grupowhats_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_sessions` ADD CONSTRAINT `grupowhats_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `grupowhats_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_contact_tags` ADD CONSTRAINT `grupowhats_contact_tags_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `grupowhats_contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_contact_tags` ADD CONSTRAINT `grupowhats_contact_tags_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `grupowhats_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_interactions` ADD CONSTRAINT `grupowhats_interactions_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `grupowhats_contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_interactions` ADD CONSTRAINT `grupowhats_interactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `grupowhats_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_follow_ups` ADD CONSTRAINT `grupowhats_follow_ups_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `grupowhats_contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_follow_ups` ADD CONSTRAINT `grupowhats_follow_ups_assignedTo_fkey` FOREIGN KEY (`assignedTo`) REFERENCES `grupowhats_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_campaigns` ADD CONSTRAINT `grupowhats_campaigns_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `grupowhats_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_campaigns` ADD CONSTRAINT `grupowhats_campaigns_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `grupowhats_whatsapp_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_campaign_contacts` ADD CONSTRAINT `grupowhats_campaign_contacts_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `grupowhats_campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_campaign_contacts` ADD CONSTRAINT `grupowhats_campaign_contacts_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `grupowhats_contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_whatsapp_messages` ADD CONSTRAINT `grupowhats_whatsapp_messages_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `grupowhats_contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_whatsapp_messages` ADD CONSTRAINT `grupowhats_whatsapp_messages_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `grupowhats_whatsapp_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_audit_logs` ADD CONSTRAINT `grupowhats_audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `grupowhats_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupowhats_import_logs` ADD CONSTRAINT `grupowhats_import_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `grupowhats_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

