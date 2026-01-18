import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const PrivacyPolicy = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="min-h-screen bg-stone-50 text-stone-800 p-8 md:p-16 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-stone-400 hover:text-stone-600 mb-8 transition-colors"
                >
                    <ArrowLeft size={20} /> Zpět
                </button>

                <h1 className="text-4xl font-black mb-8 font-title">Zásady ochrany osobních údajů</h1>
                <div className="prose prose-stone prose-lg mb-12">
                    <p className="text-sm text-stone-500 mb-8">Poslední aktualizace: {new Date().toLocaleDateString()}</p>

                    <h3 className="text-xl font-bold mt-8 mb-4">1. Správce osobních údajů</h3>
                    <p>
                        Správcem osobních údajů je provozovatel aplikace Skywhale. (dále jen "My" nebo "Správce").
                        Vaše osobní údaje zpracováváme v souladu s Nařízením Evropského parlamentu a Rady (EU) 2016/679 (GDPR).
                    </p>

                    <h3 className="text-xl font-bold mt-8 mb-4">2. Jaké údaje shromažďujeme</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Identifikační údaje:</strong> E-mailová adresa, uživatelské jméno / přezdívka, ID uživatele (UUID).</li>
                        <li><strong>Obsahová data:</strong> Textové zadání příběhů (prompty), vygenerované obrázky, hlasové nahrávky a struktura vytvořených knih.</li>
                        <li><strong>Technické údaje:</strong> IP adresa, typ zařízení, verze prohlížeče, logy přístupů a chybová hlášení.</li>
                        <li><strong>Platební údaje:</strong> Informace o zakoupených balíčcích, stavu předplatného (aktivní/zrušené), historie transakcí. Kompletní čísla karet <strong>nikdy</strong> neukládáme (zpracovává Stripe).</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-8 mb-4">3. Účel zpracování</h3>
                    <p>Vaše údaje využíváme primárně pro:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Poskytování služby:</strong> Přihlášení do aplikace, ukládání vašich příběhů, zpracování AI generování.</li>
                        <li><strong>Zlepšování služeb:</strong> Analýza chyb a optimalizace výkonu aplikace.</li>
                        <li><strong>Komunikace:</strong> Zasílání transakčních e-mailů (reset hesla, potvrzení o platbě).</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-8 mb-4">4. Zpracovatelé a předávání dat</h3>
                    <p>Pro zajištění chodu služby využíváme prověřené partnery (tzv. zpracovatele), kteří mohou mít přístup k nezbytným údajům:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Supabase:</strong> Hosting databáze a autentizace uživatelů.</li>
                        <li><strong>Stripe:</strong> Zpracování plateb.</li>
                        <li><strong>Replicate / OpenAI / Black Forest Labs:</strong> Poskytovatelé AI modelů. Těmto službám jsou předávány pouze textové prompty pro generování, nikoliv vaše osobní identifikační údaje.</li>
                    </ul>
                    <p>Všechna data jsou uložena na zabezpečených serverech a přenášena šifrovaným spojením (SSL/TLS).</p>

                    <h3 className="text-xl font-bold mt-8 mb-4">5. Automatizované rozhodování a Profilování</h3>
                    <p>
                        V rámci poskytování služby <strong>nedochází</strong> k automatizovanému rozhodování s právními účinky pro Uživatele ve smyslu čl. 22 GDPR.
                        Generativní AI je využívána pouze jako kreativní nástroj na základě pokynů Uživatele.
                    </p>

                    <h3 className="text-xl font-bold mt-8 mb-4">6. Vaše práva</h3>
                    <p>Dle GDPR a souvisejících předpisů máte právo:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Požadovat přístup ke svým osobním údajům a přenositelnost dat.</li>
                        <li>Požadovat opravu nepřesných údajů.</li>
                        <li>Požadovat výmaz (právo "být zapomenut"), pokud již údaje nejsou potřebné.</li>
                        <li>Vznést námitku proti zpracování.</li>
                        <li><strong>Právo na lidský zásah:</strong> V případě pochybností o fungování AI nástrojů máte právo kontaktovat naši podporu.</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-8 mb-4">7. Cookies</h3>
                    <p>
                        Aplikace používá soubory cookies pro zajištění technické funkčnosti (přihlášení, košík).
                        Analytické a marketingové cookies využíváme pouze s vaším výslovným souhlasem uděleným prostřednictvím cookie lišty.
                    </p>

                    <div className="mt-12 p-6 bg-stone-100 rounded-xl border border-stone-200">
                        <h4 className="font-bold text-stone-900 mb-2">Kontakt pro uplatnění práv</h4>
                        <p>
                            Své žadosti ohledně ochrany osobních údajů směřujte na e-mail: <a href="mailto:support@skywhale.art" className="underline hover:text-stone-600">support@skywhale.art</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
