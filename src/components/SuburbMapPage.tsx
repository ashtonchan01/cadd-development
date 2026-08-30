import { useState } from 'react';

type PriceType = 'house' | 'unit';

const URLS: Record<PriceType, string> = {
  house: 'https://property.carto.au/sydney/house-prices/by-suburb/map',
  unit: 'https://property.carto.au/sydney/unit-prices/by-suburb/map',
};

export function SuburbMapPage() {
  const [type, setType] = useState<PriceType>('house');

  return (
    <div className="suburb-map-page">
      <div className="card">
        <div className="map-page-header">
          <div>
            <h2>Suburb price trends</h2>
            <p className="hint">
              Live map from{' '}
              <a href={URLS[type]} target="_blank" rel="noreferrer">property.carto.au ↗</a>
              {' '}— weekly-updated median sale prices, Sydney metro only. If it shows blank, that site is
              blocking iframe embedding; use the link instead.
            </p>
          </div>
          <div className="map-toggle">
            <button type="button" className={type === 'house' ? 'toggle-active' : 'toggle'} onClick={() => setType('house')}>House prices</button>
            <button type="button" className={type === 'unit' ? 'toggle-active' : 'toggle'} onClick={() => setType('unit')}>Unit prices</button>
          </div>
        </div>
        <div className="map-embed map-embed-large">
          <iframe src={URLS[type]} title="Sydney median prices by suburb" loading="lazy" />
        </div>
      </div>
    </div>
  );
}
