# 🐳 PROJECT SKYWHALE: Audit & Strategy Report (Jan 18, 2026)

**Autor:** Antigravity Agent (Architect Mode)
**Stav:** 🟢 DEPLOYED & STABLE (Auth Overlay Fixed)

---

## 1. 🛡️ Diagnostika a Stav Projektu (Health Check)

Provedl jsem hloubkovou kontrolu klíčových souborů (`storyteller.ts`, `useGemini.ts`, `index.ts` funkce). Zde jsou výsledky:

### ✅ Co funguje skvěle:
*   **Auth Pipeline (Gateway Bypass)**: Oprava "401 Unauthorized" vypnutím verifikace na bráně a spoléháním se na `getUser(token)` uvnitř funkce je bezpečná a funkční. Vaše `edge-functions.ts` je nyní robustní.
*   **Flux 2.0 JSON Protocol**: Měl jsem obavy, že `storyteller.ts` generuje složité JSONy (`multi_reference_config`), které Edge Funkce nepochopí. **Mýlil jsem se.** Funkce `generate-story-image` má v řádcích 149-163 logiku pro parsování tohoto JSONu. Architektura je tedy konzistentní a připravená na "Slot-based" generování.
*   **Zálohování (Persistence)**: `useStory.ts` správně ukládá data do tabulek `books` a `pages` s transakční logikou.

### ⚠️ Rizika a Chyby (Kritické):
1.  **Bezpečnostní díra (API Keys)**:
    *   Soubory `storyteller.ts` a `useGemini.ts` používají `import.meta.env.VITE_OPENAI_API_KEY`.
    *   **Riziko:** Tento klíč je v klientském kódu. Pokud aplikaci zveřejníte, chytrý útočník ho může z prohlížeče vytáhnout.
    *   **Doporučení:** Přesunout logiku generování textu (OpenAI) do nové Edge Funkce `generate-story-content`. Klient by volal pouze tuto funkci, klíč by zůstal skrytý na serveru.

2.  **Duplicitní "Image Prompt" logika**:
    *   V `storyteller.ts` existují pole `image_prompt` (zastaralé) a `art_prompt` (nové). Fallback logika (nouzový režim) v řádku 318 používá JSON, ale je dobré sjednotit názvosloví, aby nedocházelo k matení frontend renderu.

---

## 2. 🚀 Návrhy na Vylepšení (Roadmap ideas)

Zde je 3-bodový plán pro posun aplikace na další úroveň:

### A. Komunitní Knihovna (Social Library)
Máte v databázi pole `is_public`. Chybí nám UI:
*   **Feature:** "Síň Slávy" - stránka, kde si uživatelé mohou prohlížet veřejné knihy ostatních.
*   **Interakce:** Tlačítko "Remixovat příběh" (Duplikovat strukturu, ale vygenerovat vlastní obrázky).

### B. "Přečti mi to" (AI Voiceover)
Máte funkci `generate-audio` (ElevenLabs), ale v editoru ji nevidím aktivně využitou.
*   **Feature:** Autoplay tlačítko na každé stránce.
*   **Level Up:** Nechat ElevenLabs vygenerovat "Soundtrack" (ne jen hlas, ale i šum lesa na pozadí).

### C. "Magic Mirror" Selfie Integrace
V kódu vidím přípravu na `magic_mirror_url`, ale v UI editoru (Greeting Cards) to není plně prominentní.
*   **Feature:** Umožnit dítěti nahrát fotku *předtím*, než se začne psát příběh, a AI automaticky vloží jeho tvář do `hero_dna` slotu pro celý příběh.

---

## 3. 🤖 FEASIBILITY STUDY: AI Chat Module (Vypravěč 2.0)

**Dotaz:** *Můžeme vyměnit statický formulář (Vypravěče) za AI Chat?*

**Verdikt:** **ANO, ROZHODNĚ.** Je to technicky proveditelné a z hlediska UX (User Experience) pro děti mnohem lepší.

### Jak by to fungovalo?

Místo vyplňování políček (Jméno, Prostředí, Styl) by dítě vstoupilo do chatu s "Múzou".

**Scénář:**
1.  **AI:** "Ahoj! Jsem tvoje kouzelná Múza. O čem budeme dnes psát? O drakovi, o robotovi, nebo o tobě?"
2.  **Dítě:** "O mně! Jsem rytíř."
3.  **AI:** "Skvělé, pane rytíři! A jak se jmenuješ a jakou barvu má tvé brnění?"
4.  **Dítě:** "Jmenuju se Honza a mám zlaté brnění."
5.  **AI (na pozadí):** *Aktualizuje JSON config: `{ hero: "Knight Honza", visual_dna: "Gold Armor" }`.*
6.  **AI:** "Mám to! A kde se náš příběh odehrává? Na hradě nebo v jeskyni?"

### Technická Realizace:
*   **Backend:** Nemusíme měnit `storyteller.ts`! Pouze vytvoříme "Frontend Agenta" (React komponentu), který sbírá data.
*   **Výstup:** Jakmile AI Agent usoudí, že má dost informací, zavolá existující funkci `generateStoryStructure(params)` s nasbíranými daty.
*   **Cena:** Bude to stát trochu více tokenů (každá zpráva v chatu něco stojí), ale zážitek bude "Premium".

### Plán přechodu:
1.  Vytvořit komponentu `StoryArchitectChat.tsx`.
2.  Použít `useGemini` hook pro řízení konverzace.
3.  Vytvořit "State Machine", který hlídá, jestli už máme: Hlavní Postavu, Prostředí a Styl.
4.  Nahradit routu `/create` tímto chatem.

**Doporučení:** Jděte do toho. Je to "Killer Feature", která odliší vaši aplikaci od obyčejných generátorů. Děti si raději povídají, než vyplňují formuláře.

---

### 📝 Závěr
Projekt je technicky zdravý. Auth krize je zažehnána. Největší dluh je bezpečnost API klíčů. Největší příležitost je **AI Chat Module**.

*Antigravity Agent*
