// src/pages/admin/CMSList.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiSend } from '../../utils/api';
import { FiFileText, FiEdit, FiRefreshCw, FiHome, FiShield, FiBriefcase, FiMail, FiLayout, FiShoppingBag, FiMap, FiFeather, FiBookOpen } from 'react-icons/fi'; // <-- Added FiBookOpen for Material icon

// A structured list of all editable content blocks on the website.
const editablePages = [
  // Home Page
  { group: 'Home Page', name: 'Hero Section (Students) - Title', slug: 'home-hero-students-title', description: 'The headline for the "Spanish For Students" card.' },
  { group: 'Home Page', name: 'Hero Section (Students) - Description', slug: 'home-hero-students-desc', description: 'The paragraph for the "Spanish For Students" card.' },
  { group: 'Home Page', name: 'Hero Section (Teachers) - Title', slug: 'home-hero-teachers-title', description: 'The headline for the "Teacher Material" card.' },
  { group: 'Home Page', name: 'Hero Section (Teachers) - Description', slug: 'home-hero-teachers-desc', description: 'The paragraph for the "Teacher Material" card.' },
  { group: 'Home Page', name: 'Welcome Section - Title', slug: 'home-welcome-title', description: 'The "Welcome to Ele’s House" title.' },
  { group: 'Home Page', name: 'Welcome Section - Description', slug: 'home-welcome-desc', description: 'The paragraph below the welcome title.' },
  { group: 'Home Page', name: 'Experience Spanish - Title', slug: 'home-experience-title', description: 'The "We help you experience Spanish!" title.' },
  { group: 'Home Page', name: 'Experience Spanish - Description', slug: 'home-experience-desc', description: 'The long description on the Experience Spanish section.' },

  // School Page
  { group: 'School Page', name: 'School Hero - Title', slug: 'school-hero-title', description: 'The main title on the School page hero section.' },
  { group: 'School Page', name: 'School Hero - Description', slug: 'school-hero-desc', description: 'The paragraph on the School page hero section.' },

  // Shop Page
  { group: 'Shop Page', name: 'Shop Banner - Title', slug: 'shop-banner-title', description: 'The main title on the Shop page banner.' },
  { group: 'Shop Page', name: 'Shop Banner - Description', slug: 'shop-banner-desc', description: 'The paragraph on the Shop page banner.' },

  // Contact Page
  { group: 'Contact Page', name: 'Contact Intro', slug: 'contact-intro-p', description: 'The introductory paragraph on the Contact Us page.' },

  // --- NEW ENTRIES FOR MATERIAL PAGE ---
  {
    group: 'Material Page',
    name: 'Material Sidebar Title',
    slug: 'material-sidebar-title',
    description: 'The title in the sidebar box on the material detail page.',
    editorType: "text" // Use plain text editor
  },
  {
    group: 'Material Page',
    name: 'Material Sidebar Content',
    slug: 'material-sidebar-content',
    description: 'The content in the sidebar box on the material detail page.',
    editorType: "rich" // Use rich text editor
  },
  // --- END NEW ENTRIES ---

  // Standalone Pages
  { group: 'Standalone Pages', name: 'About Us Page (Text/Main Image)', slug: 'about-us', description: 'The main content and mascot image for the /about page.' },
  // *** NEW ENTRIES FOR ABOUT PAGE IMAGES ***
  { group: 'Standalone Pages', name: 'About - Where Ele Is Now Image', slug: 'about-where-ele-map-image', description: 'The map image on the "Where is Ele Now?" section. Set an Image URL only.' },
  { group: 'Standalone Pages', name: 'About - Garden Section (Image/Text)', slug: 'about-garden-section-content', description: 'The content block and image for the "El jardín de ideas" section.' },
  // *** END NEW ENTRIES ***
  { group: 'Standalone Pages', name: 'Privacy Policy Page', slug: 'privacy-policy', description: 'Full content for the /privacy-policy page.' },
  { group: 'Standalone Pages', name: 'Terms & Conditions Page', slug: 'terms-and-conditions', description: 'Full content for the /terms-and-conditions page.' },
];

export default function CMSList() {
  const [cmsEntries, setCmsEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCmsEntries = () => {
    setLoading(true);
    apiGet('/api/cms')
      .then(setCmsEntries)
      .catch(() => setCmsEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCmsEntries();
  }, []);

  const handleEditClick = async (page) => {
    const existingEntry = cmsEntries.find(entry => entry.slug === page.slug);
    if (existingEntry) {
      // Pass editorType to the edit page via state
      navigate(`/admin/cms/edit/${existingEntry._id}`, { state: { editorType: page.editorType } });
    } else {
      try {
        const newEntry = await apiSend('/api/cms', 'POST', {
          title: page.name,
          slug: page.slug,
          content: `<h1 class="text-3xl font-bold">Default Title</h1><p>Start editing the ${page.name} content here.</p>`,
        });
        // Pass editorType to the edit page via state
        navigate(`/admin/cms/edit/${newEntry._id}`, { state: { editorType: page.editorType } });
      } catch (error) {
        alert("Could not create the page for editing. Please try again.");
      }
    }
  };
  
  const groupedPages = editablePages.reduce((acc, page) => {
    acc[page.group] = acc[page.group] || [];
    acc[page.group].push(page);
    return acc;
  }, {});

  const getGroupIcon = (groupName) => {
    if (groupName.includes('Home')) return <FiHome className="w-5 h-5" />;
    if (groupName.includes('School')) return <FiBriefcase className="w-5 h-5" />;
    if (groupName.includes('Shop')) return <FiShoppingBag className="w-5 h-5" />;
    if (groupName.includes('Contact')) return <FiMail className="w-5 h-5" />;
    if (groupName.includes('Standalone')) return <FiLayout className="w-5 h-5" />;
    if (groupName.includes('Material')) return <FiBookOpen className="w-5 h-5" />; // <-- Added icon for Material
    return <FiFileText className="w-5 h-5" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Content Management</h1>
        <button onClick={fetchCmsEntries} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
        Select a content block from the list below to edit. Your changes will appear on the live website immediately after saving.
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading content list...</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedPages).sort(([groupA], [groupB]) => groupA.localeCompare(groupB)).map(([groupName, pages]) => ( // Added sort to keep groups alpha
            <div key={groupName}>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gray-100 p-2 rounded-md text-gray-600">{getGroupIcon(groupName)}</div>
                <h2 className="text-xl font-semibold text-gray-800">{groupName}</h2>
              </div>
              <div className="space-y-3">
                {pages.map((page) => (
                  <div key={page.slug} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:border-red-300 transition-colors">
                    <div>
                      <h3 className="font-medium text-gray-800">{page.name}</h3>
                      <p className="text-sm text-gray-500">{page.description}</p>
                    </div>
                    <button onClick={() => handleEditClick(page)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-50 text-red-700 hover:bg-red-100 font-medium transition">
                      <FiEdit className="w-4 h-4" /> Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}