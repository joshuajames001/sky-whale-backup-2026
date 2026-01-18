import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const TermsOfService = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="min-h-screen bg-stone-50 text-stone-800 p-8 md:p-16 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-stone-400 hover:text-stone-600 mb-8 transition-colors"
                >
                    <ArrowLeft size={20} /> Zpět
                </button>

                <h1 className="text-4xl font-black mb-8 font-title">Všeobecné obchodní podmínky</h1>

                <div className="prose prose-stone prose-lg mb-12">
                    <p className="text-sm text-stone-500 mb-8">Poslední aktualizace: {new Date().toLocaleDateString()}</p>

                    <h3 className="text-xl font-bold mt-8 mb-4">1. Úvodní ustanovení</h3>
                    <p>
                        Tyto všeobecné obchodní podmínky (dále jen "Podmínky") upravují práva a povinnosti mezi provozovatelem aplikace Skywhale. (dále jen "Poskytovatel")
                        a uživatelem (dále jen "Uživatel") při využívání softwarové služby dostupné na doméně skywhale.art (dále jen "Služba").
                    </p>
                    <p>
                        Registrací uživatelského účtu nebo využíváním Služby vyjadřuje Uživatel svůj bezvýhradný souhlas s těmito Podmínkami.
                    </p>

                    <h3 className="text-xl font-bold mt-8 mb-4">2. Uživatelský účet</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Pro využívání pokročilých funkcí Služby je nutná registrace.</li>
                        <li>Uživatel je povinen uvádět pravdivé údaje a udržovat je aktuální.</li>
                        <li>Uživatel nese plnou odpovědnost za bezpečnost svých přihlašovacích údajů a za veškeré aktivity prováděné pod jeho účtem.</li>
                        <li>Poskytovatel si vyhrazuje právo zablokovat nebo zrušit účet, který porušuje tyto Podmínky nebo právní předpisy.</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-8 mb-4">3. Virtuální měna ("Energie") a Předplatné</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Energie:</strong> Některé funkce Služby jsou zpoplatněny formou virtuálních kreditů ("Energie"). Jedná se o licenci k využití funkcí, nikoliv o měnu.</li>
                        <li><strong>Jednorázové nákupy:</strong> Uživatel si může zakoupit balíček Energie. Tato transakce je konečná a nevratná ihned po připsání Energie.</li>
                        <li><strong>Předplatné (Subscription):</strong>
                            <ul className="list-disc pl-5 mt-1 space-y-1 text-stone-600">
                                <li>Předplatné se sjednává na dobu neurčitou s měsíční nebo roční periodou opakování.</li>
                                <li><strong>Automatická obnova:</strong> Platba za další období se strhává automaticky z uložené karty 24 hodin před koncem aktuálního období.</li>
                                <li><strong>Zrušení:</strong> Předplatné lze kdykoliv zrušit v nastavení profilu. Zrušení nabývá účinnosti ke konci aktuálního předplaceného období.</li>
                                <li>Nevyčerpaná Energie z předplatného se převádí do dalšího měsíce, pokud je předplatné aktivní.</li>
                            </ul>
                        </li>
                        <li><strong>Platby:</strong> Probíhají přes zabezpečenou bránu Stripe. Poskytovatel nemá přístup k citlivým údajům o kartě.</li>
                        <li><strong>Refundace:</strong> V souladu s § 1837 písm. l) občanského zákoníku nemá spotřebitel právo na odstoupení od smlouvy o dodání digitálního obsahu, pokud byl dodán s jeho předchozím výslovným souhlasem před uplynutím lhůty pro odstoupení.</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-8 mb-4">4. Generovaný obsah, AI a Autorská práva (AI Act Compliance)</h3>
                    <p>
                        Služba využívá modely generativní umělé inteligence (např. Flux, Replicate) pro tvorbu obsahu.
                        V souladu s nařízením EU o umělé inteligenci (AI Act) je Uživatel informován, že veškerý výstup je strojově generovaný.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Transparentnost:</strong> Obsah vygenerovaný Službou může být označen metadaty nebo vodoznakem identifikujícím původ (AI).</li>
                        <li><strong>Vlastnictví:</strong> V rozsahu povoleném zákonem náleží práva k vygenerovanému obsahu Uživateli.</li>
                        <li><strong>Licence pro Službu:</strong> Uživatel uděluje Poskytovateli nevýhradní oprávnění zobrazovat, ukládat a zpracovávat vygenerovaný obsah pro účely poskytování Služby.</li>
                        <li><strong>Odpovědnost:</strong> Uživatel plně odpovídá za to, jakým způsobem generovaný obsah použije. Poskytovatel nenese odpovědnost za případné porušení práv třetích stran.</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-8 mb-4">5. Pravidla chování (Digital Services Act)</h3>
                    <p>
                        Jako digitální platforma jsme povinni bránit šíření nezákonného obsahu. Je přísně zakázáno používat Službu k vytváření:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Je nezákonný, nenávistný, pornografický nebo podněcující k násilí.</li>
                        <li>Porušuje autorská práva nebo práva na ochranu osobnosti třetích stran.</li>
                        <li>Obsahuje škodlivý kód nebo se pokouší narušit bezpečnost Služby.</li>
                    </ul>
                    <p>Při zjištění takové činnosti bude účet Uživatele okamžitě zrušen bez nároku na náhradu.</p>

                    <h3 className="text-xl font-bold mt-8 mb-4">6. Odpovědnost za vady a Garance</h3>
                    <p>
                        Služba je poskytována "tak jak je" (as-is). Poskytovatel vzhledem k povaze technologie umělé inteligence negarantuje, že:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Služba bude dostupná nepřetržitě a bez chyb.</li>
                        <li>Vygenerovaný obsah bude vždy přesně odpovídat zadání Uživatele (AI může halucinovat nebo interpretovat zadání neočekávaně).</li>
                    </ul>
                    <p>
                        Poskytovatel neodpovídá za přímé či nepřímé škody vzniklé použitím nebo nemožností použití Služby, včetně ztráty dat.
                    </p>

                    <h3 className="text-xl font-bold mt-8 mb-4">7. Závěrečná ustanovení</h3>
                    <p>
                        Tyto Podmínky se řídí právním řádem České republiky. Spory budou řešeny příslušnými soudy v ČR.
                        Poskytovatel si vyhrazuje právo tyto Podmínky měnit. O změnách bude Uživatel informován v rozhraní Aplikace.
                    </p>

                    <div className="mt-12 p-6 bg-amber-50 rounded-xl border border-amber-200">
                        <h4 className="font-bold text-amber-900 mb-2">Kontaktní a Identifikační údaje</h4>
                        <p className="text-sm text-amber-800">
                            Provozovatel: <strong>[DOPLNIT CELÉ JMÉNO NEBO NÁZEV FIRMY]</strong><br />
                            IČO: [DOPLNIT IČO]<br />
                            Sídlo: [DOPLNIT ADRESU SÍDLA]<br />
                            Kontakt: support@skywhale.art
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
