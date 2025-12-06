import React from 'react';

// Simple component to render HTML or plain text safely
const HtmlRenderer = ({ htmlString }) => {
  // A basic check to see if the string contains HTML tags
  const isHtml = /<[a-z][\s\S]*>/i.test(htmlString);

  if (isHtml) {
    // If it looks like HTML, render it as HTML
    return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
  }
  
  // Otherwise, render it as pre-formatted text to preserve line breaks
  return <p className="text-gray-700 whitespace-pre-wrap">{htmlString}</p>;
};

const DetailedInfo = ({ description, instructor }) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
      
      {/* Description Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
          About this Product
        </h3>

        {/* CSS to make iframes responsive within the description */}
        <style>{`
          .prose iframe {
            width: 100%;
            height: auto;
            aspect-ratio: 16 / 9;
            border-radius: 0.5rem;
            margin-top: 1rem;
            margin-bottom: 1rem;
          }
        `}</style>
        
        {description ? (
          <div className="prose prose-lg max-w-none text-gray-700">
            <HtmlRenderer htmlString={description} />
          </div>
        ) : (
          <p className="text-gray-600">No description available for this product.</p>
        )}
      </div>

      {/* Instructor Section (Conditional) */}
      {instructor && (
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Meet the Instructor
          </h3>
          <div className="flex items-center gap-4">
            <img 
              src={instructor.imageUrl || 'https://via.placeholder.com/100'} 
              alt={instructor.name || 'Instructor'} 
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <h4 className="text-lg font-semibold text-gray-800">{instructor.name}</h4>
              <p className="text-gray-600">{instructor.bio}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DetailedInfo;