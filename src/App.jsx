import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Header from './components/Header';
import ActionButton from './components/ActionButton';
import OutfitCard from './components/OutfitCard';
import OutfitPreview from './components/OutfitPreview';
import Modal from './components/Modal';
import ActivitySelector from './components/ActivitySelector';
import DeleteItemModal from './components/DeleteItemModal';
import { saveToIndexedDB, getFromIndexedDB } from './utils/indexedDB';
import { runExpertSystem } from './utils/expertSystem';
import { PRELOAD_WARDROBE } from './utils/preloadData';
import { predictClothingAttributes } from './utils/mlPredict';

const EMPTY_ITEM = {
  category: 'top', name: '', warmthRating: 5,
  weatherProtection: 'none', formalities: [],
  image: null
};
const PREDICTION_CONFIDENCE_THRESHOLD = 65;

const SmartOutfitSelector = () => {
  const [temperature, setTemperature] = useState(null);
  const [city, setCity] = useState('Dubai');
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [activity, setActivity] = useState('casual');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY_ITEM);
  const [imagePreview, setImagePreview] = useState(null);
  const [clothes, setClothes] = useState({
    hat: [], top: [], bottom: [], outerwear: [], shoes: [], accessories: []
  });
  const [recommendations, setRecommendations] = useState([]);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [predictionState, setPredictionState] = useState({
    loading: false,
    error: '',
    confidence: null,
    confidenceByHead: null,
    needsReview: false
  });

  useEffect(() => { loadClothes(); }, []);
  useEffect(() => { fetchWeather(); }, [city]);
  useEffect(() => {
    if (temperature !== null && weatherData) generateRecommendations();
  }, [temperature, weatherData, clothes, activity]);

  useEffect(() => {
    setSelectedOutfit(null);
  }, [activity]);

  useEffect(() => {
    if (recommendations.length > 0) setSelectedOutfit(recommendations[0].outfits[0]);
  }, [recommendations]);

  const loadClothes = async () => {
    try {
      const stored = await getFromIndexedDB('outfitClothes');
      if (stored) setClothes({
        hat: [], top: [], bottom: [], outerwear: [], shoes: [], accessories: [],
        ...stored
      });
    } catch (e) { console.error(e); }
  };

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey) throw new Error('Missing OpenWeather API key');

      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
      if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
      const data = await res.json();
      if (data.main) {
        setTemperature(Math.round(data.main.temp));
        setCity(data.name);
        const { lat, lon } = data.coord;
        const uvRes = await fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        if (!uvRes.ok) throw new Error(`UV request failed (${uvRes.status})`);
        const uvData = await uvRes.json();
        setWeatherData({
          condition: data.weather[0]?.main || 'Clear',
          windSpeed: Math.round(data.wind?.speed * 3.6),
          uvIndex: Math.round(uvData.value ?? 0)
        });
      }
    } catch (e) {
      console.warn('Using fallback weather values:', e);
      setTemperature(25);
      setWeatherData({ condition: 'Clear', windSpeed: 10, uvIndex: 3 });
    }
    setLoading(false);
  };

  const changeCity = (newCity) => {
    setCity(newCity); setWeatherData(null); setTemperature(null);
  };

  const generateRecommendations = () => {
    const allItems = Object.values(clothes).flat();
    if (allItems.length === 0) { setRecommendations([]); return; }

    const results = runExpertSystem({ clothes, temperature, weatherData, activity });

    const groups = [];
    results.forEach(outfit => {
      const existing = groups.find(g => g.confidence === outfit.confidence);
      if (existing) {
        existing.outfits.push(outfit);
      } else {
        groups.push({ confidence: outfit.confidence, outfits: [outfit] });
      }
    });

    const top3 = groups
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    setRecommendations(top3);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setNewItem(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);

    setPredictionState({
      loading: true,
      error: '',
      confidence: null,
      confidenceByHead: null,
      needsReview: false
    });
    try {
      const prediction = await predictClothingAttributes(file);
      const confidence = prediction?.confidence ?? null;
      const confidenceByHead = prediction?.confidenceByHead ?? null;
      const needsReview = confidence !== null && confidence < PREDICTION_CONFIDENCE_THRESHOLD;
      setPredictionState({
        loading: false,
        error: '',
        confidence,
        confidenceByHead,
        needsReview
      });

      setNewItem(prev => ({
        ...prev,
        category: prediction?.mapped?.category ?? prev.category,
        warmthRating: prediction?.mapped?.warmthRating ?? prev.warmthRating,
        formalities: prediction?.mapped?.formalities ?? prev.formalities
      }));
    } catch (error) {
      setPredictionState({
        loading: false,
        error: 'Model unavailable. Please fill details manually.',
        confidence: null,
        confidenceByHead: null,
        needsReview: false
      });
      console.error(error);
    }
  };

  const addItemToCloset = async () => {
    if (!newItem.name.trim()) return;
    const updated = {
      ...clothes,
      [newItem.category]: [...(clothes[newItem.category] ?? []), { ...newItem }]
    };
    setClothes(updated);
    try { await saveToIndexedDB('outfitClothes', updated); }
    catch (e) { console.error(e); }
    setShowAddModal(false);
    setNewItem(EMPTY_ITEM);
    setImagePreview(null);
    setPredictionState({
      loading: false,
      error: '',
      confidence: null,
      confidenceByHead: null,
      needsReview: false
    });
  };

  const preloadCloset = async () => {
    setClothes(PRELOAD_WARDROBE);
    try { await saveToIndexedDB('outfitClothes', PRELOAD_WARDROBE); }
    catch (e) { console.error(e); }
  };

  const deleteItem = async (category, itemName) => {
    const updated = {
      ...clothes,
      [category]: clothes[category].filter(i => i.name !== itemName)
    };
    setClothes(updated);
    try { await saveToIndexedDB('outfitClothes', updated); }
    catch (e) { console.error(e); }
  };

  const hasClothes = Object.values(clothes).some(arr => arr.length > 0);

  return (
    <div
      style={{ minHeight: '100vh', background: '#f5f5f7', padding: '40px 20px' }}
      aria-label="WeatherFit application"
    >
      <div style={{ maxWidth: selectedOutfit ? '1000px' : '600px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>

        <Header
          city={city} temperature={temperature}
          loading={loading} weatherData={weatherData}
          onCityChange={changeCity}
        />

        <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
          <ActionButton onClick={() => setShowAddModal(true)} variant="secondary">
            <Plus size={18} /> Add Item
          </ActionButton>
          <button
            onClick={preloadCloset}
            style={{
              height: '50px',
              padding: '0 16px',
              flexShrink: 0,
              background: 'white',
              border: '1px solid #d2d2d7',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#86868b',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#133f63';
              e.currentTarget.style.color = '#133f63';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#d2d2d7';
              e.currentTarget.style.color = '#86868b';
            }}
          >
            Preload Closet
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              width: '50px',
              height: '50px',
              flexShrink: 0,
              background: 'white',
              border: '1px solid #d2d2d7',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#133f63'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#d2d2d7'}
          >
            <Trash2 size={18} color="#1d1d1f" />
          </button>
        </div>

        <ActivitySelector activity={activity} setActivity={setActivity} />

        <div style={{
          marginTop: '32px', display: 'grid',
          gridTemplateColumns: selectedOutfit ? '1fr 340px' : '1fr',
          gap: '24px', alignItems: 'start',
          transition: 'grid-template-columns 0.3s ease'
        }}>
          <div>
            {!hasClothes ? (
              <div style={{
                background: 'white', borderRadius: '16px', padding: '48px 32px',
                textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠︎</div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1d1d1f', marginBottom: '8px' }}>
                  Your closet is empty
                </h2>
                <p style={{ color: '#86868b', marginBottom: '0' }}>
                  Add clothing items to get outfit recommendations
                </p>
              </div>
            ) : recommendations.length === 0 ? (
              <div style={{
                background: 'white', borderRadius: '16px', padding: '32px',
                textAlign: 'center', color: '#86868b'
              }}>
                Generating recommendations...
              </div>
            ) : (
              recommendations.map((group, i) => (
                <OutfitCard
                  key={i}
                  outfits={group.outfits}
                  rank={i + 1}
                  selected={selectedOutfit && group.outfits.includes(selectedOutfit)}
                  onSelect={(outfit) => setSelectedOutfit(outfit)}
                />
              ))
            )}
          </div>

          {selectedOutfit && (
            <div style={{ position: 'sticky', top: '24px' }}>
              <OutfitPreview outfit={selectedOutfit} />
            </div>
          )}
        </div>
      </div>

      <Modal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={addItemToCloset}
        newItem={newItem}
        setNewItem={setNewItem}
        imagePreview={imagePreview}
        onImageUpload={handleImageUpload}
        predictionState={predictionState}
      />

      <DeleteItemModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        clothes={clothes}
        onDelete={deleteItem}
      />
    </div>
  );
};

export default SmartOutfitSelector;