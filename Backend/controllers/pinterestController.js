import axios from 'axios';
import * as cheerio from 'cheerio';

// Pinterest public API endpoints (limited but free)
const PINTEREST_API_BASE = 'https://api.pinterest.com/v1';

export async function fetchPinterestInfo(req, res) {
  try {
    const { url } = req.body;
    
    if (!url || !url.includes('pinterest.com')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid Pinterest URL is required' 
      });
    }

    // Extract pin ID or board ID from URL
    const pinMatch = url.match(/pinterest\.com\/pin\/(\d+)/);
    const boardMatch = url.match(/pinterest\.com\/([^\/]+)\/([^\/]+)/);
    
    let pinData = null;

    if (pinMatch) {
      // Fetch individual pin data
      pinData = await fetchPinData(pinMatch[1]);
    } else if (boardMatch) {
      // Fetch board data
      pinData = await fetchBoardData(boardMatch[1], boardMatch[2]);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid Pinterest URL format'
      });
    }

    if (!pinData) {
      return res.status(404).json({
        success: false,
        message: 'Could not fetch Pinterest data'
      });
    }

    res.json({
      success: true,
      data: pinData
    });

  } catch (error) {
    console.error('Pinterest fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Pinterest data',
      error: error.message
    });
  }
}

export async function savePinterestData(req, res) {
  try {
    const { title, type, embedCode, imageUrl, sourceUrl, description } = req.body;
    
    if (!title || !type || !embedCode) {
      return res.status(400).json({
        success: false,
        message: 'Title, type, and embed code are required'
      });
    }

    // Import here to avoid circular dependency
    const PinterestEmbed = (await import('../models/PinterestEmbed.js')).default;
    
    const pinterestData = await PinterestEmbed.create({
      title,
      type,
      embedCode,
      imageUrl: imageUrl || null,
      sourceUrl: sourceUrl || null,
      description: description || null
    });

    res.status(201).json({
      success: true,
      data: pinterestData
    });

  } catch (error) {
    console.error('Pinterest save error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save Pinterest data',
      error: error.message
    });
  }
}

export async function getPinterestData(req, res) {
  try {
    const PinterestEmbed = (await import('../models/PinterestEmbed.js')).default;
    const data = await PinterestEmbed.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Pinterest fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Pinterest data',
      error: error.message
    });
  }
}

export async function updatePinterestData(req, res) {
  try {
    const { id } = req.params;
    const { title, type, embedCode, imageUrl, sourceUrl, description } = req.body;
    
    const PinterestEmbed = (await import('../models/PinterestEmbed.js')).default;
    
    const updated = await PinterestEmbed.findByIdAndUpdate(
      id,
      { title, type, embedCode, imageUrl, sourceUrl, description },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Pinterest data not found'
      });
    }

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('Pinterest update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Pinterest data',
      error: error.message
    });
  }
}

export async function deletePinterestData(req, res) {
  try {
    const { id } = req.params;
    
    const PinterestEmbed = (await import('../models/PinterestEmbed.js')).default;
    
    const deleted = await PinterestEmbed.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Pinterest data not found'
      });
    }

    res.json({
      success: true,
      message: 'Pinterest data deleted successfully'
    });

  } catch (error) {
    console.error('Pinterest delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete Pinterest data',
      error: error.message
    });
  }
}

// Helper functions
async function fetchPinData(pinId) {
  try {
    // Pinterest doesn't have a public API for individual pins
    // We'll scrape the pin page for metadata
    const response = await axios.get(`https://www.pinterest.com/pin/${pinId}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Extract metadata from JSON-LD or meta tags
    const jsonLd = $('script[type="application/ld+json"]').html();
    let metadata = {};
    
    if (jsonLd) {
      try {
        metadata = JSON.parse(jsonLd);
      } catch (e) {
        console.log('Could not parse JSON-LD');
      }
    }

    // Fallback to meta tags
    const title = metadata.name || $('meta[property="og:title"]').attr('content') || 'Pinterest Pin';
    const description = metadata.description || $('meta[property="og:description"]').attr('content') || '';
    const imageUrl = metadata.image || $('meta[property="og:image"]').attr('content') || '';
    
    // Generate Pinterest embed code
    const embedCode = `<a data-pin-do="embedPin" data-pin-id="${pinId}" href="https://www.pinterest.com/pin/${pinId}/"></a><script async defer src="//assets.pinterest.com/js/pinit.js"></script>`;

    return {
      title,
      description,
      imageUrl,
      sourceUrl: `https://www.pinterest.com/pin/${pinId}/`,
      embedCode,
      type: 'pin'
    };

  } catch (error) {
    console.error('Error fetching pin data:', error);
    return null;
  }
}

async function fetchBoardData(username, boardName) {
  try {
    const response = await axios.get(`https://www.pinterest.com/${username}/${boardName}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    const title = $('meta[property="og:title"]').attr('content') || `${username}'s ${boardName} Board`;
    const description = $('meta[property="og:description"]').attr('content') || '';
    const imageUrl = $('meta[property="og:image"]').attr('content') || '';
    
    // Generate Pinterest board embed code
    const embedCode = `<a data-pin-do="embedBoard" data-pin-board-width="400" data-pin-scale-height="240" data-pin-scale-width="80" href="https://www.pinterest.com/${username}/${boardName}/"></a><script async defer src="//assets.pinterest.com/js/pinit.js"></script>`;

    return {
      title,
      description,
      imageUrl,
      sourceUrl: `https://www.pinterest.com/${username}/${boardName}/`,
      embedCode,
      type: 'board'
    };

  } catch (error) {
    console.error('Error fetching board data:', error);
    return null;
  }
}
