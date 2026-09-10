const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "info@thewebsensei.email";
  const password = "asdf_1234";

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // Upsert the user so it doesn't fail if they already exist
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN", // Admin role gives them both customer shopping and admin dashboard access
      allowCredit: true, // Give them credit capability as requested in the plan
      allowPickup: true,
    },
    create: {
      email,
      name: "The Web Sensei",
      passwordHash,
      role: "ADMIN",
      allowCredit: true,
      allowPickup: true,
    },
  });

  console.log("Seeding complete! Admin/Customer user created:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
