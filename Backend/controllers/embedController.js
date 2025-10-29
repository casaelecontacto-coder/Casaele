import Embed from '../models/Embed.js'

export async function createEmbed(req, res) {
  try {
    const { title, type, embedCode } = req.body
    if (!title || !type || !embedCode) {
      return res.status(400).json({ message: 'title, type and embedCode are required' })
    }
    const embed = await Embed.create({ title, type, embedCode })
    return res.status(201).json(embed)
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'Server Error' })
  }
}

export async function getEmbeds(req, res) {
  try {
    const { pageContext } = req.query; // Get context from query param
    const filter = {};
    if (pageContext) {
      filter.pageContext = pageContext;
    }
    // Add pageContext to find query
    const items = await Embed.find(filter).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'Server Error' });
  }
}

export async function updateEmbed(req, res) {
  try {
    const { id } = req.params
    const { title, type, embedCode } = req.body
    const updated = await Embed.findByIdAndUpdate(
      id,
      { $set: { title, type, embedCode } },
      { new: true, runValidators: true }
    )
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


