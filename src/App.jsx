import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Header from './components/Header';
import ActionButton from './components/ActionButton';
import OutfitCard from './components/OutfitCard';
import OutfitPreview from './components/OutfitPreview';
import Modal from './components/Modal';
import ActivitySelector from './components/ActivitySelector';
import DeleteItemModal from './components/DeleteItemModal';
import TopNav from './components/TopNav';
import AuthModal from './components/AuthModal';
import { runExpertSystem } from './utils/expertSystem';
import { PRELOAD_WARDROBE } from './utils/preloadData';
import { predictClothingAttributes } from './utils/mlPredict';
import {
  clearStoredToken,
  createItem,
  deleteItemById,
  fetchCurrentUser,
  fetchItems,
  getStoredToken,
  loginUser,
  loginWithGoogle,
  registerUser,
  setStoredToken
} from './utils/authApi';

const EMPTY_ITEM = {
  category: 'top', name: '', warmthRating: 5,
  weatherProtection: 'none', formalities: [],
  image: null
};
const PREDICTION_CONFIDENCE_THRESHOLD = 65;
const EMPTY_CLOTHES = {
  hat: [], top: [], bottom: [], outerwear: [], shoes: [], accessories: []
};
const CITY_STORAGE_KEY = 'weatherfit_selected_city';

const getInitialCity = () => {
  try {
    const stored = localStorage.getItem(CITY_STORAGE_KEY);
    return stored && stored.trim().length > 0 ? stored : 'Dubai';
  } catch {
    return 'Dubai';
  }
};

const SmartOutfitSelector = () => {
  const [temperature, setTemperature] = useState(null);
  const [city, setCity] = useState(getInitialCity);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [activity, setActivity] = useState('casual');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY_ITEM);
  const [imagePreview, setImagePreview] = useState(null);
  const [clothes, setClothes] = useState(EMPTY_CLOTHES);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [predictionState, setPredictionState] = useState({
    loading: false,
    error: '',
    confidence: null,
    confidenceByHead: null,
    needsReview: false
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [deletingItemIds, setDeletingItemIds] = useState(new Set());
  const [preloadLoading, setPreloadLoading] = useState(false);
  const [deletedWhileModalOpen, setDeletedWhileModalOpen] = useState(false);

  useEffect(() => { fetchWeather(); }, [city]);
  useEffect(() => {
    try {
      localStorage.setItem(CITY_STORAGE_KEY, city);
    } catch {
      // Ignore storage failures; app can still function with in-memory state.
    }
  }, [city]);
  useEffect(() => { bootstrapAuth(); }, []);
  useEffect(() => {
    if (currentUser) {
      loadClothes();
    } else {
      setClothes(EMPTY_CLOTHES);
      setRecommendations([]);
      setSelectedOutfit(null);
    }
  }, [currentUser]);
  useEffect(() => {
    if (temperature !== null && weatherData) generateRecommendations();
  }, [temperature, weatherData, clothes, activity]);

  useEffect(() => {
    setSelectedOutfit(null);
  }, [activity]);

  useEffect(() => {
    if (recommendations.length > 0) setSelectedOutfit(recommendations[0].outfits[0]);
  }, [recommendations]);

  const mapApiItemToUiItem = (item) => ({
    id: item.id,
    category: item.category,
    name: item.name,
    warmthRating: item.warmth_rating,
    weatherProtection: item.weather_protection,
    formalities: item.formalities || [],
    image: item.image_url || null
  });

  const buildItemSignature = (item) => {
    const formalities = [...(item.formalities || [])]
      .map((value) => (value || '').toString().trim().toLowerCase())
      .sort()
      .join('|');

    return [
      (item.name || '').toString().trim().toLowerCase(),
      (item.category || '').toString().trim().toLowerCase(),
      Number(item.warmthRating ?? 5),
      (item.weatherProtection || 'none').toString().trim().toLowerCase(),
      formalities,
      (item.image || '').toString().trim()
    ].join('::');
  };

  const toGroupedClothes = (items) => {
    const grouped = { ...EMPTY_CLOTHES };
    const seenByCategory = {
      hat: new Set(),
      top: new Set(),
      bottom: new Set(),
      outerwear: new Set(),
      shoes: new Set(),
      accessories: new Set()
    };

    items.forEach((item) => {
      if (!grouped[item.category]) return;
      const dedupeKey = item.id ?? buildItemSignature(item);
      if (seenByCategory[item.category].has(dedupeKey)) return;
      seenByCategory[item.category].add(dedupeKey);
      grouped[item.category].push(item);
    });
    return grouped;
  };

  const loadClothes = async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const items = await fetchItems(token);
      const mapped = items.map(mapApiItemToUiItem);
      setClothes(toGroupedClothes(mapped));
    } catch (e) { console.error(e); }
  };

  const bootstrapAuth = async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const me = await fetchCurrentUser(token);
      setCurrentUser(me);
    } catch (e) {
      clearStoredToken();
      setCurrentUser(null);
    }
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
    const token = getStoredToken();
    if (!token) {
      setAuthMode('signin');
      setAuthError('');
      setAuthModalOpen(true);
      return;
    }

    try {
      await createItem(token, {
        name: newItem.name.trim(),
        category: newItem.category,
        warmth_rating: newItem.warmthRating,
        weather_protection: newItem.weatherProtection,
        formalities: newItem.formalities || [],
        image_url: newItem.image || null
      });
      await loadClothes();
    } catch (e) {
      console.error(e);
      return;
    }

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
    const token = getStoredToken();
    if (!token) {
      setAuthMode('signin');
      setAuthError('');
      setAuthModalOpen(true);
      return;
    }
    if (preloadLoading) return;

    setPreloadLoading(true);
    try {
      const existingItems = Object.values(clothes).flat();
      const existingSignatures = new Set(existingItems.map(buildItemSignature));
      const preloadItems = Object.values(PRELOAD_WARDROBE).flat();
      for (const item of preloadItems) {
        const signature = buildItemSignature(item);
        if (existingSignatures.has(signature)) continue;

        await createItem(token, {
          name: item.name,
          category: item.category,
          warmth_rating: item.warmthRating,
          weather_protection: item.weatherProtection,
          formalities: item.formalities || [],
          image_url: item.image || null
        });
        existingSignatures.add(signature);
      }
      await loadClothes();
    } catch (e) {
      console.error(e);
    } finally {
      setPreloadLoading(false);
    }
  };

  const deleteItem = async (itemId) => {
    const token = getStoredToken();
    if (!token) return;
    if (deletingItemIds.has(itemId)) return;

    setDeletingItemIds((prev) => new Set(prev).add(itemId));
    try {
      await deleteItemById(token, itemId);
      setDeletedWhileModalOpen(true);
      setClothes((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((category) => {
          next[category] = next[category].filter((item) => item.id !== itemId);
        });
        return next;
      });
    } catch (e) {
      if (!String(e.message || '').includes('404')) {
        console.error(e);
      }
    } finally {
      setDeletingItemIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const hasClothes = Object.values(clothes).some(arr => arr.length > 0);

  const resetSessionUiState = () => {
    setClothes(EMPTY_CLOTHES);
    setRecommendations([]);
    setSelectedOutfit(null);
    setShowAddModal(false);
    setShowDeleteModal(false);
    setNewItem(EMPTY_ITEM);
    setImagePreview(null);
    setPreloadLoading(false);
    setDeletingItemIds(new Set());
    setPredictionState({
      loading: false,
      error: '',
      confidence: null,
      confidenceByHead: null,
      needsReview: false
    });
  };

  const handleAuthSubmit = async ({ email, password }) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = authMode === 'signin'
        ? await loginUser({ email, password })
        : await registerUser({ email, password });
      // Clear previous session artifacts before loading account-specific data.
      resetSessionUiState();
      setStoredToken(response.access_token);
      setCurrentUser(response.user);
      setAuthModalOpen(false);
    } catch (error) {
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    clearStoredToken();
    setCurrentUser(null);
    resetSessionUiState();
    window.location.reload();
  };

  const handleDeleteModalOpen = () => {
    setDeletedWhileModalOpen(false);
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    if (deletedWhileModalOpen) {
      window.location.reload();
    }
  };

  const handleGoogleAuth = async (credential) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await loginWithGoogle(credential);
      resetSessionUiState();
      setStoredToken(response.access_token);
      setCurrentUser(response.user);
      setAuthModalOpen(false);
    } catch (error) {
      setAuthError(error.message || 'Google sign-in failed');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div
      style={{ minHeight: '100vh', background: '#f5f5f7', padding: '40px 20px' }}
      aria-label="WeatherFit application"
    >
      <div style={{ maxWidth: selectedOutfit ? '1000px' : '600px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
        <TopNav
          currentUser={currentUser}
          onSignOut={handleSignOut}
          onRequestSignIn={() => {
            setAuthMode('signin');
            setAuthError('');
            setAuthModalOpen(true);
          }}
        />

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
            disabled={preloadLoading}
            style={{
              height: '50px',
              padding: '0 16px',
              flexShrink: 0,
              background: 'white',
              border: '1px solid #d2d2d7',
              borderRadius: '12px',
              cursor: preloadLoading ? 'default' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#86868b',
              transition: 'all 0.2s',
              opacity: preloadLoading ? 0.6 : 1
            }}
            onMouseEnter={e => {
              if (preloadLoading) return;
              e.currentTarget.style.borderColor = '#133f63';
              e.currentTarget.style.color = '#133f63';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#d2d2d7';
              e.currentTarget.style.color = '#86868b';
            }}
          >
            {preloadLoading ? 'Preloading...' : 'Preload Closet'}
          </button>
          <button
            onClick={handleDeleteModalOpen}
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
        onClose={handleDeleteModalClose}
        clothes={clothes}
        onDelete={deleteItem}
        deletingItemIds={deletingItemIds}
      />

      <AuthModal
        show={authModalOpen}
        mode={authMode}
        setMode={setAuthMode}
        loading={authLoading}
        error={authError}
        onSubmit={handleAuthSubmit}
        onGoogleCredential={handleGoogleAuth}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthError('');
        }}
      />
    </div>
  );
};

export default SmartOutfitSelector;