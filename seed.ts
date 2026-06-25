import { db } from "./src/db/index.js";
import { users } from "./src/db/schema.js";

async function main() {
  try {
    console.log("Creando usuario de prueba...");
    await db.insert(users).values({
      id: crypto.randomUUID(),
      name: "Jaime Admin",
      email: "admin@januscore.pro",
      password: "password123",
      image: "",
    });
    console.log("¡Usuario creado con éxito!");
    process.exit(0);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    process.exit(1);
  }
}

main();
