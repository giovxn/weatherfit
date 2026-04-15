# WeatherFit
A rule-based expert system that recommends outfits from your personal wardrobe based on real-time weather and activity context.

---

## Why this project
WeatherFit is not a temperature-only outfit app. It combines an expert system and ML attribute prediction to recommend what to wear based on full weather conditions and daily context (for example rain, wind, and activity), which is more practical than relying on temperature alone.

## Live Demo
Video walkthrough: [https://youtu.be/IDxKMkDW8mA](https://youtu.be/IDxKMkDW8mA)

<img src="docs/screenshots/home.png" alt="WeatherFit home screen" width="400" />
<img src="docs/screenshots/add-item-ml.png" alt="Add item modal with ML autofill" width="400" />
<img src="docs/screenshots/recommendation.png" alt="Outfit recommendation output" width="400" />

## Stack
React, Vite, IndexedDB, OpenWeatherMap API

## Performance and limitations
The ML auto-fill model performs strongly on category (98.77%) and formality (89.83%), while warmth remains the hardest attribute (73.69%) due to label ambiguity and seasonal overlap. Simplifying category labels from 27 to 5 groups improved category accuracy (+2.92%), but real-world uploads can still be harder than validation images because training data is mostly clean product photography.

## Running
Requires [Node.js](https://nodejs.org)

Create a `.env` file in the project root:
```bash
cp .env.example .env
```

```bash
npm install
npm run dev
```
Open `http://localhost:3000` — click Preload Closet (or upload your own) on first launch.

*The trained model weights are not included in this repository, primarily to maintain academic integrity. The full ML service implementation and integration flow are provided, and the project can be run by supplying your own trained checkpoint (best_model.pth) in ml-service (or via ML_MODEL_PATH).*

## Structure
- `src/utils/expertSystem.js` — all rule logic
- `src/utils/preloadData.js` — sample wardrobe
- `src/components/` — UI components
- `public/closet/` — wardrobe images
