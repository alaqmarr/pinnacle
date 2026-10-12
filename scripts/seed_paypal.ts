import { prisma } from "../lib/prisma";

async function main() {
  const paypalData = {
    paypalEnabled: true,
    paypalSandboxMode: true,
    paypalSandboxClientId: "AYCbiJZNLJ-2xxu8BzBoJdN09yIgNOveWMfkkkgBdMZBR5kPWye2gY1d1jjwQdgRoPMdf4SKK7hAVVai",
    paypalSandboxClientSecret: "EHJpNnvtSQhXYWTilZ7j6JO9_E8pxOvVtiTxLTBgKzDznVzKTQ6voFMM7lIOVSGlkPO1Oqa8XNAhRVvd",
    paypalSandboxAppId: "WEBAPPTEST",
  };

  const updated = await prisma.globalSetting.upsert({
    where: { id: "singleton" },
    update: paypalData,
    create: {
      id: "singleton",
      companyName: "Pinnacle Distributing",
      contactEmail: "info@pinnacledistributing.com",
      contactPhone: "(800) 555-0199",
      address: "1234 Industrial Parkway, Suite 100, Dallas, TX 75201",
      hours: "Monday - Friday: 8:00 AM - 5:00 PM CST",
      ...paypalData,
    },
  });

  console.log("Successfully seeded PayPal settings in dev.db:");
  console.log({
    id: updated.id,
    paypalEnabled: updated.paypalEnabled,
    paypalSandboxMode: updated.paypalSandboxMode,
    paypalSandboxClientId: updated.paypalSandboxClientId,
    paypalSandboxAppId: updated.paypalSandboxAppId,
    hasSecret: Boolean(updated.paypalSandboxClientSecret),
  });
}

main()
  .catch((err) => {
    console.error("Error seeding PayPal settings:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
