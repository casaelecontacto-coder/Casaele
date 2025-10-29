import { useEffect } from 'react';

export default function DisableContextMenu() {
  useEffect(() => {
    const handleContextMenu = (event) => {
      if (event.target.tagName === 'IMG' || event.target.tagName === 'VIDEO') {
        event.preventDefault();
      }
      event.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return null; 
}