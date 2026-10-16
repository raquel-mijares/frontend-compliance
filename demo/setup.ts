import { ConsentState } from '../src/consent';
import { TagLoader } from '../src/loader';
import { TagRegistry, type AudienceContext } from '../src/contexts';
import { defineMetaQueue } from './meta-queue';

const registry = new TagRegistry();
registry.register(
  {
    id: 'ga4',
    category: 'analytics',
    src: 'https://www.googletagmanager.com/gtag/js?id=G-DEMO',
  },
  ['general'],
);
registry.register(
  {
    id: 'meta',
    category: 'advertising',
    src: 'https://connect.facebook.net/en_US/fbevents.js',
  },
  ['general'],
);

export const audience: AudienceContext =
  new URLSearchParams(location.search).get('audience') === 'kids' ? 'kids' : 'general';

export const tags = registry.for(audience);

defineMetaQueue();

export const consent = new ConsentState();
export const loader = new TagLoader(consent, tags);
loader.start();
