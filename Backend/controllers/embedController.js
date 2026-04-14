import Embed from '../models/Embed.js'
import Chapter from '../models/Chapter.js'

export async function createEmbed(req, res) {
  try {
    const { title, type, embedCode, chapterId, order } = req.body
    if (!title || !type || !embedCode) {
      return res.status(400).json({ message: 'title, type and embedCode are required' })
    }

    // Validate chapter if provided
    if (chapterId) {
      const chapter = await Chapter.findById(chapterId)
      if (!chapter) {
        return res.status(400).json({ message: 'Invalid chapter ID' })
      }
    }

    const embed = await Embed.create({
      title,
      type,
      embedCode,
      chapterId: chapterId || null,
      order: order || 0
    })

    return res.status(201).json(embed)
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'Server Error' })
  }
}

export async function getEmbeds(req, res) {
  try {
    const { pageContext, chapterId, all } = req.query;
    const filter = {};
    if (all !== 'true') {
      filter.isActive = { $ne: false };
    }

    if (pageContext) {
      filter.pageContext = pageContext;
    }

    if (chapterId) {
      if (chapterId === 'uncategorized') {
        filter.chapterId = null;
      } else {
        filter.chapterId = chapterId;
      }
    }

    const items = await Embed.find(filter)
      .populate('chapterId', 'name description')
      .sort({ order: 1, createdAt: -1 });

    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'Server Error' });
  }
}

export async function updateEmbed(req, res) {
  try {
    const { id } = req.params
    const { title, type, embedCode, chapterId, order } = req.body

    // Validate chapter if provided
    if (chapterId && chapterId !== 'null') {
      const chapter = await Chapter.findById(chapterId)
      if (!chapter) {
        return res.status(400).json({ message: 'Invalid chapter ID' })
      }
    }

    const updateData = { title, type, embedCode };

    if (chapterId !== undefined) {
      updateData.chapterId = chapterId === 'null' ? null : chapterId;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    const updated = await Embed.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('chapterId', 'name description')

    if (!updated) return res.status(404).json({ message: 'Embed not found' })
    return res.json(updated)
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'Server Error' })
  }
}

export async function deleteEmbed(req, res) {
  try {
    const { id } = req.params
    const deleted = await Embed.findByIdAndDelete(id)
    if (!deleted) return res.status(404).json({ message: 'Embed not found' })
    return res.json({ message: 'Deleted' })
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'Server Error' })
  }
}


