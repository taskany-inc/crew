ALTER TABLE "User" ADD CONSTRAINT "User_bonusPoints_positive" CHECK ("bonusPoints" >= 0);
