import Credentials from "@auth/core/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./src/db/index";
import { accounts, sessions, users, verificationTokens } from "./src/db/schema";
import { defineConfig } from "auth-astro";
import { eq } from "drizzle-orm";

import Google from "@auth/core/providers/google";

export default defineConfig({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "tu@email.com" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // Buscamos el usuario en la BD
        const userResult = await db.select().from(users).where(eq(users.email, credentials.email as string)).limit(1);
        const user = userResult[0];

        if (!user) return null;

        // Para esta prueba, comprobamos el password en texto plano. 
        // ¡En producción usaríamos bcrypt u otro hasheo!
        if (user.password !== credentials.password) return null;

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
});
