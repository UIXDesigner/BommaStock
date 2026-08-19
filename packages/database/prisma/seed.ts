// Relative import avoids a packages/auth ↔ packages/database dependency cycle.
// Seed still uses the shared Argon2id helper.
import { hashPassword } from "../../auth/src/password";

loadEnv({ path: resolve(import.meta.dirname, "../../../.env") });
loadEnv({ path: resolve(import.meta.dirname, "../../../.env.local") });

const MIN_PASSWORD_LENGTH = 10;

async function seed(): Promise<void> {
  const env = getEnv();
  if (!env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Seed is blocked until a real connection string is provided.",
    );
  }

  const prisma = createPrismaClient(env.DATABASE_URL);

  try {
    const existingLicense = await prisma.license.findUnique({
      where: { code: "STANDARD" },
    });
    if (!existingLicense) {
      await prisma.license.create({
        data: {
          code: "STANDARD",
          name: "Standard License",
          status: "ACTIVE",
          sortOrder: 0,
        },
      });
      console.log("Seeded license STANDARD.");
    } else {
      console.log("License STANDARD already exists.");
    }

    const taxRateCount = await prisma.taxRate.count();
    if (taxRateCount === 0) {
      const hasConfiguredRate = env.TAX_RATE_BPS !== undefined;
      await prisma.taxRate.create({
        data: {
          name: "GST",
          rateBps: env.TAX_RATE_BPS ?? 0,
          status: hasConfiguredRate ? "ACTIVE" : "INACTIVE",
          currency: "INR",
        },
      });
      if (hasConfiguredRate) {
        console.log(`Seeded ACTIVE GST TaxRate at ${env.TAX_RATE_BPS} bps.`);
      } else {
        console.log(
          "Seeded INACTIVE GST TaxRate (rateBps 0). Checkout will return TAX_NOT_CONFIGURED until an ACTIVE rate is configured. Do not invent 18%.",
        );
      }
    } else {
      console.log(
        "TaxRate row(s) already exist; leaving tax configuration unchanged.",
      );
    }

    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    const bootstrapEmail = env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    const bootstrapPassword = env.ADMIN_BOOTSTRAP_PASSWORD;

    if (!bootstrapEmail || !bootstrapPassword) {
      console.log(
        "Skipping admin bootstrap (ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD not set).",
      );
      return;
    }

    if (adminCount > 0 && !env.ADMIN_BOOTSTRAP_ALLOW_ADDITIONAL) {
      throw new Error(
        "Refusing to create an admin: an ADMIN user already exists. Set ADMIN_BOOTSTRAP_ALLOW_ADDITIONAL=true only for documented emergencies.",
      );
    }

    if (bootstrapPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `ADMIN_BOOTSTRAP_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
    }

    await prisma.user.create({
      data: {
        email: bootstrapEmail,
        passwordHash: await hashPassword(bootstrapPassword),
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log(`Seeded bootstrap admin ${bootstrapEmail}.`);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
