import React from "react";
import CmsContent from "../../CmsContent"; // <-- 1. IMPORT CmsContent

function MaterialHeader({ material }) {
  // Image logic remains the same
  const displayImage =
    (material.bannerImageUrl && material.bannerImageUrl.trim() !== "")
      ? material.bannerImageUrl
      : (material.fileUrl && material.fileUrl.trim() !== "")
      ? material.fileUrl
      : (material.image && material.image.trim() !== ""
        ? material.image
        : "https://placehold.co/1200x800/e5e7eb/4b5563?text=Image");

  return (
    <div className="w-full pt-12 sm:pt-16">
      <div className="w-full mb-12 sm:mb-16">
        <img
          src={displayImage}
          alt={material.title}
          className="w-full h-auto rounded-2xl object-cover"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
        {/* Left side: Title, Description, etc. (No changes here) */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {material.title}
          </h2>

          <p className="text-gray-500 text-sm">
            Created on:{" "}
            {material.createdAt
              ? new Date(material.createdAt).toLocaleDateString()
              : "N/A"}
          </p>

          {material.updatedAt && material.createdAt !== material.updatedAt && (
            <p className="text-gray-500 text-sm">
              Last updated:{" "}
              {new Date(material.updatedAt).toLocaleDateString()}
            </p>
          )}

          {material.author && (
            <p className="text-gray-500 text-sm">
              Author: {material.author}
            </p>
          )}

          <p className="text-gray-800 text-lg font-semibold">
            {material.description}
          </p>
        </div>

        {/* --- MODIFICATION START --- */}
        {/* Right side: CMS-managed Sidebar Box */}
        <div className="w-full border-4 border-dashed border-red-300 p-6 rounded-2xl bg-white self-start">
          
          {/* 2. Replace H3 with CmsContent */}
          <CmsContent
            slug="material-sidebar-title"
            as="h3"
            prose={false}
            className="text-xl font-bold text-gray-800 mb-3"
          >
            Ideas y sugerencias para la clase {/* Fallback title */}
          </CmsContent>

          {/* 3. Replace P with CmsContent */}
          <CmsContent
            slug="material-sidebar-content"
            as="div" /* Use 'div' or 'p' */
            prose={true} /* Use prose for rich text styling */
            className="text-gray-700 text-base leading-relaxed"
          >
            {/* Fallback content */}
            Additional notes or suggestions related to this material can be
            displayed here. This section can also be powered by a field from
            your admin panel in the future.
          </CmsContent>

        </div>
        {/* --- MODIFICATION END --- */}

      </div>
    </div>
  );
}

export default MaterialHeader;