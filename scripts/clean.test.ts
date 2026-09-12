import { cleanRows } from './clean-and-seed';

describe('cleanRows', () => {
  it('cleans state typos and flags missing states', () => {
    const rawData = [
      { name: 'St1', lat: '10', lng: '76', state: 'Keral', connector_type: 'CCS2', power_kw: '50' },
      { name: 'St2', lat: '10', lng: '76', state: 'uttar pradesh', connector_type: 'CCS2', power_kw: '50' },
      { name: 'St3', lat: '10', lng: '76', state: '', connector_type: 'CCS2', power_kw: '50' },
    ];

    const cleaned = cleanRows(rawData);
    
    expect(cleaned[0].state).toBe('Kerala');
    expect(cleaned[0].needsReview).toBe(false);

    expect(cleaned[1].state).toBe('Uttar Pradesh');
    expect(cleaned[1].needsReview).toBe(false);

    expect(cleaned[2].state).toBe('');
    expect(cleaned[2].needsReview).toBe(true);
  });

  it('flags Unknown connector types', () => {
    const rawData = [
      { name: 'St1', lat: '10', lng: '76', state: 'Kerala', connector_type: 'Unknown', power_kw: '50' },
    ];

    const cleaned = cleanRows(rawData);
    expect(cleaned[0].needsReview).toBe(true);
  });

  it('imputes power_kw using median per connector type', () => {
    const rawData = [
      { name: 'S1', lat: '10', lng: '76', state: 'Kerala', connector_type: 'Type2', power_kw: '10' },
      { name: 'S2', lat: '10', lng: '76', state: 'Kerala', connector_type: 'Type2', power_kw: '30' },
      { name: 'S3', lat: '10', lng: '76', state: 'Kerala', connector_type: 'Type2', power_kw: '20' }, // Median will be 20
      { name: 'S4', lat: '10', lng: '76', state: 'Kerala', connector_type: 'Type2', power_kw: '' }, // Should be 20
    ];

    const cleaned = cleanRows(rawData);
    expect(cleaned[3].powerKw).toBe(20);
    expect(cleaned[3].isImputed).toBe(true);
  });

  it('trims leading and trailing whitespaces', () => {
    const rawData = [
      { name: '  Space Station  ', city: ' Kochi ', lat: '10', lng: '76', state: 'Kerala', connector_type: 'Type2', power_kw: '10' },
    ];

    const cleaned = cleanRows(rawData);
    expect(cleaned[0].name).toBe('Space Station');
    expect(cleaned[0].city).toBe('Kochi');
  });
});
