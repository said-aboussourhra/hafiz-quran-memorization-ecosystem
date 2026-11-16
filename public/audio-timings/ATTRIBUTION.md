# Word timing data attribution

The bundled timing JSON under `islam-sobhi/` and `maher-muaiqly/` is from **baklarrrr/quran-timings** (422 source recordings across its full catalog), licensed under **CC BY 4.0**. The app includes only the two reciters whose timing payloads it consumes and preserves the source JSON's `audio_url`, so each map is used with its matching recording. These are automatically aligned timestamps, not a claim of human verification; some surahs or ayahs are untimed. Where a map is partial, untimed words are deliberately left unhighlighted. No audio is copied into this project.

- Source and methodology: https://github.com/baklarrrr/quran-timings
- License: https://creativecommons.org/licenses/by/4.0/
- Timing-data attribution: baklarrrr, “Quran recitation word timings”, CC BY 4.0.
- Audio remains owned by each reciter and publisher; the app streams the original source URL in the timing record.

Quran.com chapter timing responses are fetched on demand and paired with the exact `audio_url` returned in the same response. Those responses are not redistributed here.
