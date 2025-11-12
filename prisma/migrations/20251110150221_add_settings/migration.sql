-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopName" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "themeColor" TEXT DEFAULT '#3c8dbc',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
