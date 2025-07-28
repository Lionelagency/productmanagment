-- CreateTable
CREATE TABLE `file_remarks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `text` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fileId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `file_remarks` ADD CONSTRAINT `file_remarks_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_remarks` ADD CONSTRAINT `file_remarks_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
