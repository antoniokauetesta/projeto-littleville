import prisma from "../lib/prisma.js";

// GET /sightings — listar todos os avistamentos
export async function listSightings(req, res) {
  try {
    const sightings = await prisma.sighting.findMany({
      include: {
        user: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(sightings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar avistamentos" });
  }
}

// GET /sightings/:id — buscar um avistamento por ID
export async function getSighting(req, res) {
  try {
    const { id } = req.params;
    const sighting = await prisma.sighting.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!sighting) {
      return res.status(404).json({ error: "Avistamento não encontrado" });
    }

    return res.json(sighting);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar avistamento" });
  }
}

// POST /sightings/:id/comments — criar comentário em um avistamento
export async function createComment(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Escreva algo antes de enviar o comentário." });
    }

    const sighting = await prisma.sighting.findUnique({
      where: { id: Number(id) },
    });

    if (!sighting) {
      return res.status(404).json({ error: "Avistamento não encontrado" });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        sightingId: Number(id),
        userId: req.userId,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar comentário" });
  }
}

// POST /sightings — criar um novo avistamento
export async function createSighting(req, res) {
  try {
    const { title, description, lat, lng } = req.body;

    if (!title || !description || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Preencha todos os campos (title, description, lat, lng)" });
    }

    const sighting = await prisma.sighting.create({
      data: {
        title,
        description,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        userId: req.userId,
      },
    });

    return res.status(201).json(sighting);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar avistamento" });
  }
}

// PUT /sightings/:id — atualizar um avistamento
export async function updateSighting(req, res) {
  try {
    const { id } = req.params;
    const { title, description, lat, lng } = req.body;

    const existing = await prisma.sighting.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: "Avistamento não encontrado" });
    }

    if (existing.userId !== req.userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Você não tem permissão para editar este avistamento" });
    }

    const sighting = await prisma.sighting.update({
      where: { id: Number(id) },
      data: {
        title: title || existing.title,
        description: description || existing.description,
        lat: lat !== undefined ? parseFloat(lat) : existing.lat,
        lng: lng !== undefined ? parseFloat(lng) : existing.lng,
      },
    });

    return res.json(sighting);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar avistamento" });
  }
}

// DELETE /sightings/:id — deletar um avistamento
export async function deleteSighting(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.sighting.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: "Avistamento não encontrado" });
    }

    if (existing.userId !== req.userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Você não tem permissão para deletar este avistamento" });
    }

    await prisma.sighting.delete({ where: { id: Number(id) } });

    return res.json({ message: "Avistamento deletado com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao deletar avistamento" });
  }
}

// GET /sightings/stats — estatísticas para o dashboard
export async function getStats(req, res) {
  try {
    const totalSightings = await prisma.sighting.count();
    const totalUsers = await prisma.user.count();

    const recentSightings = await prisma.sighting.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });

    return res.json({
      totalSightings,
      totalUsers,
      recentSightings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
}
