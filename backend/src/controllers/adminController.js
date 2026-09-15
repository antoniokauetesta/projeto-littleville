import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}

export async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { sightings: true } } },
    });
    return res.json(users.map((user) => ({ ...publicUser(user), sightingsCount: user._count.sightings })));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar usuários" });
  }
}

export async function updateUser(req, res) {
  try {
    const id = Number(req.params.id);
    const { name, email, password, role } = req.body;

    if (!name || !email || !["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "Nome, e-mail e papel válido são obrigatórios" });
    }

    const emailOwner = await prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== id) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    const data = { name, email, role };
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({ where: { id }, data });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
}

export async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (id === req.userId) {
      return res.status(400).json({ error: "O administrador não pode excluir a própria conta" });
    }

    await prisma.user.delete({ where: { id } });
    return res.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao excluir usuário" });
  }
}

export async function deleteSightingAsAdmin(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.sighting.delete({ where: { id } });
    return res.json({ message: "Avistamento excluído com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao excluir avistamento" });
  }
}
