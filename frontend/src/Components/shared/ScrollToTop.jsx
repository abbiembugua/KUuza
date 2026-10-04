import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Skip scroll-to-top when the URL contains a deep-link anchor (e.g. a
    // notification that targets a specific transaction card). The transaction
    // card handles its own scrollIntoView after data loads.
    const params = new URLSearchParams(search);
    if (params.has('transaction')) return;

    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
