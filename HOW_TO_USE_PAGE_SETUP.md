# "How to Use" CMS Page Setup Guide

## Overview

The "How to Use" page is now a fully editable CMS page that you can manage from the admin panel. It's automatically linked in the footer under the "Support" section.

## Setup Instructions

### Step 1: Create the Initial Page

Run the seed script to create the default "How to Use" page:

```bash
cd Backend
node scripts/seedHowToUsePage.js
```

This will create a new CMS page with:
- **Title:** How to Use Casa De ELE
- **Slug:** how-to-use
- **URL:** /page/how-to-use
- **Default Content:** A comprehensive guide with sections on rooms, courses, shopping, newsletter, and tips

### Step 2: Verify the Page

1. Visit your frontend: `http://localhost:5173/page/how-to-use`
2. You should see the "How to Use" guide with styled content
3. The footer "How to Use" link should navigate to this page

### Step 3: Customize from Admin Panel

1. **Login to Admin Panel:**
   - Go to: `http://localhost:5173/admin/login`
   - Login with your admin credentials

2. **Navigate to CMS:**
   - Click "CMS Pages" in the sidebar
   - Find "How to Use Casa De ELE" in the list

3. **Edit the Page:**
   - Click the Edit button (pencil icon)
   - Modify the content using the rich text editor
   - Add images or change the banner image
   - Add interactive embeds if needed
   - Save your changes

## Features

### ✅ Fully Editable
- Edit content from the admin panel
- No need to modify code
- Changes appear immediately on the frontend

### ✅ Rich Content Support
- HTML formatting
- Images and media
- H5P embeds for interactive content
- Responsive design

### ✅ SEO Friendly
- Clean URL structure: `/page/how-to-use`
- Auto-generated slugs
- Proper metadata support

## Content Structure

The default page includes these sections:

1. **Welcome Message** - Introduction to Casa De ELE
2. **Exploring the Rooms** - How to browse and use learning rooms
3. **Taking Courses** - Guide to enrolling and accessing courses
4. **Shopping for Digital Products** - Complete shopping and download guide
5. **Newsletter & Updates** - Subscription benefits
6. **Payment & Digital Delivery** - Security and delivery information
7. **Tips for Success** - Best practices for learning
8. **Need Help?** - Support contact information

## Customization Tips

### Adding Images

1. Upload images via the image upload field in the CMS editor
2. Or embed images directly in the HTML content:
   ```html
   <img src="your-image-url" alt="Description" style="width: 100%; max-width: 600px; border-radius: 8px;" />
   ```

### Styling Content

Use inline styles that match the Casa De ELE theme:

```html
<!-- Red headings -->
<h2 style="color: #AD1518; margin-bottom: 20px;">Section Title</h2>

<!-- Info boxes -->
<div style="padding: 20px; background-color: #FEF2F2; border-left: 4px solid #AD1518; border-radius: 8px;">
  <p>Important information here</p>
</div>

<!-- Highlighted text -->
<span style="background-color: #FEF2F2; padding: 2px 8px; border-radius: 4px;">Highlighted</span>
```

### Adding Interactive Elements

You can embed H5P content or other interactive elements:

1. Create an embed in the Embeds section
2. Select it in the "Second Section Embed" dropdown when editing the CMS page
3. The embed will appear above the main content

## Frontend Display

The page uses the existing CMS page template with:
- Responsive design
- Clean typography
- Shadow and border styling
- Mobile-friendly layout
- Matching Casa De ELE theme (red accents)

## Troubleshooting

### Page Not Found
- **Issue:** 404 error when visiting /page/how-to-use
- **Solution:** Run the seed script to create the page

### Content Not Updating
- **Issue:** Changes in admin don't appear on frontend
- **Solution:** Clear browser cache or check if caching is enabled in ApiCacheContext

### Styling Issues
- **Issue:** Content looks unstyled
- **Solution:** The CMS page uses Tailwind's `prose` classes. Ensure your HTML has proper structure.

## Managing the Page Long-Term

### Regular Updates
- Update content seasonally or when features change
- Add new sections as the platform grows
- Include screenshots or videos for better clarity

### Best Practices
- Keep instructions clear and concise
- Use bullet points and numbered lists
- Break content into digestible sections
- Add visual elements to enhance understanding
- Test on mobile devices

### Version Control
- The content is stored in the database, not in code
- Consider backing up important CMS pages regularly
- Export page content before major changes

## Integration with Other Features

The "How to Use" page automatically covers:
- ✅ Digital product delivery system
- ✅ Newsletter subscription
- ✅ Beehive integration
- ✅ Download limits and expiry
- ✅ Payment security
- ✅ Course enrollment

Update the page content when you add new features!

## Support

If you need to recreate the page:
1. Delete it from admin panel (if it exists)
2. Run the seed script again: `node scripts/seedHowToUsePage.js`
3. The default content will be restored

## Next Steps

1. ✅ Run the seed script to create the page
2. ✅ Visit /page/how-to-use to verify it works
3. ✅ Customize content from admin panel
4. ✅ Add images or videos if needed
5. ✅ Test on mobile and desktop
6. ✅ Share the link with users!

---

**Page URL:** `/page/how-to-use`
**Admin Edit URL:** `/admin/cms` → Find "How to Use Casa De ELE" → Click Edit

The footer link is already updated and ready to use! 🎉
