import bcrypt from "bcrypt";
import prisma from "./src/lib/prisma.js";

async function askQuestion(question) {
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

async function createAdmin() {
  try {
    const name = await askQuestion("Nome do administrador: ");
    const email = await askQuestion("E-mail do administrador: ");
    const password = await askQuestion("Senha do administrador: ");

    if (!name || !email || !password) {
      console.log("❌ Nome, e-mail e senha são obrigatórios.");
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`❌ Já existe um usuário com o e-mail ${email}.`);
      console.log("👉 Tente outro e-mail ou use um cadastro diferente.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("✅ Administrador criado com sucesso!");
    console.log(`Nome: ${admin.name}`);
    console.log(`E-mail: ${admin.email}`);
    console.log(`ID: ${admin.id}`);
  } catch (error) {
    console.error("❌ Erro ao criar administrador:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();