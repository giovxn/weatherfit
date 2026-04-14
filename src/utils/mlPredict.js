const DEFAULT_PREDICT_URL = '/api/ml/predict';

export async function predictClothingAttributes(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(DEFAULT_PREDICT_URL, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Prediction request failed (${response.status})`);
  }

  return response.json();
}
