// Backend/controllers/chapterController.js
import Chapter from '../models/Chapter.js';
import Embed from '../models/Embed.js';

// @route   POST /api/chapters
// @desc    Create a new chapter
// @access  Admin only
export async function createChapter(req, res) {
  try {
    const { name, description, order } = req.body;
    const createdBy = req.user?.email || req.user?.uid || 'unknown';

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Chapter name is required'
      });
    }

    // Check for duplicate name
    const existing = await Chapter.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A chapter with this name already exists'
      });
    }

    const chapter = new Chapter({
      name: name.trim(),
      description: description?.trim() || '',
      order: order || 0,
      createdBy
    });

    await chapter.save();

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      chapter
    });
  } catch (error) {
    console.error('Create chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// @route   GET /api/chapters
// @desc    Get all chapters with embed counts
// @access  Public
export async function getAllChapters(req, res) {
  try {
    const { includeInactive } = req.query;

    const filter = includeInactive === 'true' ? {} : { isActive: true };

    const chapters = await Chapter.find(filter).sort({ order: 1, createdAt: -1 });

    // Get embed counts for each chapter
    const chaptersWithCounts = await Promise.all(
      chapters.map(async (chapter) => {
        const embedCount = await Embed.countDocuments({ chapterId: chapter._id });
        return {
          ...chapter.toObject(),
          embedCount
        };
      })
    );

    res.status(200).json({
      success: true,
      chapters: chaptersWithCounts
    });
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// @route   GET /api/chapters/:id
// @desc    Get single chapter with its embeds
// @access  Public
export async function getChapterById(req, res) {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const embeds = await Embed.find({ chapterId: id }).sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      chapter: {
        ...chapter.toObject(),
        embeds
      }
    });
  } catch (error) {
    console.error('Get chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// @route   PUT /api/chapters/:id
// @desc    Update a chapter
// @access  Admin only
export async function updateChapter(req, res) {
  try {
    const { id } = req.params;
    const { name, description, order, isActive } = req.body;

    const chapter = await Chapter.findById(id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check for duplicate name (excluding current chapter)
    if (name && name.trim() !== chapter.name) {
      const existing = await Chapter.findOne({ name: name.trim(), _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A chapter with this name already exists'
        });
      }
    }

    // Update fields
    if (name !== undefined) chapter.name = name.trim();
    if (description !== undefined) chapter.description = description.trim();
    if (order !== undefined) chapter.order = order;
    if (isActive !== undefined) chapter.isActive = isActive;

    await chapter.save();

    res.status(200).json({
      success: true,
      message: 'Chapter updated successfully',
      chapter
    });
  } catch (error) {
    console.error('Update chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// @route   DELETE /api/chapters/:id
// @desc    Delete a chapter (and optionally its embeds)
// @access  Admin only
export async function deleteChapter(req, res) {
  try {
    const { id } = req.params;
    const { deleteEmbeds } = req.query;

    const chapter = await Chapter.findById(id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const embedCount = await Embed.countDocuments({ chapterId: id });

    if (deleteEmbeds === 'true') {
      // Delete all embeds in this chapter
      await Embed.deleteMany({ chapterId: id });
    } else if (embedCount > 0) {
      // Set embeds to have no chapter (move to uncategorized)
      await Embed.updateMany({ chapterId: id }, { $set: { chapterId: null } });
    }

    await Chapter.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Chapter deleted successfully. ${deleteEmbeds === 'true' ? embedCount + ' embeds deleted.' : embedCount + ' embeds moved to uncategorized.'}`,
      deletedEmbedsCount: deleteEmbeds === 'true' ? embedCount : 0,
      movedEmbedsCount: deleteEmbeds === 'true' ? 0 : embedCount
    });
  } catch (error) {
    console.error('Delete chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// @route   POST /api/chapters/:id/reorder
// @desc    Reorder chapters
// @access  Admin only
export async function reorderChapters(req, res) {
  try {
    const { orders } = req.body; // Array of { id, order }

    if (!Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request format'
      });
    }

    // Update all chapter orders in a transaction-like manner
    const updatePromises = orders.map(({ id, order }) =>
      Chapter.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Chapters reordered successfully'
    });
  } catch (error) {
    console.error('Reorder chapters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// @route   GET /api/chapters/:id/export
// @desc    Export chapter embeds to JSON (for Excel conversion on frontend)
// @access  Admin only
export async function exportChapterData(req, res) {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const embeds = await Embed.find({ chapterId: id }).sort({ order: 1, createdAt: -1 });

    // Prepare data for export
    const exportData = {
      chapterName: chapter.name,
      chapterDescription: chapter.description,
      exportDate: new Date().toISOString(),
      totalEmbeds: embeds.length,
      embeds: embeds.map((embed, index) => ({
        sNo: index + 1,
        title: embed.title,
        type: embed.type,
        embedCode: embed.embedCode,
        pageContext: embed.pageContext || 'general',
        order: embed.order,
        createdAt: embed.createdAt,
        updatedAt: embed.updatedAt,
        id: embed._id
      }))
    };

    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}
