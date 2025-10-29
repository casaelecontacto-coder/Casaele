import FormSubmission from '../models/FormSubmission.js'
import ExcelJS from 'exceljs'

export async function submitForm(req, res) {
  try {
    const { name, email, message } = req.body
    if (!name || !email) return res.status(400).json({ message: 'name and email are required' })
    console.log('[forms] incoming submission:', { name, email, message })
    const doc = await FormSubmission.create({ name, email, message })
    console.log('[forms] saved submission id:', doc._id)
    res.status(201).json(doc)
  } catch (err) {
    // Log full stack for debugging
    console.error('[forms] submitForm error:', err && err.stack ? err.stack : err)
    // Provide more details in non-production for debugging convenience
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ message: 'Failed to save form', error: err?.message || String(err) })
    }
    res.status(500).json({ message: 'Failed to save form' })
  }
}

export async function listForms(req, res) {
  try {
    // If paginated request (page/limit/search/status), return paginated object
    const { page, limit, search, status } = req.query;
    if (page || limit || search || status) {
      const pageNum = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 10;
      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }
      if (status) {
        query.status = status;
      }
      const total = await FormSubmission.countDocuments(query);
      const forms = await FormSubmission.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize);
      const totalPages = Math.ceil(total / pageSize) || 1;
      return res.json({ forms, totalPages });
    } else {
      // Default: return all forms as array (for legacy/Forms.jsx)
      const items = await FormSubmission.find().sort({ createdAt: -1 });
      console.log('[forms] listForms returning', items.length, 'items');
      res.json(items);
    }
  } catch (err) {
    console.error('[forms] listForms error:', err && err.stack ? err.stack : err);
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ message: 'Failed to list forms', error: err?.message || String(err) });
    }
    res.status(500).json({ message: 'Failed to list forms' });
  }
}

export async function exportFormsExcel(req, res) {
  try {
    const items = await FormSubmission.find().sort({ createdAt: -1 })
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Form Submissions')
    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Message', key: 'message', width: 50 },
      { header: 'Created At', key: 'createdAt', width: 24 },
    ]
    items.forEach((x) => {
      sheet.addRow({
        name: x.name,
        email: x.email,
        message: x.message || '',
        createdAt: x.createdAt?.toISOString() || '',
      })
    })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="form_submissions.xlsx"')
    await workbook.xlsx.write(res)
    res.end()
  } catch (err) {
    res.status(500).json({ message: 'Export failed' })
  }
}

// Secure debug: return recent submissions when a secret debug key header matches
export async function getRecentDebug(req, res) {
  try {
    const key = req.headers['x-debug-key'] || ''
    if (!process.env.DEBUG_KEY || key !== process.env.DEBUG_KEY) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    const limit = parseInt(req.query.limit, 10) || 20
    const items = await FormSubmission.find().sort({ createdAt: -1 }).limit(limit)
    res.json({ count: items.length, items })
  } catch (err) {
    console.error('[forms] getRecentDebug error:', err)
    res.status(500).json({ message: 'Failed to fetch recent forms' })
  }
}


