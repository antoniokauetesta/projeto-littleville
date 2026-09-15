import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { authSecret } from "../lib/authSecret.js";

function createToken(userId) {
  return jwt.sign({ id: userId }, authSecret, { expiresIn: "7d" });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// POST /auth/register
export async function register(req, res) {
  try {
    const { name, email, password, isAdmin } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Preencha todos os campos" });
    }

    if (isAdmin) {
      return res.status(403).json({ error: "A conta de administrador deve ser criada pelo responsável do sistema" });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });

    if (userExists) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = createToken(user.id);

    return res.status(201).json({
      user: publicUser(user),
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// POST /auth/login
export async function login(req, res) {
  try {
    const { email, password, isAdmin } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Preencha todos os campos" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    if (isAdmin && user.role !== "ADMIN") {
      return res.status(403).json({ error: "Esta conta não possui acesso administrativo" });
    }

    if (!isAdmin && user.role === "ADMIN") {
      return res.status(403).json({ error: "Marque a opção de administrador para entrar nesta conta" });
    }

    const token = createToken(user.id);

    return res.json({
      user: publicUser(user),
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// PUT /auth/profile
export async function updateProfile(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Nome e e-mail são obrigatórios" });
    }

    const emailOwner = await prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== req.userId) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    const data = { name, email };
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({ where: { id: req.userId }, data });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
}
