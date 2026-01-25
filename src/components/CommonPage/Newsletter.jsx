import React, { useEffect } from "react";

const Newsletter = () => {
  useEffect(() => {
    // Load Beehiiv embed script
    const script = document.createElement('script');
    script.src = 'https://subscribe-forms.beehiiv.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://subscribe-forms.beehiiv.com/embed.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <section id="newsletter" className="py-20 px-8 bg-[#FDF2F2] text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-4xl font-bold text-gray-800 mb-4">
          Stay Updated with Ele's Newsletters
        </h2>
        <p className="text-gray-500 mb-10 max-w-md mx-auto">
          Get weekly Spanish tips, new content updates, and exclusive resources
          delivered to your inbox!
        </p>

        {/* Beehiiv Subscription Form */}
        <div className="flex flex-col items-center justify-center gap-4 max-w-xl mx-auto">
          <iframe
            src="https://subscribe-forms.beehiiv.com/d64078b6-51f1-4490-8080-7da9acf3dbf5"
            className="beehiiv-embed"
            data-test-id="beehiiv-embed"
            frameBorder="0"
            scrolling="no"
            style={{
              width: '563px',
              height: '318px',
              margin: 0,
              borderRadius: '0px',
              backgroundColor: 'transparent',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              maxWidth: '100%'
            }}
          />
        </div>
      </div>

    </section>
  );
};

export default Newsletter;
