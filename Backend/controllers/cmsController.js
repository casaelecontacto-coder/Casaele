import CmsPage from '../models/CmsPage.js'

export async function createCmsPage(req, res) {
  try {
    // ++ Add 'secondSectionEmbed' ++
    const { title, slug, content, imageUrl, secondSectionEmbed } = req.body
    if (!title) return res.status(400).json({ message: 'title is required' })
    const page = await CmsPage.create({ title, slug, content, imageUrl, secondSectionEmbed: secondSectionEmbed || null })
    res.status(201).json(page)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create CMS page' })
  }
}

export async function getCmsPages(req, res) {
  try {
    // ++ Add populate here ++
    const pages = await CmsPage.find().sort({ createdAt: -1 }).populate('secondSectionEmbed');
    res.json(pages)
  } catch {
    res.status(500).json({ message: 'Failed to list CMS pages' })
  }
}

export async function getCmsPageById(req, res) {
  try {
    // ++ Add populate here ++
    const page = await CmsPage.findById(req.params.id).populate('secondSectionEmbed');
    if (!page) return res.status(404).json({ message: 'Not found' })
    res.json(page)
  } catch {
    res.status(500).json({ message: 'Failed to fetch CMS page' })
  }
}

export async function getCmsPageBySlug(req, res) {
  try {
    // ++ Add populate here (This is the one 'About.jsx' will use) ++
    const page = await CmsPage.findOne({ slug: req.params.slug }).populate('secondSectionEmbed');
    if (!page) return res.status(404).json({ message: 'Not found' })
    res.json(page)
  } catch {
    res.status(500).json({ message: 'Failed to fetch CMS page by slug' })
  }
}

export async function updateCmsPage(req, res) {
  try {
    // ++ Add 'secondSectionEmbed' ++
    const { title, slug, content, imageUrl, secondSectionEmbed } = req.body
    const updated = await CmsPage.findByIdAndUpdate(
      req.params.id,
      // ++ Add 'secondSectionEmbed' to update object ++
      { title, slug, content, imageUrl, secondSectionEmbed: secondSectionEmbed || null },
      { new: true, runValidators: true }
    )
    // ++ Add populate here to return the full updated object ++
    .populate('secondSectionEmbed'); 
    
    if (!updated) return res.status(404).json({ message: 'Not found' })
    res.json(updated)
  } catch(err) { // Add error logging
    console.error("Error updating CMS Page:", err);
    res.status(500).json({ message: 'Failed to update CMS page' });
  }
}

export async function deleteCmsPage(req, res) {
  // ... (this function remains the same)
  try {
    const deleted = await CmsPage.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Failed to delete CMS page' })
  }
}