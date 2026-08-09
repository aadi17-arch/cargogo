import { GeocodingProvider } from './provider';

export class GeminiProvider extends GeocodingProvider {
  name = 'Gemini';
  timeoutMs = 5000;
  private apiKey = process.env.GEMINI_API_KEY;

  async reverse(lat: number, lng: number): Promise<string | null> {
    if (!this.apiKey) return null;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${this.apiKey}`;
      const prompt = `
        You are a professional logistics mapping agent.
        Resolve these coordinates into a clean Indian street address:
        Latitude: ${lat}
        Longitude: ${lng}
        Return ONLY a JSON object matching this structure with no markdown or formatting:
        {"display_name": "Formatted full address"}
      `;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }),
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      if (!res.ok) return null;
      const data = await res.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = JSON.parse(text.trim());
      return parsed.display_name || null;
    } catch {
      return null;
    }
  }
}
