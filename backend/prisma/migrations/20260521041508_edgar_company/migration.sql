-- CreateTable
CREATE TABLE "EdgarCompany" (
    "id" TEXT NOT NULL,
    "cik" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EdgarCompany_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EdgarCompany_cik_key" ON "EdgarCompany"("cik");

-- CreateIndex
CREATE UNIQUE INDEX "EdgarCompany_ticker_key" ON "EdgarCompany"("ticker");
