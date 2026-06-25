import { db } from "./src/db/index.js";
import { users } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  try {
    console.log("Actualizando contraseña del usuario...");
    await db.update(users)
      .set({ password: "danro32676" })
      .where(eq(users.email, "admin@januscore.pro"));
    console.log("¡Contraseña actualizada con éxito!");
    process.exit(0);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    process.exit(1);
  }
}

main();
