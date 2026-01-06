const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.property.findMany({
    select: { id: true, tenantId: true },
  });

  for (const property of properties) {
    const rooms = await prisma.room.findMany({
      where: { propertyId: property.id },
      orderBy: { createdAt: "asc" },
    });

    let defaultRoom = rooms[0];
    if (!defaultRoom) {
      defaultRoom = await prisma.room.create({
        data: {
          tenantId: property.tenantId,
          propertyId: property.id,
          name: "Default Room",
          description: "Default room for this property.",
          amenities: [],
          isActive: true,
        },
      });
      console.log(`Created default room for property ${property.id}`);
    }

    await prisma.reservation.updateMany({
      where: { propertyId: property.id, roomId: null },
      data: { roomId: defaultRoom.id },
    });

    await prisma.availabilityBlock.updateMany({
      where: { propertyId: property.id, roomId: null },
      data: { roomId: defaultRoom.id },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
