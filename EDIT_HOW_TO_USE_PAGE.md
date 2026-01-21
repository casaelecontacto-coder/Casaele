# How to Edit the "How to Use" Page from Admin Panel

## Quick Steps

### 1. Run the Seed Script (First Time Only)

```bash
cd Backend
npm run seed:how-to-use
```

This creates the initial page with default content.

---

### 2. Access Admin Panel

1. Open your browser
2. Go to: `http://localhost:5173/admin/login`
3. Login with your admin credentials

---

### 3. Navigate to CMS Pages

**Option A: Direct URL**
- Go to: `http://localhost:5173/admin/cms`

**Option B: Using Sidebar**
1. Look at the left sidebar
2. Click on **"CMS Pages"**

---

### 4. Find the "How to Use" Page

In the CMS Pages list, scroll down to the **"Standalone Pages"** section.

You'll see:
```
┌─────────────────────────────────────────────────────────────────┐
│ Standalone Pages                                                 │
├─────────────────────────────────────────────────────────────────┤
│ About Us Page (Text/Main Image)                    [Edit] ────→ │
│ About - Where Ele Is Now Image                     [Edit] ────→ │
│ About - Garden Section (Image/Text)                [Edit] ────→ │
│ How to Use Casa De ELE                             [Edit] ────→ │  ← HERE!
│   Complete guide for using the platform - linked in footer...   │
│ Privacy Policy Page                                [Edit] ────→ │
│ Terms & Conditions Page                            [Edit] ────→ │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Click the Edit Button

Click the **[Edit]** button next to "How to Use Casa De ELE"

---

### 6. Edit the Content

You'll see a form with these fields:

#### A. **Title** (Required)
```
┌──────────────────────────────────────────────┐
│ Title *                                      │
│ ┌──────────────────────────────────────────┐ │
│ │ How to Use Casa De ELE                   │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

#### B. **Slug** (Required - for URL)
```
┌──────────────────────────────────────────────┐
│ Slug *                                       │
│ ┌──────────────────────────────────────────┐ │
│ │ how-to-use                               │ │
│ └──────────────────────────────────────────┘ │
│ This will be the URL: /page/how-to-use      │
└──────────────────────────────────────────────┘
```
⚠️ **Don't change this!** The footer link is already set to `/page/how-to-use`

#### C. **Content** (Rich Text Editor)
```
┌──────────────────────────────────────────────┐
│ Content                                      │
│ ┌──────────────────────────────────────────┐ │
│ │ [TinyMCE Rich Text Editor]               │ │
│ │                                          │ │
│ │ Edit your content here...                │ │
│ │ - Add headings                           │ │
│ │ - Format text (bold, italic, etc.)       │ │
│ │ - Add bullet points & numbered lists     │ │
│ │ - Insert links                           │ │
│ │ - Change colors                          │ │
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Editor Features:**
- Toolbar with formatting options
- Visual editor (WYSIWYG)
- HTML source view (click `<>` button)
- Drag & drop support

#### D. **Image URL** (Optional)
```
┌──────────────────────────────────────────────┐
│ Image URL                                    │
│ ┌──────────────────────────────────────────┐ │
│ │ https://...                              │ │
│ └──────────────────────────────────────────┘ │
│ [Choose File] [Upload Image]                │
└──────────────────────────────────────────────┘
```
Upload a banner image for the top of the page (optional)

#### E. **Second Section Embed** (Optional)
```
┌──────────────────────────────────────────────┐
│ Second Section Embed                         │
│ ┌──────────────────────────────────────────┐ │
│ │ [Select an H5P embed or interactive]     │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```
Add interactive H5P content if needed

---

### 7. Save Your Changes

Click the **[Save]** button at the bottom of the form.

You'll see a confirmation: "CMS page saved successfully!"

---

### 8. View Your Changes

**Frontend URL:** `http://localhost:5173/page/how-to-use`

Or click **"How to Use"** in the footer.

---

## Editing Tips

### Adding Sections

Use the rich text editor to add new sections:

```html
<h2 style="color: #AD1518; margin-top: 30px;">New Section Title</h2>
<p>Your content here...</p>
```

### Styling Tips

**Red Headings (Casa De ELE theme):**
```html
<h2 style="color: #AD1518;">Heading</h2>
```

**Info Boxes:**
```html
<div style="padding: 20px; background-color: #FEF2F2; border-left: 4px solid #AD1518; border-radius: 8px;">
  <p><strong>Important:</strong> Your message</p>
</div>
```

**Bullet Lists:**
```html
<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>
```

**Numbered Lists:**
```html
<ol>
  <li>Step one</li>
  <li>Step two</li>
  <li>Step three</li>
</ol>
```

### Using the HTML Source View

1. Click the `<>` button in the toolbar
2. Edit the raw HTML
3. Click `<>` again to go back to visual mode

This is useful for:
- Adding custom styling
- Copying content from the default
- Fine-tuning layouts

---

## Common Edits

### Update Shopping Instructions

Find the "Shopping for Digital Products" section and edit:
- Download limits (currently 3 downloads)
- Expiry days (currently 30 days)
- Payment methods
- Support email

### Add New Features

When you add new features to Casa De ELE:
1. Edit the "How to Use" page
2. Add a new section describing the feature
3. Include step-by-step instructions
4. Save and publish

### Update Contact Information

Find the "Need Help?" section and update:
- Support email
- Contact form link
- Social media links

---

## Troubleshooting

### "Page not found" when editing
- **Solution:** Run the seed script first: `npm run seed:how-to-use`

### Changes don't appear on frontend
- **Solution:** Clear browser cache or hard refresh (Ctrl+F5 / Cmd+Shift+R)

### Can't find the page in CMS list
- **Solution:** The page was added to line 54 of CMSList.jsx. Refresh the admin panel.

### Editor not loading
- **Solution:** Check browser console for errors. TinyMCE may need time to load.

---

## Default Content Structure

The seed script creates this structure:

1. Welcome Message
2. 🏠 Exploring the Rooms
3. 📚 Taking Courses
4. 🛍️ Shopping for Digital Products
5. 📧 Newsletter & Updates
6. 💳 Payment & Digital Delivery
7. 🎯 Tips for Success
8. ❓ Need Help?

You can:
- ✅ Edit any section
- ✅ Add new sections
- ✅ Remove sections
- ✅ Reorder content
- ✅ Change styling

---

## Quick Reference

| Action | Location |
|--------|----------|
| Edit page | `/admin/cms` → "How to Use Casa De ELE" → Edit |
| View page | `/page/how-to-use` |
| Footer link | Footer → Support → "How to Use" |
| Reset to default | Delete page from admin, run seed script again |

---

## Summary

✅ **To Edit:**
1. Go to `/admin/cms`
2. Find "How to Use Casa De ELE" in Standalone Pages
3. Click [Edit]
4. Make your changes in the rich text editor
5. Click [Save]
6. View at `/page/how-to-use`

✅ **Remember:**
- Don't change the slug (`how-to-use`)
- Use red color (#AD1518) for headings
- Test on mobile after major changes
- Clear cache if changes don't appear

---

**That's it!** You now have full control over the "How to Use" page content from your admin panel. 🎉
