export function runExpertSystem({ clothes, temperature, weatherData, activity }) {
  const { condition, windSpeed, uvIndex } = weatherData;

  const isRainy  = condition === 'Rain' || condition === 'Drizzle';
  const isSnowy  = condition === 'Snow';
  const isWindy  = windSpeed > 30;
  const isHighUV = uvIndex >= 6;

  const isExtremeCold = temperature < 1;
  const isCold        = temperature >= 1  && temperature < 12;
  const isCool        = temperature >= 12 && temperature < 22;
  const isMild        = temperature >= 22 && temperature < 28;
  const isWarm        = temperature >= 28 && temperature < 35;
  const isHot         = temperature >= 35;

  let minWarmth = 1, maxWarmth = 10;
  let needsWaterproof = false, needsWindproof = false;
  let requiredFormality = 'casual';
  let preferredFormality = 'casual';
  let maxAllowedFormality = 'formal'; // hard ceiling for the activity
  const explanation = [];

  if (isExtremeCold) { minWarmth = 9;  explanation.push('Extreme cold: maximum warmth required (9–10)'); }
  else if (isCold)   { minWarmth = 7;  explanation.push('Very cold: warmth rating 7–9 recommended'); }
  else if (isCool)   { minWarmth = 4;  explanation.push('Cool: warmth rating 4–6 recommended'); }
  else if (isMild)   { minWarmth = 2; maxWarmth = 5; explanation.push('Mild: light to medium warmth (2–5)'); }
  else if (isWarm)   { maxWarmth = 3;  explanation.push('Warm: lightweight clothing preferred (warmth ≤3)'); }
  else if (isHot)    { maxWarmth = 2;  explanation.push('Hot: minimal warmth needed (warmth ≤2)'); }

  if (isRainy || isSnowy) {
    needsWaterproof = true;
    explanation.push(`${isSnowy ? 'Snow' : 'Rain'}: waterproof outerwear required`);
  }
  if (isWindy) {
    needsWindproof = true;
    explanation.push('Wind > 30 km/h: windproof layer needed');
  }

  if (activity === 'casual' || activity === 'outdoor') {
    requiredFormality = 'casual';
    preferredFormality = 'casual';
    maxAllowedFormality = 'casual'; // hard block: no business casual or formal
    if (activity === 'casual') explanation.push('Casual: relaxed clothing only');
    if (activity === 'outdoor') explanation.push('Outdoor: casual and practical clothing');
  }
  if (activity === 'work') {
    requiredFormality = 'business casual';
    preferredFormality = 'business casual';
    maxAllowedFormality = 'formal';
    explanation.push('Work: business casual attire required');
  }
  if (activity === 'formal') {
    requiredFormality = 'business casual';
    preferredFormality = 'formal';
    maxAllowedFormality = 'formal';
    explanation.push('Formal event: business formal attire preferred');
  }
  if (isHighUV) {
    explanation.push('UV index ≥ 6: hat and sunglasses recommended');
  }

  const formalityRank = { casual: 1, 'business casual': 2, formal: 3 };

  const getFormalities = (item) => {
    const f = (item.formalities || [])
      .map((value) => (value || '').toString().trim().toLowerCase())
      // Backward compatibility: legacy "ethnic" items are treated as formal.
      .map((value) => (value === 'ethnic' ? 'formal' : value))
      .filter((value) => formalityRank[value] !== undefined);
    return f.length > 0 ? f : ['casual'];
  };

  // Hard formality filter — exclude items that exceed the activity's max allowed formality
  // and exclude items that dont meet the minimum required formality
  const passesHardFormalityFilter = (item, category) => {
    if (!['top', 'bottom', 'outerwear', 'shoes'].includes(category)) return true;
    const itemFormalities = getFormalities(item);
    const meetsMin = itemFormalities.some(
      f => formalityRank[f] >= formalityRank[requiredFormality]
    );
    const withinMax = itemFormalities.some(
      f => formalityRank[f] <= formalityRank[maxAllowedFormality]
    );
    return meetsMin && withinMax;
  };

  const scoreFormalityFor = (item) => {
    const itemFormalities = getFormalities(item);
    let score = 0, total = 0;

    total++;
    const meetsMin = itemFormalities.some(
      f => formalityRank[f] >= formalityRank[requiredFormality]
    );
    if (meetsMin) score++;

    if (preferredFormality !== requiredFormality) {
      total++;
      const meetsPreferred = itemFormalities.some(
        f => formalityRank[f] >= formalityRank[preferredFormality]
      );
      if (meetsPreferred) score++;
    }

    return { score, total };
  };

  const scoreItem = (item, category) => {
    let score = 0, total = 0;

    // Warmth — weight 1
    total++;
    if (item.warmthRating >= minWarmth && item.warmthRating <= maxWarmth) score++;

    // Weather protection — outerwear only
    if (category === 'outerwear') {
      if (needsWaterproof) {
        total++;
        if (item.weatherProtection === 'waterproof' || item.weatherProtection === 'both') score++;
      }
      if (needsWindproof) {
        total++;
        if (item.weatherProtection === 'windproof' || item.weatherProtection === 'both') score++;
      }
    }

    // Formality
    if (['top', 'bottom', 'outerwear', 'shoes'].includes(category)) {
      const f = scoreFormalityFor(item);
      score += f.score * 2;
      total += f.total * 2;
    }

    if (['hat', 'accessories'].includes(category)) {
      if (activity === 'formal' || activity === 'work') {
        const f = scoreFormalityFor(item);
        score += f.score;
        total += f.total;
      }
    }

    if (isHighUV && category === 'accessories') {
      total++;
      score++;
    }

    return total > 0 ? score / total : 0;
  };

  const categories = ['top', 'bottom', 'outerwear', 'shoes', 'hat', 'accessories'];

  const poolByCategory = {};
  for (const cat of categories) {
    const items = (clothes[cat] || []);
    poolByCategory[cat] = items
      .filter(item => passesHardFormalityFilter(item, cat)) // hard filter first
      .map(item => ({ ...item, _score: scoreItem(item, cat) }))
      .sort((a, b) => b._score - a._score);
  }

  const outfits = [];
  const usedCombos = new Set();

  const pickOutfit = (skipIndex) => {
    const outfit = [];
    for (const cat of categories) {
      const pool = poolByCategory[cat];
      if (pool.length === 0) continue;

      if (cat === 'outerwear' && temperature >= 21 && !needsWaterproof && !needsWindproof) continue;
      if (cat === 'hat' && activity === 'formal') continue;

      if (cat === 'hat' && (activity === 'casual' || activity === 'outdoor')) {
        const hatNeeded = isExtremeCold || isCold || isCool || isHighUV || isRainy || isSnowy;
        if (!hatNeeded) continue;
      }

      if (cat === 'hat' && temperature >= 10) {
        const lightPool = pool.filter(h => h.warmthRating <= 3);
        const mediumPool = pool.filter(h => h.warmthRating > 3 && h.warmthRating <= 5);

        if (lightPool.length > 0) {
          const roll = Math.random();
          const idx = skipIndex[cat] ?? 0;
          if (roll < 0.85 || mediumPool.length === 0) {
            outfit.push(lightPool[idx % lightPool.length]);
          } else {
            outfit.push(mediumPool[idx % mediumPool.length]);
          }
        } else if (mediumPool.length > 0 && Math.random() < 0.15) {
          const idx = skipIndex[cat] ?? 0;
          outfit.push(mediumPool[idx % mediumPool.length]);
        }
        continue;
      }

      const idx = skipIndex[cat] ?? 0;
      const item = pool[idx % pool.length];

      // Only show ties for formal activity
      if (item && cat === 'accessories') {
        const isTie = item.name.toLowerCase().includes('tie') ||
                      item.name.toLowerCase().includes('necktie') ||
                      item.name.toLowerCase().includes('bow tie');
        if (isTie && activity !== 'formal') continue;
      }

      if (item) outfit.push(item);
    }
    return outfit;
  };

  for (let attempt = 0; outfits.length < 10 && attempt < 50; attempt++) {
    const skipIndex = {};
    if (attempt > 0) {
      categories.forEach((cat, ci) => {
        if (attempt % (ci + 2) === 0) skipIndex[cat] = Math.floor(attempt / (ci + 1));
      });
    }
    const items = pickOutfit(skipIndex);
    const key = items.map(i => i.name).join('|');
    if (usedCombos.has(key)) continue;
    usedCombos.add(key);

    const totalScore = items.reduce((s, i) => s + i._score, 0);
    const confidence = items.length > 0 ? Math.round((totalScore / items.length) * 100) : 0;
    outfits.push({ items, confidence, explanation });
  }

  return outfits.sort((a, b) => b.confidence - a.confidence);
}